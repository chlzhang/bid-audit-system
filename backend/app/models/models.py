from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)

from app.core.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(100), nullable=False)
    role = Column(String(20), default="viewer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)
    
    templates = relationship("Template", back_populates="creator")
    projects = relationship("Project", back_populates="creator")
    audit_records = relationship("AuditRecord", back_populates="auditor")


class Template(Base):
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    version = Column(String(20), default="1.0")
    file_path = Column(String(500), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
    
    creator = relationship("User", back_populates="templates")
    projects = relationship("Project", back_populates="template")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    template_id = Column(Integer, ForeignKey("templates.id"))
    file_path = Column(String(500), nullable=False)
    status = Column(String(20), default="pending")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
    
    template = relationship("Template", back_populates="projects")
    creator = relationship("User", back_populates="projects")
    audit_records = relationship("AuditRecord", back_populates="project")


class AuditRecord(Base):
    __tablename__ = "audit_records"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    auditor_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(20), default="pending")
    risk_level = Column(String(10))
    summary = Column(Text)
    report_content = Column(Text)
    created_at = Column(DateTime, default=_utcnow)
    completed_at = Column(DateTime)
    
    project = relationship("Project", back_populates="audit_records")
    auditor = relationship("User", back_populates="audit_records")
    differences = relationship("Difference", back_populates="audit_record")


class Difference(Base):
    __tablename__ = "differences"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_record_id = Column(Integer, ForeignKey("audit_records.id"))
    diff_type = Column(String(30), nullable=False)
    category = Column(String(100))
    location = Column(String(500))
    template_content = Column(Text)
    project_content = Column(Text)
    risk_level = Column(String(10))
    description = Column(Text)
    suggestion = Column(Text)
    created_at = Column(DateTime, default=_utcnow)
    
    audit_record = relationship("AuditRecord", back_populates="differences")


class AuditRule(Base):
    __tablename__ = "audit_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False)
    rule_content = Column(Text, nullable=False)
    standard_ref = Column(String(200))
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
