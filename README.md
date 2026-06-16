# 招标技术文件自动审核系统

自动审核招标技术文件与标准化技术文件模板的差异，支持技术参数对比、设备选型审核、技术条款变更审核和合规性检查。

## 功能特性

- **模板管理**: 上传和管理标准化技术文件模板
- **项目管理**: 上传项目招标技术文件
- **智能审核**: 自动对比分析文件差异
- **风险评估**: 对差异进行风险等级划分
- **审核报告**: 生成详细的审核报告并支持导出

## 技术栈

- **后端**: Python + FastAPI + SQLAlchemy
- **前端**: React + Ant Design + TypeScript
- **数据库**: SQLite
- **AI**: 支持 OpenAI GPT / Anthropic Claude 多模型
- **部署**: Docker + Docker Compose

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

1. **注册/登录**: 创建账号并登录系统
2. **上传模板**: 在模板管理页面上传标准化技术文件模板
3. **创建项目**: 在项目管理页面上传项目招标技术文件
4. **开始审核**: 在文件审核页面选择项目并开始审核
5. **查看结果**: 审核完成后查看详细审核报告
6. **导出报告**: 支持导出审核报告

## 审核内容

- **技术参数差异**: 检查参数值是否超出模板范围
- **设备选型变更**: 检查设备型号、品牌是否变更
- **技术条款变更**: 检查技术条款是否修改、新增或删除
- **合规性问题**: 检查是否符合国家标准和行业规范

## 目录结构

```
bid-audit-system/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面
│   │   └── services/       # API服务
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT
