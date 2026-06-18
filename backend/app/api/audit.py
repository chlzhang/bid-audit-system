import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update as sa_update
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.models import User, Project, AuditRecord, Difference, Template
from app.models.schemas import AuditRecordCreate
from app.services.audit.service import audit_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _diff_to_dict(d: Difference) -> dict:
    return {
        "id": d.id,
        "audit_record_id": d.audit_record_id,
        "diff_type": d.diff_type,
        "category": d.category,
        "location": d.location,
        "template_content": d.template_content,
        "project_content": d.project_content,
        "risk_level": d.risk_level,
        "description": d.description,
        "suggestion": d.suggestion,
        "created_at": d.created_at.isoformat() if d.created_at else None,
    }


def _record_to_dict(r: AuditRecord, with_diffs: bool = True) -> dict:
    result = {
        "id": r.id,
        "project_id": r.project_id,
        "auditor_id": r.auditor_id,
        "status": r.status,
        "risk_level": r.risk_level,
        "summary": r.summary,
        "report_content": r.report_content,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "completed_at": r.completed_at.isoformat() if r.completed_at else None,
    }
    if with_diffs:
        result["differences"] = [_diff_to_dict(d) for d in r.differences]
    return result


@router.post("/start")
async def start_audit(
    audit_data: AuditRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Project).where(Project.id == audit_data.project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

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
        audit_record.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)

        project.status = "completed"

        report = audit_service.generate_report(audit_result)
        audit_record.report_content = report

        await db.commit()

        diff_result = await db.execute(
            select(Difference).where(Difference.audit_record_id == audit_record.id)
        )
        diffs = diff_result.scalars().all()

        return {
            "audit_record": {
                **_record_to_dict(audit_record, with_diffs=False),
                "differences": [_diff_to_dict(d) for d in diffs],
            },
            "total_differences": audit_result.get("total_differences", 0),
            "high_risk_count": audit_result.get("high_risk_count", 0),
            "medium_risk_count": audit_result.get("medium_risk_count", 0),
            "low_risk_count": audit_result.get("low_risk_count", 0),
            "summary": audit_result.get("summary", "")
        }

    except Exception:
        error_id = str(uuid.uuid4())[:8]
        logger.exception("Audit failed error_id=%s", error_id)
        await db.rollback()
        await db.execute(
            sa_update(AuditRecord)
            .where(AuditRecord.id == audit_record.id)
            .values(status="failed", summary="审核处理失败，错误ID: %s" % error_id)
        )
        await db.commit()
        raise HTTPException(
            status_code=500,
            detail="审核服务暂时不可用，请联系管理员 (错误ID: %s)" % error_id
        )


@router.get("/records")
async def list_audit_records(
    project_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(AuditRecord).options(selectinload(AuditRecord.differences))
    if project_id:
        query = query.where(AuditRecord.project_id == project_id)
    result = await db.execute(query.order_by(AuditRecord.created_at.desc()))
    records = result.scalars().all()
    return [_record_to_dict(r) for r in records]


@router.get("/records/{record_id}")
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
    return _record_to_dict(record)


@router.get("/records/{record_id}/report")
async def get_audit_report(
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

    if record.report_content:
        differences = record.differences
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
        return {"report": record.report_content, "audit_result": audit_result}

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
