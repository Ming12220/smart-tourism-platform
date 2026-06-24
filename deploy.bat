@echo off
chcp 65001 >nul
title 智慧旅游 - 部署到服务器

echo ========================================
echo   智慧旅游 - AWS EC2 一键部署脚本
echo ========================================
echo.
echo 服务器: 44.203.127.227 (ubuntu)
echo 密钥: C:\Users\LPY\Downloads\111.pem
echo.

:: 检查密钥文件
if not exist "C:\Users\LPY\Downloads\111.pem" (
    echo [错误] 找不到密钥文件 C:\Users\LPY\Downloads\111.pem
    pause
    exit /b 1
)

:: 1. 打包项目
echo [1/5] 打包项目文件...
if exist deploy.tar.gz del deploy.tar.gz
tar -czf deploy.tar.gz --exclude=".git" --exclude=".vscode" --exclude="node_modules" --exclude="*.db*" --exclude="deploy.tar.gz" .
echo       打包完成

:: 2. 上传到服务器
echo [2/5] 上传项目到服务器...
scp -i "C:\Users\LPY\Downloads\111.pem" -o StrictHostKeyChecking=no deploy.tar.gz ubuntu@44.203.127.227:~/
echo       上传完成

:: 3. SSH 部署
echo [3/5] 连接服务器安装 Node.js...
ssh -i "C:\Users\LPY\Downloads\111.pem" -o StrictHostKeyChecking=no ubuntu@44.203.127.227 "sudo apt-get update -qq && sudo apt-get install -y -qq nodejs npm" < nul
echo       Node.js 安装完成

:: 4. 解压并安装依赖
echo [4/5] 解压项目并安装依赖...
ssh -i "C:\Users\LPY\Downloads\111.pem" -o StrictHostKeyChecking=no ubuntu@44.203.127.227 "mkdir -p ~/app && tar xzf ~/deploy.tar.gz -C ~/app && cd ~/app/server && npm install"
echo       依赖安装完成

:: 5. 启动服务
echo [5/5] 启动服务...
ssh -i "C:\Users\LPY\Downloads\111.pem" -o StrictHostKeyChecking=no ubuntu@44.203.127.227 "cd ~/app/server && nohup node server.js > ~/app.log 2>&1 &"

:: 验证
echo.
echo 等待服务启动...
timeout /t 5 /nobreak >nul
ssh -i "C:\Users\LPY\Downloads\111.pem" -o StrictHostKeyChecking=no ubuntu@44.203.127.227 "curl -s -o /dev/null -w '服务状态: %%{http_code}\n' http://localhost:3000"

echo.
echo ========================================
echo   部署完成！
echo.
echo   访问地址: http://44.203.127.227:3000
echo.
echo   ⚠ 记得去 AWS 安全组开放端口 3000！
echo ========================================
pause
