import logging
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import init_db
from app.api import auth, templates, projects, audit, rules

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application...")
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="招标技术文件自动审核系统",
    description="自动审核招标技术文件与标准化模板的差异",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
if settings.DEBUG and not origins:
    origins = ["http://localhost:3000", "http://localhost"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(
        "request_id=%s method=%s path=%s status=%d duration=%.3fs",
        request_id, request.method, request.url.path, response.status_code, duration
    )
    return response


app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(templates.router, prefix="/api/templates", tags=["模板管理"])
app.include_router(projects.router, prefix="/api/projects", tags=["项目管理"])
app.include_router(audit.router, prefix="/api/audit", tags=["审核"])
app.include_router(rules.router, prefix="/api/rules", tags=["审核规则"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_id = str(uuid.uuid4())[:8]
    logger.exception(
        "Unhandled exception error_id=%s path=%s",
        error_id, request.url.path
    )
    return JSONResponse(
        status_code=500,
        content={"error_id": error_id, "message": "Internal server error"}
    )


@app.get("/")
async def root():
    return {"message": "招标技术文件自动审核系统 API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
