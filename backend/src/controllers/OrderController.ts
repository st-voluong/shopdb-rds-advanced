import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';

export class OrderController {
  constructor(private readonly orderService = new OrderService()) {}

  getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.orderService.getOrders({
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        status: req.query.status?.toString(),
        customerId:
          req.query.customerId !== undefined
            ? Number(req.query.customerId)
            : undefined,
        productId:
          req.query.productId !== undefined
            ? Number(req.query.productId)
            : undefined,
        fromDate: req.query.fromDate?.toString(),
        toDate: req.query.toDate?.toString(),
      });

      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
      });
    }
  };

  getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const order = await this.orderService.getOrderById(Number(req.params.id));

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      res.status(200).json({ success: true, data: order });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch order',
      });
    }
  };

  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const order = await this.orderService.createOrder({
        customer_id: Number(req.body.customer_id),
        product_id: Number(req.body.product_id),
        quantity: Number(req.body.quantity),
        total_amount:
          req.body.total_amount !== undefined
            ? Number(req.body.total_amount)
            : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create order',
      });
    }
  };

  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const updated = await this.orderService.updateOrderStatus(
        Number(req.params.id),
        req.body.status,
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update order status',
      });
    }
  };

  getSummary = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.orderService.getSummary();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics summary',
      });
    }
  };

  getTopOrders = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.orderService.getTopOrders();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top customers by order count',
      });
    }
  };

  getTopSpending = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.orderService.getTopSpending();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top customers by spending',
      });
    }
  };

  getTopSoldProducts = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.orderService.getTopSoldProducts();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top products by quantity sold',
      });
    }
  };

  getTopRevenue = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.orderService.getTopRevenue();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top products by revenue',
      });
    }
  };

  getOrdersByStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.orderService.getOrdersByStatus();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch orders by status',
      });
    }
  };

  getDailyRevenue = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.orderService.getDailyRevenue();
      res.status(200).json({ success: true, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch daily revenue',
      });
    }
  };
}
