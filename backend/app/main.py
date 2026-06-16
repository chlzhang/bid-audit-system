from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import init_db
from app.api import auth, templates, projects, audit, rules


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="招标技术文件自动审核系统",
    description="自动审核招标技术文件与标准化模板的差异",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(templates.router, prefix="/api/templates", tags=["模板管理"])
app.include_router(projects.router, prefix="/api/projects", tags=["项目管理"])
app.include_router(audit.router, prefix="/api/audit", tags=["审核"])
app.include_router(rules.router, prefix="/api/rules", tags=["审核规则"])


@app.get("/")
async def root():
    return {"message": "招标技术文件自动审核系统 API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
