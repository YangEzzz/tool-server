/**
 * 响应状态码枚举
 */
export enum ResponseCode {
  SUCCESS = 200,           // 成功
  BAD_REQUEST = 400,       // 请求参数错误
  UNAUTHORIZED = 401,      // 未授权
  FORBIDDEN = 403,         // 禁止访问
  NOT_FOUND = 404,         // 资源不存在
  CONFLICT = 409,          // 资源冲突
  INTERNAL_ERROR = 500     // 服务器内部错误
}

/**
 * 通用响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;        // 请求是否成功
  code: ResponseCode;      // 业务状态码
  data?: T;                // 响应数据
  message: string;         // 响应消息
} 