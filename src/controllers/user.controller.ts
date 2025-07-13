import { AppDataSource } from '@/database/connection';
import { User } from '@/models/User';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';
import { Context } from 'koa';
import { UserService } from '@/dao/user.service';
import { ResponseCode } from '../types/response';

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 移除用户敏感信息
const sanitizeUser = (user: User) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// 生成JWT令牌
const generateToken = (user: User): string => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 获取用户列表
export const getUserList = async (ctx: Context) => {
  const startTime = Date.now();
  try {
    // 获取查询参数
    const { page = 1, pageSize = 10, keyword = '' } = ctx.query;
    
    // 转换为正确的类型
    const pageNum = parseInt(page as string, 10);
    const limit = parseInt(pageSize as string, 10);
    const offset = (pageNum - 1) * limit;
    const searchKeyword = keyword as string;
    
    // 创建查询构建器
    const userRepository = AppDataSource.getRepository(User);
    const queryBuilder = userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');
    
    // 添加搜索条件
    if (searchKeyword) {
      queryBuilder.where(
        '(user.name LIKE :keyword OR user.email LIKE :keyword)',
        { keyword: `%${searchKeyword}%` }
      );
    }
    
    // 获取总数
    const total = await queryBuilder.getCount();
    
    // 添加分页
    queryBuilder.skip(offset).take(limit);
    
    // 执行查询
    const users = await queryBuilder.getMany();
    
    // 移除敏感信息
    const sanitizedUsers = users.map(user => sanitizeUser(user));
    
    // 返回结果
    ctx.status = 200;
    ctx.body = {
      success: true,
      code: ResponseCode.SUCCESS,
      data: {
        list: sanitizedUsers,
        pagination: {
          current: pageNum,
          pageSize: limit,
          total
        }
      },
      message: '获取用户列表成功'
    };
    
    const totalTime = Date.now() - startTime;
    logger.info(`getUserList处理完成，总耗时: ${totalTime}ms`);
  } catch (error) {
    logger.error('获取用户列表失败:', error);
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.INTERNAL_ERROR,
      message: '获取用户列表失败'
    };
    
    const totalTime = Date.now() - startTime;
    logger.info(`getUserList处理失败，总耗时: ${totalTime}ms`);
  }
};

export const register = async (ctx: Context) => {
  try {
    // 获取请求体数据
    const { name, email, password } = ctx.request.body as {
      name: string;
      email: string;
      password: string;
    };

    // 基本输入验证
    if (!email || !password || !name) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.BAD_REQUEST,
        message: '缺少必要字段',
      };
      return;
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.BAD_REQUEST,
        message: '邮箱格式不正确',
      };
      return;
    }

    // 密码强度验证
    if (password.length < 6) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.BAD_REQUEST,
        message: '密码至少需要6个字符',
      };
      return;
    }

    const userService = new UserService();
    const newUser = await userService.createAndSaveUser({
      name,
      email,
      password,
    });

    // 移除敏感信息
    const sanitizedUser = sanitizeUser(newUser);

    // 生成令牌
    const token = generateToken(newUser);

    ctx.status = 200;
    ctx.body = {
      success: true,
      code: ResponseCode.SUCCESS,
      data: { ...sanitizedUser, token },
      message: '注册成功',
    };
  } catch (error: any) {
    logger.error('创建用户失败:', error);
    
    // 处理特定错误
    if (error.message === '用户已存在') {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.CONFLICT,
        message: '该邮箱已被注册',
      };
      return;
    }
    
    if (error.message === '密码至少需要6个字符' || error.message === '缺少必要字段') {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.BAD_REQUEST,
        message: error.message,
      };
      return;
    }
    
    // 通用错误处理
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.INTERNAL_ERROR,
      message: '注册失败，请稍后再试',
    };
    return;
  }
};

