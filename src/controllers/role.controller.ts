import { Context } from 'koa';
import { ResponseCode } from '@/types/response';
import logger from '@/utils/logger';
import { RoleService } from '@/dao/role.service';

// 角色控制器
export const getRoleList = async (ctx: Context) => {
  const startTime = Date.now();
  try {
    const roleService = new RoleService();
    const roles = await roleService.getAllRoles();

    ctx.status = 200;
    ctx.body = {
      success: true,
      code: ResponseCode.SUCCESS,
      data: roles,
      message: '获取角色列表成功'
    };

    const totalTime = Date.now() - startTime;
    logger.info(`getRoleList处理完成，总耗时: ${totalTime}ms`);
  } catch (error) {
    logger.error('获取角色列表失败:', error);
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.INTERNAL_ERROR,
      message: '获取角色列表失败'
    };

    const totalTime = Date.now() - startTime;
    logger.info(`getRoleList处理失败，总耗时: ${totalTime}ms`);
  }
};
