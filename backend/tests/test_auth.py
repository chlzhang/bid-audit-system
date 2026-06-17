import pytest
from app.models.schemas import UserCreate


def test_valid_password():
    user = UserCreate(username="testuser", password="Password1")
    assert user.password == "Password1"


def test_password_too_short():
    with pytest.raises(ValueError, match="密码长度至少为8位"):
        UserCreate(username="testuser", password="Pass1")


def test_password_no_uppercase():
    with pytest.raises(ValueError, match="密码必须包含至少一个大写字母"):
        UserCreate(username="testuser", password="password1")


def test_password_no_lowercase():
    with pytest.raises(ValueError, match="密码必须包含至少一个小写字母"):
        UserCreate(username="testuser", password="PASSWORD1")


def test_password_no_digit():
    with pytest.raises(ValueError, match="密码必须包含至少一个数字"):
        UserCreate(username="testuser", password="PasswordA")
