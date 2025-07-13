import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolesAndMenus1720000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建基础角色
    await queryRunner.query(`
      INSERT INTO "role" ("name", "description", "isAdmin", "isSuperAdmin", "status")
      VALUES 
        ('普通用户', '系统普通用户，拥有基本操作权限', false, false, true),
        ('管理员', '系统管理员，拥有大部分管理功能', true, false, true),
        ('超级管理员', '系统超级管理员，拥有所有权限', true, true, true)
    `);

    // 创建示例菜单
    await queryRunner.query(`
      INSERT INTO "menu" ("name", "path", "component", "icon", "parent_id", "sort", "visible", "permission_code")
      VALUES 
        ('控制台', '/dashboard', 'Dashboard', 'dashboard', 0, 1, true, 'dashboard'),
        ('用户管理', '/users', 'UserManagement', 'user', 0, 2, true, 'user:view'),
        ('角色管理', '/roles', 'RoleManagement', 'team', 0, 3, true, 'role:view'),
        ('菜单管理', '/menus', 'MenuManagement', 'menu', 0, 4, true, 'menu:view'),
        ('系统设置', '/settings', 'Settings', 'setting', 0, 5, true, 'setting:view')
    `);

    // 获取角色和菜单 ID
    const roles = await queryRunner.query(`SELECT id FROM "role"`);
    const menus = await queryRunner.query(`SELECT id FROM "menu"`);

    // 普通用户只能访问控制台
    await queryRunner.query(`
      INSERT INTO "role_menu" ("role_id", "menu_id")
      VALUES (${roles[0].id}, ${menus[0].id})
    `);

    // 管理员可以访问除菜单管理外的所有菜单
    for (let i = 0; i < 4; i++) {
      await queryRunner.query(`
        INSERT INTO "role_menu" ("role_id", "menu_id")
        VALUES (${roles[1].id}, ${menus[i].id})
      `);
    }

    // 超级管理员可以访问所有菜单
    for (let i = 0; i < menus.length; i++) {
      await queryRunner.query(`
        INSERT INTO "role_menu" ("role_id", "menu_id")
        VALUES (${roles[2].id}, ${menus[i].id})
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除所有角色菜单关联
    await queryRunner.query(`DELETE FROM "role_menu"`);
    
    // 删除所有菜单
    await queryRunner.query(`DELETE FROM "menu"`);
    
    // 删除所有角色
    await queryRunner.query(`DELETE FROM "role"`);
  }
} 