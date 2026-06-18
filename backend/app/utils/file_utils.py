import os
import uuid
from fastapi import HTTPException

ALLOWED_EXTENSIONS = {".docx"}


def safe_file_path(directory: str, prefix: str, original_name: str) -> str:
    if '..' in original_name or os.path.isabs(original_name):
        raise HTTPException(status_code=400, detail="非法文件路径")

    file_id = str(uuid.uuid4())
    safe_name = os.path.basename(original_name)
    ext = os.path.splitext(safe_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型: {ext}，仅支持 {ALLOWED_EXTENSIONS}")

    filename = f"{prefix}_{file_id}{ext}"
    file_path = os.path.join(directory, filename)
    real_path = os.path.realpath(file_path)
    real_dir = os.path.realpath(directory)

    if not real_path.startswith(real_dir + os.sep) and real_path != real_dir:
        raise HTTPException(status_code=400, detail="非法文件路径")

    return file_path


def validate_file_size(content: bytes, max_size: int) -> None:
    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"文件大小超过限制: {len(content)} 字节，最大允许: {max_size} 字节"
        )
