import Router from 'koa-router';
import { PasteController } from '@/controllers/paste.controller';
import { isAuthenticated } from '@/middlewares/authMiddleware';

/**
 * 剪贴板API路由
 * 所有接口都需要用户登录
 * 提供创建、查询、删除剪贴板内容的接口
 */
const router = new Router({
  prefix: '/pastes', // 使用复数形式，符合RESTful规范
});

const pasteController = new PasteController();

// 所有接口都需要登录
router.use(isAuthenticated);

/**
 * 获取所有公开的剪贴板内容
 * 公开是指所有用户可见的内容
 * @route GET /api/pastes/public
 * @access 需要登录
 */
router.get('/public', pasteController.getPublicPastes);

/**
 * 获取当前登录用户的所有剪贴板内容
 * @route GET /api/pastes/mine
 * @access 需要登录
 */
router.get('/mine', pasteController.getUserPastes);

/**
 * 获取指定ID的剪贴板内容详情
 * @route GET /api/pastes/detail/:id
 * @param {string} id - 剪贴板ID
 * @access 需要登录(仅公开内容或者自己创建的内容)
 */
router.get('/detail/:id', pasteController.getPasteById);

/**
 * 创建新的剪贴板内容
 * @route POST /api/pastes/create
 * @body {string} content - 文本内容
 * @body {boolean} [isPublic=true] - 是否公开给所有用户查看
 * @access 需要登录
 */
router.post('/create', pasteController.createPaste);

/**
 * 删除指定ID的剪贴板内容
 * @route DELETE /api/pastes/remove/:id
 * @param {string} id - 剪贴板ID
 * @access 需要登录且为创建者
 */
router.delete('/remove/:id', pasteController.deletePaste);

export default router; 