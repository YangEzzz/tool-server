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
          permissionCode: menu.permission_code,
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