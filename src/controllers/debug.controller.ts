import { Context } from 'koa';
import { DebugService } from '@/dao/debug.service';
import { ResponseCode } from '@/types/response';
import logger from '@/utils/logger';

export class DebugController {
  private debugService: DebugService;

  constructor() {
    this.debugService = new DebugService();
  }

  createDebugLog = async (ctx: Context) => {
    const totalStartTime = Date.now();
    try {
      const { content, logUser } = ctx.request.body as { content: Record<string, any>; logUser: string };
      console.log(content, logUser);
      if (!content) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.BAD_REQUEST,
          message: '内容不能为空'
        };
        return;
      }

      const debugLog = await this.debugService.createDebugLog(content, logUser);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: ResponseCode.SUCCESS,
        data: debugLog,
        message: '创建成功'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`createDebugLog处理完成，总耗时: ${totalTime}ms`);
    } catch (error) {
      logger.error('创建调试日志失败:', error);
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.INTERNAL_ERROR,
        message: '服务器错误'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`createDebugLog处理失败，总耗时: ${totalTime}ms`);
    }
  };

  getDebugLogs = async (ctx: Context) => {
    const totalStartTime = Date.now();
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      const pageNum = parseInt(page as string, 10);
      const limit = parseInt(pageSize as string, 10);

      const debugLogs = await this.debugService.getDebugLogs(pageNum, limit);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: ResponseCode.SUCCESS,
        data: debugLogs,
        message: '获取成功'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`getDebugLogs处理完成，总耗时: ${totalTime}ms`);
    } catch (error) {
      logger.error('获取调试日志失败:', error);
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.INTERNAL_ERROR,
        message: '服务器错误'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`getDebugLogs处理失败，总耗时: ${totalTime}ms`);
    }
  };
}