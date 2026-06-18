import os
import pytest
from fastapi import HTTPException
from app.utils.file_utils import safe_file_path, validate_file_size, ALLOWED_EXTENSIONS


class TestSafeFilePath:
    def test_valid_path(self, tmp_path):
        directory = str(tmp_path)
        path = safe_file_path(directory, "template", "test.docx")
        assert path.startswith(directory)
        assert os.path.basename(path).startswith("template_")
        assert path.endswith(".docx")

    def test_rejected_pdf(self, tmp_path):
        directory = str(tmp_path)
        with pytest.raises(HTTPException) as exc:
            safe_file_path(directory, "template", "test.pdf")
        assert exc.value.status_code == 400
        assert ".pdf" in exc.value.detail

    def test_rejected_traversal(self, tmp_path):
        directory = str(tmp_path)
        with pytest.raises(HTTPException) as exc:
            safe_file_path(directory, "template", "..\\..\\..\\etc\\passwd.docx")
        assert exc.value.status_code == 400


class TestValidateFileSize:
    def test_size_within_limit(self):
        content = b"x" * 1024
        validate_file_size(content, 2048)

    def test_size_exceeds_limit(self):
        content = b"x" * 2048
        with pytest.raises(HTTPException) as exc:
            validate_file_size(content, 1024)
        assert exc.value.status_code == 413
        assert "1024" in exc.value.detail


class TestAllowedExtensions:
    def test_allowed_extensions_contains_docx(self):
        assert ".docx" in ALLOWED_EXTENSIONS
        assert ".pdf" not in ALLOWED_EXTENSIONS
