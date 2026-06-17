import os
import pytest
import importlib
import sys


def test_runtime_error_on_default_secret_key_in_production():
    """Test that RuntimeError is raised when DEBUG=false and default SECRET_KEY is used."""
    # Set environment variables to simulate production with default SECRET_KEY
    os.environ["DEBUG"] = "false"
    os.environ["SECRET_KEY"] = "your-secret-key-change-in-production"
    
    # Remove the module from cache to force reimport
    if "app.core.config" in sys.modules:
        del sys.modules["app.core.config"]
    
    with pytest.raises(RuntimeError) as exc_info:
        importlib.import_module("app.core.config")
    
    assert "Default SECRET_KEY is not allowed in production" in str(exc_info.value)
    
    # Cleanup
    del os.environ["DEBUG"]
    del os.environ["SECRET_KEY"]
    if "app.core.config" in sys.modules:
        del sys.modules["app.core.config"]


def test_secret_key_length_validation():
    """Test that SECRET_KEY must be at least 32 characters long."""
    os.environ["SECRET_KEY"] = "short"
    
    if "app.core.config" in sys.modules:
        del sys.modules["app.core.config"]
    
    with pytest.raises(ValueError) as exc_info:
        importlib.import_module("app.core.config")
    
    assert "SECRET_KEY must be at least 32 characters long" in str(exc_info.value)
    
    # Cleanup
    del os.environ["SECRET_KEY"]
    if "app.core.config" in sys.modules:
        del sys.modules["app.core.config"]


def test_valid_secret_key_in_production():
    """Test that a valid SECRET_KEY works in production."""
    os.environ["DEBUG"] = "false"
    os.environ["SECRET_KEY"] = "a" * 32  # 32 character secret key
    
    if "app.core.config" in sys.modules:
        del sys.modules["app.core.config"]
    
    # Should not raise any exception
    importlib.import_module("app.core.config")
    
    # Cleanup
    del os.environ["DEBUG"]
    del os.environ["SECRET_KEY"]
    if "app.core.config" in sys.modules:
        del sys.modules["app.core.config"]
