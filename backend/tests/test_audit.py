import uuid
import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock, MagicMock, patch

from app.api.audit import start_audit


class FakeProject:
    id = 1
    template_id = 10
    file_path = "fake_project.docx"
    status = "pending"


class FakeTemplate:
    id = 10
    file_path = "fake_template.docx"


class FakeAuditRecord:
    id = 100
    status = "in_progress"
    summary = None
    risk_level = None
    completed_at = None

    def __init__(self):
        self.differences = []


class FakeDB:
    def __init__(self):
        self.added = []
        self.committed = 0
        self.refreshed = []

    async def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        self.committed += 1

    async def refresh(self, obj):
        self.refreshed.append(obj)

    async def execute(self, query):
        return self

    def scalar_one_or_none(self):
        return None

    def scalar_one(self):
        return FakeAuditRecord()

    def scalars(self):
        return self

    def all(self):
        return []

    def __await__(self):
        return self._async_init().__await__()

    async def _async_init(self):
        return self


@pytest.mark.anyio
async def test_start_audit_exception_sanitization():
    """
    When audit_service.perform_audit raises an exception, the endpoint
    must NOT leak the raw exception message. It should:
      - set audit_record.status to 'failed'
      - set audit_record.summary to a generic message with an error_id
      - raise HTTPException(500) with a generic detail containing the same error_id
    """
    fake_db = FakeDB()
    fake_project = FakeProject()
    fake_template = FakeTemplate()
    fake_audit_record = FakeAuditRecord()

    # Patch the db.execute chain so it returns our fakes
    async def fake_execute(query):
        class Result:
            def scalar_one_or_none(self):
                # First call -> Project, second -> Template
                if not hasattr(fake_execute, "call_count"):
                    fake_execute.call_count = 0
                fake_execute.call_count += 1
                if fake_execute.call_count == 1:
                    return fake_project
                return fake_template

            def scalar_one(self):
                return fake_audit_record

            def scalars(self):
                return self

            def all(self):
                return []
        return Result()

    fake_db.execute = fake_execute

    # Patch audit_service.perform_audit to raise a sensitive exception
    with patch("app.api.audit.audit_service.perform_audit", new_callable=AsyncMock) as mock_audit:
        mock_audit.side_effect = Exception("Database connection failed: password=secret123")

        # Patch AuditRecord constructor so we can inspect the instance
        with patch("app.api.audit.AuditRecord", return_value=fake_audit_record):
            audit_data = MagicMock()
            audit_data.project_id = 1
            current_user = MagicMock()
            current_user.id = 42

            with pytest.raises(HTTPException) as exc_info:
                await start_audit(audit_data, fake_db, current_user)

    exc = exc_info.value
    assert exc.status_code == 500
    detail = exc.detail
    assert "审核服务暂时不可用，请联系管理员" in detail
    assert "错误ID:" in detail

    # Extract error_id from detail and verify it matches summary
    error_id = detail.split("错误ID: ")[1].rstrip(")")
    assert fake_audit_record.status == "failed"
    assert fake_audit_record.summary == f"审核处理失败，错误ID: {error_id}"
    assert len(error_id) == 8


@pytest.mark.anyio
async def test_error_id_format():
    """Ensure error_id is an 8-char hex-like string."""
    error_id = str(uuid.uuid4())[:8]
    assert len(error_id) == 8
    # UUID chars are hex digits and hyphens; first 8 chars are hex
    assert all(c in "0123456789abcdef" for c in error_id)
