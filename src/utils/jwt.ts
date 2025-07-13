import jwt from 'jsonwebtoken';

// 从环境变量获取JWT密钥，如果不存在则使用默认值
// 注意：在生产环境中应该设置复杂的密钥并通过环境变量传入
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // 默认7天

export interface JwtPayload {
  userId: number;
  email: string;
  // 可以添加其他需要的字段，如角色等
}

/**
 * 生成JWT令牌
 * @param payload 需要包含在令牌中的数据
 * @returns 生成的JWT令牌
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d'
  });
};

/**
 * 验证JWT令牌
 * @param token 需要验证的JWT令牌
 * @returns 如果验证成功则返回令牌中的数据，否则返回null
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

/**
 * 从请求头中提取JWT令牌
 * @param authHeader Authorization 请求头的值
 * @returns 提取的JWT令牌，如果无法提取则返回null
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  // Authorization: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}; 