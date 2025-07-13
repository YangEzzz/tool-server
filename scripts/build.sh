#!/bin/bash

echo "开始构建应用..."

# 清理之前的构建
rm -rf dist

# 运行TypeScript编译
npm run build

# 复制环境配置文件
cp .env.production dist/.env

echo "构建完成" 