import {
  CreateOrderInput,
  OrderRepository,
  ORDER_STATUSES,
  OrderStatus,
} from '../repositories/OrderRepository';
import { normalizePagination, toPaginatedResult } from '../types/pagination';

export class OrderService {
  constructor(private readonly orderRepository = new OrderRepository()) {}

  async getOrders(options: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: number;
    productId?: number;
    fromDate?: string;
    toDate?: string;
  }) {
    const pagination = normalizePagination(options.page, options.limit);
    const query = {
      ...pagination,
      status: options.status,
      customerId: options.customerId,
      productId: options.productId,
      fromDate: options.fromDate,
      toDate: options.toDate,
    };

    const [items, total] = await Promise.all([
      this.orderRepository.findAll(query),
      this.orderRepository.count(query),
    ]);

    return toPaginatedResult(items, pagination.page, pagination.limit, total);
  }

  async getOrderById(orderId: number) {
    this.validateId(orderId, 'order_id');
    return this.orderRepository.findById(orderId);
  }

  async createOrder(input: CreateOrderInput) {
    this.validateCreateOrderInput(input);
    return this.orderRepository.createOrder(input);
  }

  async updateOrderStatus(orderId: number, status: string) {
    this.validateId(orderId, 'order_id');

    if (!ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new Error(`status must be one of: ${ORDER_STATUSES.join(', ')}`);
    }

    return this.orderRepository.updateStatus(orderId, status as OrderStatus);
  }

  async getSummary() {
    return this.orderRepository.analytics.summary();
  }

  async getTopOrders() {
    return this.orderRepository.analytics.topOrders();
  }

  async getTopSpending() {
    return this.orderRepository.analytics.topSpending();
  }

  async getTopSoldProducts() {
    return this.orderRepository.analytics.topSoldProducts();
  }

  async getTopRevenue() {
    return this.orderRepository.analytics.topRevenue();
  }

  async getOrdersByStatus() {
    return this.orderRepository.analytics.ordersByStatus();
  }

  async getDailyRevenue() {
    return this.orderRepository.analytics.dailyRevenue();
  }

  private validateCreateOrderInput(input: CreateOrderInput): void {
    const requiredNumberFields: Array<keyof CreateOrderInput> = [
      'customer_id',
      'product_id',
      'quantity',
    ];

    for (const field of requiredNumberFields) {
      if (!Number.isFinite(input[field])) {
        throw new Error(`${field} must be a valid number`);
      }
    }

    if (input.customer_id <= 0) {
      throw new Error('customer_id must be greater than 0');
    }

    if (input.product_id <= 0) {
      throw new Error('product_id must be greater than 0');
    }

    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw new Error('quantity must be a positive integer');
    }

    if (input.total_amount !== undefined && input.total_amount <= 0) {
      throw new Error('total_amount must be greater than 0');
    }
  }

  private validateId(id: number, field: string): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`${field} must be a positive integer`);
    }
  }
}
