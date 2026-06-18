from datetime import datetime, timedelta
from jose import jwt
from app.core.security import create_access_token
from app.core.config import settings


def test_create_access_token_uses_configured_expiry():
    token = create_access_token(data={"sub": "testuser"})
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    assert payload["sub"] == "testuser"
    assert payload["type"] == "access"
    assert "iat" in payload
    assert "exp" in payload

    iat = datetime.utcfromtimestamp(payload["iat"])
    exp = datetime.utcfromtimestamp(payload["exp"])
    delta = exp - iat

    assert delta == timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)


def test_create_access_token_with_custom_expires_delta():
    custom_delta = timedelta(minutes=5)
    token = create_access_token(data={"sub": "testuser"}, expires_delta=custom_delta)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

    iat = datetime.utcfromtimestamp(payload["iat"])
    exp = datetime.utcfromtimestamp(payload["exp"])
    delta = exp - iat

    assert delta == custom_delta
