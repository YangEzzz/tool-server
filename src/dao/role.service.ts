import { Repository } from 'typeorm';
import { AppDataSource } from '@/database/connection';
import { Role } from '@/models/Role';
import logger from '@/utils/logger';

export class RoleService {
  private roleRepository: Repository<Role>;

  constructor() {
    this.roleRepository = AppDataSource.getRepository(Role);
  }

  /**
   * 获取所有角色列表
   * @returns 角色列表
   */
  async getAllRoles(): Promise<Role[]> {
    logger.info('获取所有角色列表');
    return this.roleRepository.find({
      where: {
        status: true
      },
      order: {
        id: 'ASC'
      }
    });
  }
} 