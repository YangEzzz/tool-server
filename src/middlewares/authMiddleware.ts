import { Context, Next } from 'koa';
import { User } from '../models/User';
import { RoleMenu } from '../models/RoleMenu';
import { Menu } from '../models/Menu';
import { AppDataSource } from '../database/connection';
import jwt from 'jsonwebtoken';
import { ResponseCode } from '../types/response';
import logger from '@/utils/logger';

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 创建用户仓库供复用
const userRepository = AppDataSource.getRepository(User);

// 验证用户是否已登录
export const isAuthenticated = async (ctx: Context, next: Next) => {
  const authStartTime = Date.now();
  logger.info(`开始认证处理: ${ctx.method} ${ctx.url}`);

  const authHeader = ctx.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.UNAUTHORIZED,
      message: '未提供有效的认证令牌'
    };
    return;
  }

  const token = authHeader.substring(7); // 去掉'Bearer '前缀

  try {
    const jwtStartTime = Date.now();
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const jwtTime = Date.now() - jwtStartTime;
    logger.info(`JWT验证耗时: ${jwtTime}ms`);

    const userId = decoded.userId;

    const dbStartTime = Date.now();

    // 优化认证查询，只查询必要字段
    const ormQueryStartTime = Date.now();

    // 仅查询认证必需的字段
    const user = await userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.status',
        'role.id',
        'role.isAdmin',
        'role.isSuperAdmin'
      ])
      .innerJoin('user.role', 'role')
      .where('user.id = :userId', { userId })
      .andWhere('user.status = :status', { status: true })
      .getOne();

    const ormQueryTime = Date.now() - ormQueryStartTime;
    logger.info(`优化后的ORM查询耗时: ${ormQueryTime}ms`);

    if (!user) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.UNAUTHORIZED,
        message: '用户不存在或已被禁用'
      };
      return;
    }

    ctx.state.user = user;

    const dbTime = Date.now() - dbStartTime;
    logger.info(`认证数据库查询耗时: ${dbTime}ms`);

    await next();

    const authTotalTime = Date.now() - authStartTime;
    logger.info(`认证中间件总耗时: ${authTotalTime}ms`);
  } catch (error) {
    logger.error('认证错误:', error);
    ctx.status = 401;
    ctx.body = {
      success: false,
      code: ResponseCode.UNAUTHORIZED,
      message: '无效的认证令牌'
    };
    const authTotalTime = Date.now() - authStartTime;
    logger.info(`认证失败总耗时: ${authTotalTime}ms`);
    return;
  }
};

// 检查用户是否有特定权限
export const hasPermission = (permissionCode: string) => {
  return async (ctx: Context, next: Next) => {
    if (!ctx.state.user) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.UNAUTHORIZED,
        message: '用户未登录'
      };
      return;
    }

    // 超级管理员拥有所有权限
    if (ctx.state.user.role.isSuperAdmin) {
      await next();
      return;
    }

    // 使用queryBuilder优化菜单权限查询
    const permStartTime = Date.now();

    const roleMenu = await AppDataSource
      .createQueryBuilder()
      .select('role_menu.id')
      .from(RoleMenu, 'role_menu')
      .innerJoin('role_menu.menu', 'menu')
      .where('role_menu.role_id = :roleId', { roleId: ctx.state.user.role.id })
      .andWhere('menu.permission_code = :permissionCode', { permissionCode })
      .getOne();

    const permQueryTime = Date.now() - permStartTime;
    logger.info(`权限查询耗时: ${permQueryTime}ms`);

    if (!roleMenu) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.FORBIDDEN,
        message: '没有访问权限'
      };
      return;
    }

    await next();
  };
};

// 验证用户是否为管理员
export const isAdmin = async (ctx: Context, next: Next) => {
  if (!ctx.state.user) {
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.UNAUTHORIZED,
      message: '用户未登录'
    };
    return;
  }

  if (!ctx.state.user.role.isAdmin) {
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.FORBIDDEN,
      message: '需要管理员权限'
    };
    return;
  }

  await next();
};

// 验证用户是否为超级管理员
export const isSuperAdmin = async (ctx: Context, next: Next) => {
  if (!ctx.state.user) {
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.UNAUTHORIZED,
      message: '用户未登录'
    };
    return;
  }

  if (!ctx.state.user.role.isSuperAdmin) {
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.FORBIDDEN,
      message: '需要超级管理员权限'
    };
    return;
  }

  await next();
};
