import Router from 'koa-router';
import MenuController from '../controllers/menuController';
import { isAuthenticated, isSuperAdmin } from '@/middlewares/authMiddleware';
import { getTrendingList } from '@/controllers/tool.controller';

const router = new Router({ prefix: '/tool' });

// 获取当前用户的菜单 (需要登录)
router.get('/github_trending', isAuthenticated, getTrendingList);

export default router;
