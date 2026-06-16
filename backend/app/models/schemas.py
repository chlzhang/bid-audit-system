from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str
    role: Optional[str] = "viewer"


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class TemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    version: Optional[str] = "1.0"


class TemplateCreate(TemplateBase):
    pass


class TemplateResponse(TemplateBase):
    id: int
    file_path: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    template_id: Optional[int] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: int
    file_path: str
    status: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DifferenceBase(BaseModel):
    diff_type: str
    category: Optional[str] = None
    location: Optional[str] = None
    template_content: Optional[str] = None
    project_content: Optional[str] = None
    risk_level: Optional[str] = None
    description: Optional[str] = None
    suggestion: Optional[str] = None


class DifferenceResponse(DifferenceBase):
    id: int
    audit_record_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuditRecordBase(BaseModel):
    project_id: int


class AuditRecordCreate(AuditRecordBase):
    pass


class AuditRecordResponse(AuditRecordBase):
    id: int
    auditor_id: int
    status: str
    risk_level: Optional[str]
    summary: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    differences: List[DifferenceResponse] = []
    
    class Config:
        from_attributes = True


class AuditRuleBase(BaseModel):
    category: str
    rule_type: str
    rule_content: str
    standard_ref: Optional[str] = None
    is_enabled: Optional[bool] = True


class AuditRuleCreate(AuditRuleBase):
    pass


class AuditRuleResponse(AuditRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AuditResult(BaseModel):
    audit_record: AuditRecordResponse
    total_differences: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    summary: str
