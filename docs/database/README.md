# 数据库设计文档

## 表结构

### Users 用户表
| 字段名      | 类型      | 说明         | 约束           |
|------------|-----------|-------------|----------------|
| id         | UUID      | 用户ID       | 主键           |
| username   | VARCHAR   | 用户名       | 非空           |
| email      | VARCHAR   | 电子邮件     | 非空，唯一     |
| password   | VARCHAR   | 密码         | 非空           |
| created_at | TIMESTAMP | 创建时间     | 默认当前时间   |
| updated_at | TIMESTAMP | 更新时间     | 默认当前时间   |

## 索引
- users_email_idx: 用户表邮箱索引 