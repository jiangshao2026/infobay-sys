@echo off
title 信佰监理系统 - 生产构建
echo ========================================
echo   信佰监理服务管理系统 - 生产构建
echo   构建产物输出到 dist\ 目录
echo   将 dist\ 拖到 https://app.netlify.com/drop 即可发布
echo ========================================
echo.
cd /d %~dp0
node node_modules/vite/bin/vite.js build
echo.
echo 构建完成！请查看 dist\ 目录
echo.
pause