@echo off
echo 前端启动脚本
echo.

echo [1/3] 检查Node.js环境...
node --version
if errorlevel 1 (
    echo 错误: 未找到Node.js，请安装Node.js 18+
    pause
    exit /b 1
)

echo.
echo [2/3] 安装前端依赖...
call npm install
if errorlevel 1 (
    echo 错误: 安装依赖失败
    pause
    exit /b 1
)

echo.
echo [3/3] 启动前端服务...
echo 前端将运行在 http://localhost:3000
echo.
call npm start
