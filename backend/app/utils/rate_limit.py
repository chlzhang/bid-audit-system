import time
import hashlib
from collections import defaultdict
from fastapi import Request, HTTPException

MAX_ATTEMPTS = 5
WINDOW_SECONDS = 300

_attempts: dict[str, list[float]] = defaultdict(list)


def _cleanup():
    now = time.time()
    for key in list(_attempts.keys()):
        _attempts[key] = [t for t in _attempts[key] if now - t < WINDOW_SECONDS]
        if not _attempts[key]:
            del _attempts[key]


def check_rate_limit(request: Request, identifier: str = None) -> None:
    _cleanup()
    client_ip = request.client.host if request.client else "unknown"
    key = hashlib.sha256((client_ip + (identifier or "")).encode()).hexdigest()
    attempts = _attempts[key]
    if len(attempts) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="请求过于频繁，请 %d 秒后重试" % int(WINDOW_SECONDS - (time.time() - attempts[0]))
        )
    _attempts[key].append(time.time())
