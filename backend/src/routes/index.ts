import { Router } from 'express';
import customerRoutes from './customerRoutes';
import orderRoutes from './orderRoutes';
import productRoutes from './productRoutes';

const router = Router();

router.use(customerRoutes);
router.use(productRoutes);
router.use(orderRoutes);

export default router;