export const getUserInfo = async (ctx: Context) => {
  // 通过token获取用户信息
  const token = ctx.headers.authorization?.split(' ')[1];
  if (!token) {
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.UNAUTHORIZED,
      message: '未提供token',
    };
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const userId = decoded.userId;
    
    const userService = new UserService();
    const user = await userService.findById(userId);

    if (!user) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.NOT_FOUND,
        message: '用户不存在',
        };
      return;
    }

    // 移除敏感信息
    const sanitizedUser = sanitizeUser(user);

    ctx.status = 200;
    ctx.body = {
      success: true,
      code: ResponseCode.SUCCESS,
      data: sanitizedUser,
      message: '获取用户信息成功',
    };
  } catch (error) {
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.UNAUTHORIZED,
      message: '无效的token',
    };
  }
};

export const login = async (ctx: Context) => {
  try {
    const { email, password } = ctx.request.body as {
      email: string;
      password: string;
    };

    // 基本输入验证
    if (!email || !password) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.BAD_REQUEST,
        message: '邮箱和密码不能为空',
      };
      return;
    }

    const userService = new UserService();
    const user = await userService.getUserByEmail(email);

    if (!user) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.UNAUTHORIZED,
        message: '用户不存在',
      };
      return;
    }

    // 验证密码
    const isPasswordValid = await userService.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.UNAUTHORIZED,
        message: '密码错误',
      };
      return;
    }

    // 移除敏感信息
    const sanitizedUser = sanitizeUser(user);

    // 生成JWT令牌
    const token = generateToken(user);

    ctx.status = 200;
    ctx.body = {
      success: true,
      code: ResponseCode.SUCCESS,
      data: { ...sanitizedUser, token },
      message: '登录成功',
    };
  } catch (error) {
    logger.error('登录失败:', error);
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.INTERNAL_ERROR,
      message: '登录失败，请稍后再试',
    };
  }
};

// 删除用户
export const deleteUser = async (ctx: Context) => {
  try {
    const { id } = ctx.request.body as { id: number };
    
    if (!id) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.BAD_REQUEST,
        message: '缺少用户ID'
      };
      return;
    }
    
    const userService = new UserService();
    await userService.deleteUser(id);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      code: ResponseCode.SUCCESS,
      data: {
        success: true,
        message: '删除用户成功'
      },
      message: '删除用户成功'
    };
  } catch (error: any) {
    logger.error('删除用户失败:', error);
    
    // 处理特定错误
    if (error.message === '用户不存在') {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.NOT_FOUND,
        message: '用户不存在'
      };
      return;
    }
    
    if (error.message === '不能删除最后一个管理员账号') {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.FORBIDDEN,
        message: '不能删除最后一个管理员账号'
      };
      return;
    }
    
    // 通用错误处理
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.INTERNAL_ERROR,
      message: '删除用户失败，请稍后再试'
    };
  }
};

// 更新用户角色
export const updateUserRole = async (ctx: Context) => {
  try {
    const { userId, roleId } = ctx.request.body as { userId: number; roleId: number };
    
    if (!userId || !roleId) {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.BAD_REQUEST,
        message: '缺少用户ID或角色ID'
      };
      return;
    }
    
    const userService = new UserService();
    await userService.updateUserRole(userId, roleId);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      code: ResponseCode.SUCCESS,
      data: {
        success: true,
        message: '更新用户角色成功'
      },
      message: '更新用户角色成功'
    };
  } catch (error: any) {
    logger.error('更新用户角色失败:', error);
    
    // 处理特定错误
    if (error.message === '用户不存在') {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.NOT_FOUND,
        message: '用户不存在'
      };
      return;
    }
    
    if (error.message === '不能更改最后一个管理员的角色') {
      ctx.status = 200;
      ctx.body = {
        success: false,
        code: ResponseCode.FORBIDDEN,
        message: '不能更改最后一个管理员的角色'
      };
      return;
    }
    
    // 通用错误处理
    ctx.status = 200;
    ctx.body = {
      success: false,
      code: ResponseCode.INTERNAL_ERROR,
      message: '更新用户角色失败，请稍后再试'
    };
  }
};

