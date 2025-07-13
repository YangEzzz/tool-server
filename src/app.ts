import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import helmet from 'koa-helmet';
import { errorHandler } from './middlewares/errorHandler';
import router from './routes';
import logger from '@/utils/logger';

const app = new Koa();

app.use(helmet());
app.use(cors());

// 添加请求耗时中间件
app.use(async (ctx, next) => {
  const requestStart = Date.now();
  logger.info(`开始处理请求: ${ctx.method} ${ctx.url}`);
  
  // 记录中间件处理前的时间
  const middlewareStart = Date.now();
  
  await next();
  
  // 计算总耗时
  const requestTime = Date.now() - requestStart;
  const middlewareTime = Date.now() - middlewareStart;
  
  // 详细记录请求耗时
  logger.info(`完成请求: ${ctx.method} ${ctx.url} - ${ctx.status} - 总耗时: ${requestTime}ms, 业务处理耗时: ${middlewareTime}ms`);
});

app.use(async (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin", "*"); // 允许所有来源访问
  ctx.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); // 允许的请求方法
  ctx.set("Access-Control-Allow-Headers", "Content-Type, Authorization"); // 允许的请求头

  if (ctx.method === "OPTIONS") {
    ctx.status = 204; // 对于预检请求返回状态码 204
  } else {
    await next();
    // 在请求处理完成后记录日志，此时状态码已经被设置
    logger.log({
      level: 'info',
      message: `${ctx.method} ${ctx.url} - ${ctx.status}`
    });
  }
});
app.use(bodyParser());
app.use(errorHandler);
app.use(router.routes());
app.use(router.allowedMethods());

export default app;
