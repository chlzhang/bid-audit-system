# 招标技术文件自动审核系统

自动审核招标技术文件与标准化技术文件模板的差异，支持技术参数对比、设备选型审核、技术条款变更审核和合规性检查。

## 功能特性

### 核心功能
- **模板管理**: 上传和管理标准化技术文件模板 (.docx)
- **项目管理**: 上传项目招标技术文件，关联模板进行审核
- **智能审核**: 调用 AI 自动对比分析文件差异，支持 OpenAI / Anthropic 多模型
- **风险评估**: 对差异进行高/中/低风险等级划分
- **审核报告**: 生成详细审核报告，支持导出 TXT 和一键复制

### 数据可视化
- **工作台仪表盘**: 风险分布饼图 + 审核状态柱状图 + 实时统计数字动画
- **审核结果页**: 风险环形图 + 差异左右对比视图 + 报告关键字高亮

### 交互体验
- **审核进度**: 四步进度指示（解析文档 → 对比分析 → 合规检查 → 生成报告）
- **页面动画**: 路由切换淡入动画 / 骨架屏加载 / 登录欢迎通知
- **错误边界**: 全局 ErrorBoundary 防止页面白屏
- **速率限制**: 登录/注册接口 5次/5分钟 防暴力破解

### 运维与安全
- **请求日志**: 每个请求记录 ID、方法、路径、耗时
- **异常追踪**: 全局异常处理记录完整 traceback，对外仅暴露 error_id
- **文件安全**: 上传文件扩展名白名单（仅 .docx）、路径穿越防护、大小限制
- **数据库持久化**: Docker 部署通过卷挂载保留 SQLite 数据

## 技术栈

- **后端**: Python 3.11+ / FastAPI / SQLAlchemy 2.x / Pydantic v2
- **前端**: React 18 / Ant Design 5 / TypeScript / SVG 图表
- **数据库**: SQLite (aiosqlite 异步驱动) + Alembic 迁移
- **AI**: OpenAI GPT / Anthropic Claude 多模型封装
- **部署**: Docker + Docker Compose + Nginx 反向代理

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- Docker (可选)

### 本地开发

1. **配置环境变量**

```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入 API Key
```

2. **启动后端**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

3. **启动前端**

```bash
cd frontend
npm install
npm start
```

4. **访问应用**

- 前端: http://localhost:3000
- API文档: http://localhost:8000/docs

### Docker 部署

```bash
docker-compose up -d
```

访问 http://localhost

## 使用说明

1. **注册/登录**: 创建账号并登录系统（首次启动需先注册）
2. **上传模板**: 在模板管理页面上传标准化技术文件模板 (.docx)
3. **创建项目**: 在项目管理页面上传项目招标技术文件，关联对应模板
4. **开始审核**: 在文件审核页面选择项目并开始智能审核
5. **查看结果**: 审核完成后跳转审核报告页，查看可视化差异分析
6. **导出/复制**: 支持下载 TXT 报告或一键复制到剪贴板
7. **删除记录**: 工作台和报告页面均可删除测试审核记录

## 审核内容

- **技术参数差异**: 检查参数值是否超出模板范围
- **设备选型变更**: 检查设备型号、品牌是否变更
- **技术条款变更**: 检查技术条款是否修改、新增或删除
- **合规性问题**: 检查是否符合国家标准和行业规范

## 项目目录

```
bid-audit-system/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── api/               # API路由 (auth/templates/projects/audit/rules)
│   │   ├── core/              # 核心配置 (config/database/security)
│   │   ├── models/            # SQLAlchemy ORM + Pydantic schemas
│   │   ├── services/          # 业务逻辑
│   │   │   ├── audit/         # 审核主流程
│   │   │   ├── document/      # docx 文档解析
│   │   │   └── llm/           # OpenAI/Anthropic 多模型封装
│   │   └── utils/             # 工具函数 (文件安全/速率限制)
│   ├── alembic/               # 数据库迁移脚本
│   ├── tests/                 # 单元测试
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/        # 公共组件 (Layout/ErrorBoundary)
│   │   ├── pages/             # 页面 (Dashboard/Templates/Projects/Audit/AuditResult/Login)
│   │   └── services/          # API 客户端 (axios)
│   ├── nginx.conf             # Nginx 反向代理配置
│   ├── package.json
│   └── Dockerfile
├── docs/                       # 设计文档与实现计划
│   ├── compose/
│   │   ├── specs/             # 设计规格
│   │   └── plans/             # 实现计划
├── docker-compose.yml
└── README.md
```

## License

MIT
