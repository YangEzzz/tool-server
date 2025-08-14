import 'module-alias/register';
import 'dotenv/config';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from './app';
import { appConfig } from './config/app';
import logger from './utils/logger';
import { AppDataSource } from './database/connection';

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connected successfully');

    let server;
    console.log(appConfig.env);
    // 测试环境使用 HTTP，其他环境使用 HTTPS
    if (appConfig.env === 'development') {
      server = http.createServer(app.callback()).listen(appConfig.port, () => {
        logger.info(`HTTP Server running on port ${appConfig.port} (test environment)`);
      });
    } else {
      const options = {
        key: fs.readFileSync(path.join('/root/ssl-folder/api/', 'api.team-tool.top.key')),
        cert: fs.readFileSync(path.join('/root/ssl-folder/api/', 'api.team-tool.top_bundle.crt'))
      };

      server = https.createServer(options, app.callback()).listen(appConfig.port, () => {
        logger.info(`HTTPS Server running on port ${appConfig.port} (${appConfig.env} environment)`);
      });
    }

    return server;
  } catch (error) {
    logger.error('Error during initialization:', error);
    process.exit(1);
  }
};

export default startServer();
