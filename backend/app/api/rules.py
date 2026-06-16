from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.models import User, AuditRule
from app.models.schemas import AuditRuleCreate, AuditRuleResponse

router = APIRouter()


@router.post("/", response_model=AuditRuleResponse)
async def create_rule(
    rule_data: AuditRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["admin", "auditor"]:
        raise HTTPException(status_code=403, detail="权限不足")
    
    rule = AuditRule(**rule_data.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.get("/", response_model=List[AuditRuleResponse])
async def list_rules(
    category: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(AuditRule)
    if category:
        query = query.where(AuditRule.category == category)
    result = await db.execute(query.order_by(AuditRule.created_at.desc()))
    return result.scalars().all()


@router.get("/{rule_id}", response_model=AuditRuleResponse)
async def get_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(AuditRule).where(AuditRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    return rule


@router.put("/{rule_id}", response_model=AuditRuleResponse)
async def update_rule(
    rule_id: int,
    rule_data: AuditRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["admin", "auditor"]:
        raise HTTPException(status_code=403, detail="权限不足")
    
    result = await db.execute(select(AuditRule).where(AuditRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    
    for key, value in rule_data.model_dump().items():
        setattr(rule, key, value)
    
    await db.commit()
    await db.refresh(rule)
    return rule


@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可删除规则")
    
    result = await db.execute(select(AuditRule).where(AuditRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    
    await db.delete(rule)
    await db.commit()
    return {"message": "删除成功"}
