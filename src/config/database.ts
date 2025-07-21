import dotenv from 'dotenv';
import path from 'path';

// 根据环境和构建状态动态选择环境文件
const getEnvPath = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  // 检查是否在构建后的 dist 目录中运行
  if (__filename.includes('dist')) {
    // 在 dist 目录中，使用 build.sh 复制的 .env 文件
    return path.resolve(__dirname, '../.env');
  }

  // 在开发环境中，使用对应的环境文件
  return `.env.${nodeEnv}`;
};

dotenv.config({
  path: getEnvPath()
});
console.log('当前环境:', process.env.NODE_ENV);
console.log('环境文件路径:', getEnvPath());

if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_USERNAME || !process.env.DB_PASSWORD || !process.env.DB_DATABASE) {
  throw new Error('Missing required database environment variables');
}

export const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};
