import { User } from '@/models/User';
import { AppDataSource } from '@/database/connection';
import { Repository } from 'typeorm';
import crypto from 'crypto';

export class UserService {
  private userRepository: Repository<User>;
  private readonly SALT_LENGTH = 16;
  private readonly KEY_LENGTH = 64;
  private readonly ITERATIONS = 10000;
  private readonly DIGEST = 'sha512';
  private readonly DEFAULT_ROLE_ID = 1; // 默认角色ID为1（普通用户）
  private readonly ADMIN_ROLE_ID = 2; // 管理员角色ID

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  getUserByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async hashPassword(password: string): Promise<string> {
    // 生成随机盐值
    const salt = crypto.randomBytes(this.SALT_LENGTH).toString('hex');
    // 使用PBKDF2算法对密码进行哈希
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      this.DIGEST
    ).toString('hex');
    
    // 返回格式: iterations:salt:hash
    return `${this.ITERATIONS}:${salt}:${hash}`;
  }

  async verifyPassword(plainPassword: string, storedPassword: string): Promise<boolean> {
    try {
      // 解析存储的密码
      const [iterations, salt, storedHash] = storedPassword.split(':');
      
      // 使用相同参数重新计算哈希
      const hash = crypto.pbkdf2Sync(
        plainPassword,
        salt,
        parseInt(iterations, 10),
        this.KEY_LENGTH,
        this.DIGEST
      ).toString('hex');
      
      // 比较计算出的哈希与存储的哈希
      return storedHash === hash;
    } catch (error) {
      // 如果解析失败，返回false
      return false;
    }
  }

  createUser(userData: {
    name: string;
    email: string;
    password: string;
  }): User {
    // 只创建实例，不保存到数据库
    return this.userRepository.create(userData);
  }

  async saveUser(user: User): Promise<User> {
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      // 处理错误，例如唯一约束冲突
      throw error;
    }
  }

  async createAndSaveUser(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    // 验证数据
    if (!userData.email || !userData.password || !userData.name) {
      throw new Error('缺少必要字段');
    }
    
    if (userData.password.length < 6) {
      throw new Error('密码至少需要6个字符');
    }
    
    // 检查用户是否已存在
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('用户已存在');
    }
    
    // 加密密码
    const hashedPassword = await this.hashPassword(userData.password);
    
    // 创建用户实例
    const user = this.createUser({
      ...userData,
      password: hashedPassword
    });
    
    // 设置角色ID为1（普通用户）
    user.role = { id: this.DEFAULT_ROLE_ID } as any;
    
    // 保存用户
    return await this.saveUser(user);
  }

  async findAll(page: number = 1, pageSize: number = 10): Promise<{ data: User[]; total: number; page: number; pageSize: number }> {
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    
    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  // 对于可能的并发情况，添加乐观锁或版本控制
  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    // 如果要更新密码，先加密
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
    
    const result = await this.userRepository.update(id, userData);
    if (result.affected === 0) {
      return null;
    }
    return this.findById(id);
  }
  
  /**
   * 删除用户
   * @param id 用户ID
   * @returns 是否删除成功
   */
  async deleteUser(id: number): Promise<boolean> {
    // 查找用户
    const user = await this.findById(id);
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 检查是否是最后一个管理员
    if (user.role?.id === this.ADMIN_ROLE_ID) {
      // 查询管理员数量
      const adminCount = await this.userRepository.count({
        where: {
          role: { id: this.ADMIN_ROLE_ID }
        }
      });
      
      if (adminCount <= 1) {
        throw new Error('不能删除最后一个管理员账号');
      }
    }
    
    // 执行删除
    const result = await this.userRepository.delete(id);
    return result.affected === 1;
  }

  /**
   * 更新用户角色
   * @param userId 用户ID
   * @param roleId 角色ID
   * @returns 更新后的用户信息
   */
  async updateUserRole(userId: number, roleId: number): Promise<User | null> {
    // 查找用户
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 如果用户是管理员且要修改角色，需要检查是否是最后一个管理员
    if (user.role?.id === this.ADMIN_ROLE_ID && roleId !== this.ADMIN_ROLE_ID) {
      // 查询管理员数量
      const adminCount = await this.userRepository.count({
        where: {
          role: { id: this.ADMIN_ROLE_ID }
        }
      });
      
      if (adminCount <= 1) {
        throw new Error('不能更改最后一个管理员的角色');
      }
    }
    
    // 更新角色
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ role: { id: roleId } })
      .where("id = :id", { id: userId })
      .execute();
    
    // 返回更新后的用户
    return this.findById(userId);
  }
}
