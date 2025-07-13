import Router from 'koa-router';
import userRouter from './user.routes';
import menuRouter from './menuRoutes';
import pasteRouter from './paste.routes';
import toolRouter from './tool.routes';

const router = new Router({
  prefix: '/api'
});

router.use(userRouter.routes());
router.use(menuRouter.routes());
router.use(pasteRouter.routes());
router.use(toolRouter.routes());

export default router;
