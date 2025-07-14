import { Context } from 'koa';
import { PasteService } from '@/dao/paste.service';
import logger from '@/utils/logger';
import { ResponseCode } from '@/types/response';

// 定义请求体类型
interface CreatePasteRequestBody {
  content: string;
  isPublic?: boolean;
  contentType?: 'text' | 'image';
}

interface UpdatePasteRequestBody {
  content?: string;
  isPublic?: boolean;
  contentType?: 'text' | 'image';
}

export class PasteController {
  private pasteService: PasteService;

  constructor() {
    this.pasteService = new PasteService();
  }

  /**
   * 创建剪贴板内容
   * @param ctx Koa上下文
   */
  createPaste = async (ctx: Context): Promise<void> => {
    const totalStartTime = Date.now();
    try {
      const { content, isPublic = true, contentType = 'text' } = ctx.request.body as CreatePasteRequestBody;
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.UNAUTHORIZED,
          message: '请先登录'
        };
        return;
      }

      if (!content || typeof content !== 'string') {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.BAD_REQUEST,
          message: '内容不能为空'
        };
        return;
      }

      const paste = await this.pasteService.createPaste({
        content,
        creatorId: userId,
        isPublic: Boolean(isPublic),
        contentType
      });

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: ResponseCode.SUCCESS,
        data: paste,
        message: '创建成功'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`createPaste处理完成，总耗时: ${totalTime}ms`);
    } catch (error) {
      logger.error('创建剪贴板内容失败:', error);
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.INTERNAL_ERROR,
        message: '服务器错误'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`createPaste处理失败，总耗时: ${totalTime}ms`);
    }
  };

  /**
   * 获取用户的剪贴板内容
   * @param ctx Koa上下文
   */
  getUserPastes = async (ctx: Context): Promise<void> => {
    const totalStartTime = Date.now();
    try {
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.UNAUTHORIZED,
          message: '请先登录'
        };
        return;
      }

      const pastes = await this.pasteService.getUserPastes(userId);
      const publicPastes = await this.pasteService.getPublicPastes();
      pastes.push(...publicPastes);

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: ResponseCode.SUCCESS,
        data: pastes,
        message: '获取成功'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`getUserPastes处理完成，总耗时: ${totalTime}ms`);
    } catch (error) {
      logger.error('获取用户剪贴板内容失败:', error);
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.INTERNAL_ERROR,
        message: '服务器错误'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`getUserPastes处理失败，总耗时: ${totalTime}ms`);
    }
  };

  /**
   * 获取公开的剪贴板内容
   * @param ctx Koa上下文
   */
  getPublicPastes = async (ctx: Context): Promise<void> => {
    const totalStartTime = Date.now();
    try {
      const pastes = await this.pasteService.getPublicPastes();

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: ResponseCode.SUCCESS,
        data: pastes,
        message: '获取成功'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`getPublicPastes处理完成，总耗时: ${totalTime}ms`);
    } catch (error) {
      logger.error('获取公开剪贴板内容失败:', error);
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.INTERNAL_ERROR,
        message: '服务器错误'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`getPublicPastes处理失败，总耗时: ${totalTime}ms`);
    }
  };

  /**
   * 获取剪贴板内容详情
   * @param ctx Koa上下文
   */
  getPasteById = async (ctx: Context): Promise<void> => {
    const totalStartTime = Date.now();
    try {
      const id = ctx.params.id;
      const userId = ctx.state.user?.id;

      if (!id || isNaN(Number(id))) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.BAD_REQUEST,
          message: '无效的ID'
        };
        return;
      }

      const paste = await this.pasteService.getPasteById(Number(id));

      if (!paste) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.NOT_FOUND,
          message: '内容不存在'
        };
        return;
      }

      // 检查访问权限：公开或者是创建者
      if (!paste.isPublic && paste.creator.id !== userId) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.FORBIDDEN,
          message: '无权访问'
        };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: ResponseCode.SUCCESS,
        data: paste,
        message: '获取成功'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`getPasteById处理完成，总耗时: ${totalTime}ms`);
    } catch (error) {
      logger.error('获取剪贴板内容详情失败:', error);
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.INTERNAL_ERROR,
        message: '服务器错误'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`getPasteById处理失败，总耗时: ${totalTime}ms`);
    }
  };

  /**
   * 更新剪贴板内容
   * @param ctx Koa上下文
   */
  updatePaste = async (ctx: Context): Promise<void> => {
    const totalStartTime = Date.now();
    try {
      const id = ctx.params.id;
      const { content, isPublic, contentType } = ctx.request.body as UpdatePasteRequestBody;
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.UNAUTHORIZED,
          message: '请先登录'
        };
        return;
      }

      if (!id || isNaN(Number(id))) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.BAD_REQUEST,
          message: '无效的ID'
        };
        return;
      }

      // 检查权限
      const hasPermission = await this.pasteService.hasPermission(Number(id), userId);
      if (!hasPermission) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.FORBIDDEN,
          message: '无权操作'
        };
        return;
      }

      // 更新数据
      const updatedPaste = await this.pasteService.updatePaste(Number(id), {
        content,
        isPublic,
        contentType
      });

      if (!updatedPaste) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.NOT_FOUND,
          message: '内容不存在'
        };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: ResponseCode.SUCCESS,
        data: updatedPaste,
        message: '更新成功'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`updatePaste处理完成，总耗时: ${totalTime}ms`);
    } catch (error) {
      logger.error('更新剪贴板内容失败:', error);
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.INTERNAL_ERROR,
        message: '服务器错误'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`updatePaste处理失败，总耗时: ${totalTime}ms`);
    }
  };

  /**
   * 删除剪贴板内容
   * @param ctx Koa上下文
   */
  deletePaste = async (ctx: Context): Promise<void> => {
    const totalStartTime = Date.now();
    try {
      const id = ctx.params.id;
      const userId = ctx.state.user?.id;

      if (!userId) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.UNAUTHORIZED,
          message: '请先登录'
        };
        return;
      }

      if (!id || isNaN(Number(id))) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.BAD_REQUEST,
          message: '无效的ID'
        };
        return;
      }

      // 检查权限
      const hasPermission = await this.pasteService.hasPermission(Number(id), userId);
      if (!hasPermission) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.FORBIDDEN,
          message: '无权操作'
        };
        return;
      }

      const success = await this.pasteService.deletePaste(Number(id));
      if (!success) {
        ctx.status = 200;
        ctx.body = {
          success: false,
          code: ResponseCode.NOT_FOUND,
          message: '内容不存在'
        };
        return;
      }

      ctx.status = 200;
      ctx.body = {
        success: true,
        code: ResponseCode.SUCCESS,
        message: '删除成功'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`deletePaste处理完成，总耗时: ${totalTime}ms`);
    } catch (error) {
      logger.error('删除剪贴板内容失败:', error);
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.INTERNAL_ERROR,
        message: '服务器错误'
      };

      const totalTime = Date.now() - totalStartTime;
      logger.info(`deletePaste处理失败，总耗时: ${totalTime}ms`);
    }
  };
}
