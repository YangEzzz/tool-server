import { Context } from 'koa';
import { ResponseCode } from '../types/response';
import logger from '@/utils/logger';
import { MenuService } from '@/dao/menu.service';

export default class MenuController {
  private static menuService = new MenuService();

  // 获取当前用户的菜单列表
  static async getUserMenus(ctx: Context) {
    const totalStartTime = Date.now();
    try {
      const user = ctx.state.user;
      
      if (!user) {
        ctx.status = 200;
        ctx.body = { 
          success: false, 
          code: ResponseCode.UNAUTHORIZED,
          message: '用户未登录' 
        };
        return;
      }
      
      const roleId = user.role.id;
      logger.info(`开始查询用户(${user.email})的菜单数据`);
      
      // 使用MenuService获取菜单数据
      const dbStartTime = Date.now();
      const menus = await MenuController.menuService.getMenusByRoleId(roleId);
      const dbQueryTime = Date.now() - dbStartTime;
      
      // 构建菜单树
      const treeStartTime = Date.now();
      const menuTree = MenuController.menuService.buildMenuTree(menus);
      const treeTime = Date.now() - treeStartTime;
      logger.info(`构建菜单树完成，耗时: ${treeTime}ms`);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: ResponseCode.SUCCESS,
        data: menuTree,
        message: '获取菜单成功'
      };
      
      const totalTime = Date.now() - totalStartTime;
      logger.info(`getUserMenus总处理完成，总耗时: ${totalTime}ms (DB: ${dbQueryTime}ms, Tree: ${treeTime}ms, 其他: ${totalTime - dbQueryTime - treeTime}ms)`);
    } catch (error) {
      console.error('获取用户菜单出错:', error);
      ctx.status = 200;
      ctx.body = { 
        success: false, 
        code: ResponseCode.INTERNAL_ERROR,
        message: '获取菜单失败' 
      };
      const totalTime = Date.now() - totalStartTime;
      logger.info(`getUserMenus处理失败，总耗时: ${totalTime}ms`);
    }
  }
  
  // 获取所有菜单 (仅超级管理员可访问)
  static async getAllMenus(ctx: Context) {
    const totalStartTime = Date.now();
    try {
      // 使用MenuService获取所有菜单
      const dbStartTime = Date.now();
      const menus = await MenuController.menuService.getAllMenus();
      const dbQueryTime = Date.now() - dbStartTime;
      
      // 构建菜单树
      const treeStartTime = Date.now();
      const menuTree = MenuController.menuService.buildMenuTree(menus);
      const treeTime = Date.now() - treeStartTime;
      logger.info(`构建菜单树完成，耗时: ${treeTime}ms`);
      
      ctx.status = 200;
      ctx.body = {
        success: true,
        code: ResponseCode.SUCCESS,
        data: menuTree,
        message: '获取所有菜单成功'
      };
      
      const totalTime = Date.now() - totalStartTime;
      logger.info(`getAllMenus总处理完成，总耗时: ${totalTime}ms (DB: ${dbQueryTime}ms, Tree: ${treeTime}ms, 其他: ${totalTime - dbQueryTime - treeTime}ms)`);
    } catch (error) {
      console.error('获取所有菜单出错:', error);
      ctx.status = 200;
      ctx.body = { 
        success: false, 
        code: ResponseCode.INTERNAL_ERROR,
        message: '获取菜单失败' 
      };
      const totalTime = Date.now() - totalStartTime;
      logger.info(`getAllMenus处理失败，总耗时: ${totalTime}ms`);
    }
  }
} 