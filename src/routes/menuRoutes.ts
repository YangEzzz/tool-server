import Router from 'koa-router';
import MenuController from '../controllers/menuController';
import { isAuthenticated, isAdmin, isSuperAdmin } from '../middlewares/authMiddleware';

const router = new Router({ prefix: '/menus' });

// 获取当前用户的菜单 (需要登录)
router.get('/user', isAuthenticated, MenuController.getUserMenus);

// 获取所有菜单 (需要超级管理员权限)
router.get('/all', isAuthenticated, isSuperAdmin, MenuController.getAllMenus);

export default router; 