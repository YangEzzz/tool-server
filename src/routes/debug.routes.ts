import Router from 'koa-router';
import { DebugController } from '@/controllers/debug.controller';
import { isAuthenticated } from '@/middlewares/authMiddleware';

const router = new Router({
  prefix: '/debug',
});

const debugController = new DebugController();

router.post('/log', debugController.createDebugLog);
router.get('/logList', isAuthenticated, debugController.getDebugLogs);

export default router;
