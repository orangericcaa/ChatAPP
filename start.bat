@echo off
echo ========================================
echo        启动 Chat APP 后端服务器
echo ========================================
echo.

cd /d "e:\ChatAPP\backend"

echo 检查 Node.js 是否安装...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js 版本:
node --version

echo.
echo 检查项目依赖...
if not exist node_modules (
    echo 安装项目依赖...
    npm install
    if errorlevel 1 (
        echo 错误: 依赖安装失败
        pause
        exit /b 1
    )
)

echo.
echo 启动服务器...
echo 服务器将运行在: http://localhost:3001
echo 按 Ctrl+C 停止服务器
echo.

node server.js
pause
