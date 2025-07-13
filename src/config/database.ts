import dotenv from 'dotenv';
import { log } from 'console';
dotenv.config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env.production'
});
console.log('当前环境:', process.env.NODE_ENV);
console.log('加载配置文件:', process.env.NODE_ENV === 'development' ? '.env.development' : '.env.production');

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