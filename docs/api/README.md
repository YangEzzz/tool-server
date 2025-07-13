# API Documentation

## Base URL
`http://localhost:3000/api`

## Endpoints

### Health Check
GET /health
检查API服务状态

请求：
- 无参数

响应：
{
  "status": "ok",
  "timestamp": "2023-05-13T12:00:00.000Z"
}

### User Endpoints
GET /users
获取用户列表

GET /users/:id
获取指定用户信息 