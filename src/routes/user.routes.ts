import Router from 'koa-router';
import { register, getUserInfo, login, getUserList, deleteUser, updateUserRole } from '@/controllers/user.controller';
import { isAdmin, isAuthenticated } from '@/middlewares/authMiddleware';
import { getRoleList } from '@/controllers/role.controller';

const router = new Router({
  prefix: '/user',
});

router.post('/register', register);
router.post('/login', login);
router.get('/info', getUserInfo);
router.get('/list', isAuthenticated, getUserList);
router.post('/delete', isAuthenticated, deleteUser);
router.get('/roleList', isAuthenticated, getRoleList);
// 更新用户角色 (需要管理员权限)
router.post('/update-role', isAuthenticated, isAdmin, updateUserRole);

export default router;
