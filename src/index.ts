import 'module-alias/register';
import 'dotenv/config';
// import https from 'https';
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

    // const options = {
    //   key: fs.readFileSync(path.join('/home/ubuntu', 'api.yangezzz.top.key')),
    //   cert: fs.readFileSync(path.join('/home/ubuntu', 'api.yangezzz.top_bundle.crt'))
    // };

    const server = http.createServer(app.callback()).listen(appConfig.port, () => {
      logger.info(`HTTPS Server running on port ${appConfig.port}`);
    });
    // const server = https.createServer(options, app.callback()).listen(appConfig.port, () => {
    //   logger.info(`HTTPS Server running on port ${appConfig.port}`);
    // });

    return server;
  } catch (error) {
    logger.error('Error during initialization:', error);
    process.exit(1);
  }
};

export default startServer();
