import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router = Router();
const orderController = new OrderController();

router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrderById);
router.post('/orders', orderController.createOrder);
router.patch('/orders/:id/status', orderController.updateOrderStatus);
router.get('/analytics/summary', orderController.getSummary);
router.get('/analytics/top-orders', orderController.getTopOrders);
router.get('/analytics/top-spending', orderController.getTopSpending);
router.get('/analytics/top-sold-products', orderController.getTopSoldProducts);
router.get('/analytics/top-revenue', orderController.getTopRevenue);
router.get('/analytics/orders-by-status', orderController.getOrdersByStatus);
router.get('/analytics/daily-revenue', orderController.getDailyRevenue);

export default router;
