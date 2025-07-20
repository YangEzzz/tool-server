import { Repository } from 'typeorm';
import { AppDataSource } from '@/database/connection';
import { Menu } from '@/models/Menu';
import { RoleMenu } from '@/models/RoleMenu';
import logger from '@/utils/logger';

export class MenuService {
  private menuRepository: Repository<Menu>;
  private roleMenuRepository: Repository<RoleMenu>;

  constructor() {
    this.menuRepository = AppDataSource.getRepository(Menu);
    this.roleMenuRepository = AppDataSource.getRepository(RoleMenu);
  }

  /**
   * 根据角色ID获取菜单列表
   * @param roleId 角色ID
   * @returns 用户可见的菜单列表
   */
  async getMenusByRoleId(roleId: number): Promise<Menu[]> {
    logger.info(`开始查询角色ID(${roleId})的菜单数据`);
    const dbStartTime = Date.now();

    // 优化查询: 直接使用join连接查询并附加条件，减少额外的过滤操作
    const roleMenus = await this.roleMenuRepository
      .createQueryBuilder('roleMenu')
      .innerJoinAndSelect('roleMenu.menu', 'menu')
      .where('roleMenu.role.id = :roleId', { roleId })
      .andWhere('menu.visible = :visible', { visible: true })
      .orderBy('menu.sort', 'ASC')
      .getMany();

    const menus = roleMenus.map(rm => rm.menu);

    const dbQueryTime = Date.now() - dbStartTime;
    logger.info(`查询用户菜单数据完成，耗时: ${dbQueryTime}ms, 获取到${menus.length}个菜单项`);

    return menus;
  }

  /**
   * 获取所有菜单
   * @returns 所有菜单列表
   */
  async getAllMenus(): Promise<Menu[]> {
    logger.info('开始查询所有菜单数据');
    const dbStartTime = Date.now();

    // 优化：一次性查询并排序
    const menus = await this.menuRepository
      .createQueryBuilder('menu')
      .orderBy('menu.sort', 'ASC')
      .getMany();

    const dbQueryTime = Date.now() - dbStartTime;
    logger.info(`查询所有菜单数据完成，耗时: ${dbQueryTime}ms, 获取到${menus.length}个菜单项`);

    return menus;
  }

  /**
   * 新建菜单
   * @param menu 菜单数据
   * @returns 保存后的菜单数据
   */

  async createMenu(menu: Partial<Menu>): Promise<Menu> {
    logger.info('开始创建菜单');
    const dbStartTime = Date.now();

    const newMenu = await this.menuRepository.save(menu);

    const dbQueryTime = Date.now() - dbStartTime;
    logger.info(`创建菜单完成，耗时: ${dbQueryTime}ms, 菜单ID: ${newMenu.id}`);

    return newMenu;
  }

  async updateMenu(id: number, menu: Partial<Menu>): Promise<Menu | null> {
    const result = await this.menuRepository.update(id, menu);
    if (result.affected === 0) {
      return null;
    }
    logger.info('更新菜单成功', result);
    return this.menuRepository.findOne({ where: { id } });
  }

  async deleteMenu(id: number): Promise<boolean> {
    const result = await this.menuRepository.delete(id);
    return result.affected === 1;
  }

  /**
   * 处理菜单权限分配
   * @param menu_id 菜单ID
   * @param role_id 角色ID数组
   * @returns 操作结果
   */
  async handlePermission(menu_id: number, role_id: number[]): Promise<{ success: boolean; message: string }> {
    logger.info(`开始处理菜单权限分配 - 菜单ID: ${menu_id}, 角色ID: [${role_id.join(', ')}]`);
    const startTime = Date.now();

    try {
      // 使用事务确保数据一致性
      await AppDataSource.transaction(async manager => {
        // 1. 删除该菜单的所有现有权限关系
        const deleteResult = await manager
          .createQueryBuilder()
          .delete()
          .from(RoleMenu)
          .where('menu_id = :menuId', { menuId: menu_id })
          .execute();

        logger.info(`删除菜单 ${menu_id} 的现有权限关系，影响行数: ${deleteResult.affected}`);

        // 2. 如果角色ID数组不为空，则添加新的权限关系
        if (role_id && role_id.length > 0) {
          // 验证角色ID是否有效
          const validRoles = await manager
            .createQueryBuilder()
            .select('role.id')
            .from('role', 'role')
            .where('role.id IN (:...roleIds)', { roleIds: role_id })
            .andWhere('role.status = :status', { status: true })
            .getRawMany();

          const validRoleIds = validRoles.map(r => r.id);

          if (validRoleIds.length !== role_id.length) {
            const invalidRoleIds = role_id.filter(id => !validRoleIds.includes(id));
            throw new Error(`无效的角色ID: [${invalidRoleIds.join(', ')}]`);
          }

          // 验证菜单ID是否有效
          const menuExists = await manager
            .createQueryBuilder()
            .select('menu.id')
            .from('menu', 'menu')
            .where('menu.id = :menuId', { menuId: menu_id })
            .getOne();

          if (!menuExists) {
            throw new Error(`无效的菜单ID: ${menu_id}`);
          }

          // 批量插入新的权限关系
          const roleMenuData = role_id.map(roleId => ({
            role: { id: roleId },
            menu: { id: menu_id }
          }));

          await manager.save(RoleMenu, roleMenuData);
          logger.info(`为菜单 ${menu_id} 添加了 ${role_id.length} 个角色权限关系`);
        } else {
          logger.info(`菜单 ${menu_id} 的角色权限已全部清除`);
        }
      });

      const totalTime = Date.now() - startTime;
      logger.info(`菜单权限分配完成，耗时: ${totalTime}ms`);

      return {
        success: true,
        message: '权限分配成功'
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error(`菜单权限分配失败，耗时: ${totalTime}ms`, error);

      return {
        success: false,
        message: error instanceof Error ? error.message : '权限分配失败'
      };
    }
  }

  /**
   * 构建菜单树
   * @param menus 菜单列表
   * @returns 菜单树结构
   */
  buildMenuTree(menus: Menu[]): any[] {
    const startTime = Date.now();

    // 优化：使用Map存储菜单，避免重复的filter操作
    const menuMap: Map<number, Menu> = new Map();
    const topLevelMenus: Menu[] = [];

    // 第一遍循环：构建menuMap
    for (const menu of menus) {
      logger.info('code'+menu.name+menu.permission_code+typeof menu.permission_code);
      menuMap.set(menu.id, menu);
    }

    // 第二遍循环：找出顶级菜单和建立父子关系
    for (const menu of menus) {
      if (menu.parent_id === 0) {
        topLevelMenus.push(menu);
      }
    }

    // 递归构建子菜单，使用Map减少查找复杂度
    const constructTree = (parentMenus: Menu[]): any[] => {
      return parentMenus.map(menu => {
        // 找出所有以当前菜单id为parent_id的菜单
        const children = menus.filter(m => m.parent_id === menu.id);
        return {
          id: menu.id,
          name: menu.name,
          path: menu.path,
          component: menu.component,
          icon: menu.icon,
          sort: menu.sort,
          visible: menu.visible,
          parentId: menu.parent_id,
          permission_code: menu.permission_code,
          children: children.length > 0 ? constructTree(children) : []
        };
      });
    };

    const result = constructTree(topLevelMenus);

    const treeTime = Date.now() - startTime;
    logger.info(`菜单树构建完成，耗时: ${treeTime}ms，顶级菜单数量: ${topLevelMenus.length}`);

    return result;
  }
}
