@echo off
echo 招标技术文件自动审核系统 - 启动脚本
echo.

echo [1/4] 检查Python环境...
python --version
if errorlevel 1 (
    echo 错误: 未找到Python，请安装Python 3.11+
    pause
    exit /b 1
)

echo.
echo [2/4] 安装后端依赖...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo 错误: 安装依赖失败
    pause
    exit /b 1
)

echo.
echo [3/4] 配置环境变量...
if not exist .env (
    copy .env.example .env
    echo 已创建 .env 文件，请编辑填入 API Key
    notepad .env
)

echo.
echo [4/4] 启动后端服务...
start "后端服务" cmd /k "uvicorn app.main:app --reload --port 8000"

echo.
echo 后端服务已启动: http://localhost:8000
echo API文档: http://localhost:8000/docs
echo.
echo 如需启动前端，请运行:
echo cd frontend
echo npm install
echo npm start
echo.
pause
