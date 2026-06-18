# AGENTS.md

> 招标技术文件自动审核系统 — 帮助未来 OpenCode 会话快速上手的精简指令。

## 项目结构

```
bid-audit-system/
├── backend/          # Python + FastAPI 后端
│   ├── app/
│   │   ├── main.py    # FastAPI 入口，注册所有路由
│   │   ├── api/       # 路由层 (auth, templates, projects, audit, rules)
│   │   ├── models/    # SQLAlchemy ORM + Pydantic schemas
│   │   ├── services/  # 业务逻辑
│   │   │   ├── document/parser.py   # docx 解析
│   │   │   ├── llm/service.py       # OpenAI / Anthropic 多模型封装
│   │   │   └── audit/service.py     # 审核主流程
│   │   ├── core/      # 配置、数据库、安全
│   │   └── utils/
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # React 18 + Ant Design + TypeScript
│   ├── src/
│   │   ├── App.tsx    # 路由配置 (react-router-dom v6)
│   │   ├── pages/     # Dashboard, Templates, Projects, Audit, AuditResult, Login
│   │   ├── components/Layout.tsx
│   │   └── services/api.ts
│   └── package.json
└── docker-compose.yml
```

## 开发命令

### 后端 (Python 3.11+)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health
- 数据库: SQLite (`audit.db`)，使用 `aiosqlite` 异步驱动
- 环境变量: 复制 `.env.example` → `.env`，填入 `OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY`
- 上传目录: `backend/uploads/`（运行时会自动创建）

### 前端 (Node.js 18+)

```bash
cd frontend
npm install
npm start
```

- 开发服务器: http://localhost:3000
- `package.json` 已配置 `proxy: "http://localhost:8000"`，开发时代理到后端
- 生产构建: `npm run build`（输出到 `build/`）

### Docker 部署

```bash
docker-compose up -d
```

- 前端: http://localhost (nginx 80 端口)
- 后端: http://localhost:8000
- 注意: `backend/.env` 必须存在且配置正确，Docker 通过 `env_file` 加载

## 关键架构要点

### 后端

- **FastAPI** 异步应用，`app.main:app` 是入口，`lifespan` 中调用 `init_db()` 初始化表结构
- **认证**: JWT (HS256)，`localStorage` 存 token，前端通过 `Authorization: Bearer <token>` 发送
- **路由前缀**:
  - `/api/auth` — 登录/注册
  - `/api/templates` — 模板上传/管理
  - `/api/projects` — 项目上传/管理
  - `/api/audit` — 审核启动/记录/报告
  - `/api/rules` — 审核规则
- **LLM 服务** (`app/services/llm/service.py`): 同时支持 OpenAI 和 Anthropic，按 `DEFAULT_LLM_MODEL` 选择默认 provider。没有配置 API key 会抛 `ValueError`
- **文档解析** (`app/services/document/parser.py`): 仅支持 `.docx`，使用 `python-docx` 提取段落、表格、参数、条款
- **审核流程** (`app/services/audit/service.py`):
  1. 解析模板和项目 docx
  2. 调用 LLM 分析差异（技术参数、设备选型、条款变更、合规性）
  3. LLM 返回 JSON，失败时降级为空差异 + raw_response
  4. 合并差异与合规问题，统计风险等级
  5. 生成文本报告

### 前端

- **Ant Design 5** + `zh_CN`  locale
- **路由** (`App.tsx`): `/login` 公开，其余受 `PrivateRoute` 保护（检查 `localStorage.token`）
- **API 服务** (`services/api.ts`): axios 实例，baseURL 为空（依赖 proxy），自动附加 token header

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | SQLite 数据库路径 | `sqlite+aiosqlite:///./audit.db` |
| `SECRET_KEY` | JWT 签名密钥 | `your-secret-key-change-in-production` |
| `OPENAI_API_KEY` | OpenAI API Key | — |
| `OPENAI_API_BASE` | OpenAI 自定义 base URL | `https://api.openai.com/v1` |
| `ANTHROPIC_API_KEY` | Anthropic API Key | — |
| `DEFAULT_LLM_MODEL` | 默认模型 | `gpt-4` |
| `DEBUG` | 调试模式 | `true` |

## 注意事项

- **必须配置 LLM API Key**: 审核功能依赖 LLM，无 key 时系统启动正常但审核会失败
- **仅支持 .docx**: 文档解析器使用 `python-docx`，不支持 `.pdf` 或 `.doc`
- **Docker 镜像源**: Dockerfile 使用阿里云 Debian 镜像和清华 PyPI 镜像，前端使用 npmmirror — 若网络不通需调整
- **前端构建依赖 ajv**: `frontend/Dockerfile` 中显式 `npm install ajv@8 --legacy-peer-deps`，构建失败时检查此依赖
- **CORS**: 后端开发环境允许所有来源 (`allow_origins=["*"]`)
- **无测试框架**: 当前无单元测试或集成测试配置，修改后需手动验证
- **无 lint / typecheck 脚本**: 前端 `package.json` 只有 `start/build/test`，无 ESLint/Prettier 配置；后端无 black/ruff/mypy 配置
