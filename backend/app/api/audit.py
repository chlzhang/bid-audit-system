from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.models import User, Project, AuditRecord, Difference
from app.models.schemas import AuditRecordCreate, AuditRecordResponse, AuditResult
from app.services.audit.service import audit_service

router = APIRouter()


@router.post("/start", response_model=AuditResult)
async def start_audit(
    audit_data: AuditRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Project).where(Project.id == audit_data.project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    
    from app.models.models import Template
    template_result = await db.execute(select(Template).where(Template.id == project.template_id))
    template = template_result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="关联模板不存在")
    
    audit_record = AuditRecord(
        project_id=project.id,
        auditor_id=current_user.id,
        status="in_progress"
    )
    db.add(audit_record)
    await db.commit()
    await db.refresh(audit_record)
    
    try:
        audit_result = await audit_service.perform_audit(
            template.file_path,
            project.file_path
        )
        
        for diff_data in audit_result.get("differences", []):
            difference = Difference(
                audit_record_id=audit_record.id,
                diff_type=diff_data.get("type", "param_diff"),
                category=diff_data.get("category"),
                location=diff_data.get("location"),
                template_content=diff_data.get("template_content"),
                project_content=diff_data.get("project_content"),
                risk_level=diff_data.get("risk_level", "low"),
                description=diff_data.get("description"),
                suggestion=diff_data.get("suggestion")
            )
            db.add(difference)
        
        audit_record.status = "completed"
        audit_record.risk_level = audit_result.get("overall_risk_level", "low")
        audit_record.summary = audit_result.get("summary")
        audit_record.completed_at = datetime.utcnow()
        
        project.status = "completed"
        
        await db.commit()
        
        result = await db.execute(
            select(AuditRecord)
            .options(selectinload(AuditRecord.differences))
            .where(AuditRecord.id == audit_record.id)
        )
        audit_record = result.scalar_one()
        
        return AuditResult(
            audit_record=audit_record,
            total_differences=audit_result.get("total_differences", 0),
            high_risk_count=audit_result.get("high_risk_count", 0),
            medium_risk_count=audit_result.get("medium_risk_count", 0),
            low_risk_count=audit_result.get("low_risk_count", 0),
            summary=audit_result.get("summary", "")
        )
        
    except Exception as e:
        audit_record.status = "failed"
        audit_record.summary = f"审核失败: {str(e)}"
        await db.commit()
        raise HTTPException(status_code=500, detail=f"审核失败: {str(e)}")


@router.get("/records", response_model=List[AuditRecordResponse])
async def list_audit_records(
    project_id: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(AuditRecord).options(selectinload(AuditRecord.differences))
    if project_id:
        query = query.where(AuditRecord.project_id == project_id)
    result = await db.execute(query.order_by(AuditRecord.created_at.desc()))
    return result.scalars().all()


@router.get("/records/{record_id}", response_model=AuditRecordResponse)
async def get_audit_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(AuditRecord)
        .options(selectinload(AuditRecord.differences))
        .where(AuditRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="审核记录不存在")
    return record


@router.get("/records/{record_id}/report")
async def get_audit_report(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(AuditRecord).where(AuditRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="审核记录不存在")
    
    differences_result = await db.execute(
        select(Difference).where(Difference.audit_record_id == record_id)
    )
    differences = differences_result.scalars().all()
    
    audit_result = {
        "overall_risk_level": record.risk_level if record.risk_level else "low",
        "total_differences": len(differences),
        "high_risk_count": sum(1 for d in differences if d.risk_level == "high"),
        "medium_risk_count": sum(1 for d in differences if d.risk_level == "medium"),
        "low_risk_count": sum(1 for d in differences if d.risk_level == "low"),
        "summary": record.summary or "",
        "differences": [
            {
                "type": d.diff_type,
                "category": d.category,
                "location": d.location,
                "template_content": d.template_content,
                "project_content": d.project_content,
                "risk_level": d.risk_level if d.risk_level else "low",
                "description": d.description,
                "suggestion": d.suggestion
            }
            for d in differences
        ]
    }
    
    report = audit_service.generate_report(audit_result)
    return {"report": report, "audit_result": audit_result}
