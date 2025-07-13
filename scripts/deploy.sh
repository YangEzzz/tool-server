#!/bin/bash

echo "开始部署应用..."

# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 构建应用
./scripts/build.sh

# 运行数据库迁移
npm run migration:run

# 重启应用
pm2 restart app

echo "部署完成" 