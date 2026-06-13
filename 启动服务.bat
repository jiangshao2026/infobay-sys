@echo off
title 信佰监理系统 - 开发服务
echo ========================================
echo   信佰监理服务管理系统 - 开发模式
echo   访问地址: http://localhost:5174/
echo ========================================
echo.
cd /d %~dp0
node node_modules/vite/bin/vite.js --host localhost --port 5174
echo.
echo 服务已停止，按任意键退出...
pause >nul