from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import os
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.config import settings
from app.models.models import User, Template
from app.models.schemas import TemplateCreate, TemplateResponse
from app.utils.file_utils import safe_file_path, validate_file_size

router = APIRouter()


@router.post("/", response_model=TemplateResponse)
async def create_template(
    name: str = Form(..., min_length=1, max_length=100),
    description: str = Form(None),
    version: str = Form("1.0"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role.lower() not in ["admin", "auditor"]:
        raise HTTPException(status_code=403, detail="权限不足")

    content = await file.read()
    validate_file_size(content, settings.MAX_FILE_SIZE)

    file_path = safe_file_path(settings.UPLOAD_DIR, "template", file.filename)

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    template = Template(
        name=name,
        description=description,
        version=version,
        file_path=file_path,
        created_by=current_user.id
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Template).order_by(Template.created_at.desc()))
    return result.scalars().all()


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    return template


@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="仅管理员可删除模板")
    
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    
    if os.path.exists(template.file_path):
        os.remove(template.file_path)
    
    await db.delete(template)
    await db.commit()
    return {"message": "删除成功"}
