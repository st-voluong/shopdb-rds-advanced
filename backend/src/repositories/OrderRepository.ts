import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { masterPool, replicaPool } from '../config/database';

export const ORDER_STATUSES = [
  'Pending',
  'Payment Received',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface CreateOrderInput {
  customer_id: number;
  product_id: number;
  quantity: number;
  total_amount?: number;
}

export interface CreatedOrder {
  order_id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  status: OrderStatus;
  total_amount: number;
}

export interface OrderListQuery {
  page: number;
  limit: number;
  offset: number;
  status?: string;
  customerId?: number;
  productId?: number;
  fromDate?: string;
  toDate?: string;
}

export class OrderRepository {
  analytics = {
    summary: async (): Promise<RowDataPacket> => {
      const [rows] = await replicaPool.query<RowDataPacket[]>(
        `
          SELECT
            (SELECT COUNT(*) FROM customers) AS total_customers,
            (SELECT COUNT(*) FROM products) AS total_products,
            (SELECT COUNT(*) FROM orders) AS total_orders,
            (SELECT COALESCE(SUM(total_amount), 0)
             FROM orders
             WHERE status != 'Cancelled') AS total_revenue,
            (SELECT COALESCE(AVG(total_amount), 0)
             FROM orders
             WHERE status != 'Cancelled') AS average_order_value,
            (SELECT COUNT(*)
             FROM products
             WHERE stock_quantity <= 10) AS low_stock_products
        `,
      );

      return rows[0];
    },

    topOrders: async (): Promise<RowDataPacket[]> => {
      const [rows] = await replicaPool.query<RowDataPacket[]>(
        `
          SELECT
            c.customer_id,
            c.first_name,
            c.last_name,
            c.email,
            COUNT(o.order_id) AS order_count
          FROM customers c
          INNER JOIN orders o ON o.customer_id = c.customer_id
          GROUP BY c.customer_id, c.first_name, c.last_name, c.email
          ORDER BY order_count DESC
          LIMIT 5
        `,
      );

      return rows;
    },

    topSpending: async (): Promise<RowDataPacket[]> => {
      const [rows] = await replicaPool.query<RowDataPacket[]>(
        `
          SELECT
            c.customer_id,
            c.first_name,
            c.last_name,
            c.email,
            SUM(o.total_amount) AS total_spending
          FROM customers c
          INNER JOIN orders o ON o.customer_id = c.customer_id
          WHERE o.status != 'Cancelled'
          GROUP BY c.customer_id, c.first_name, c.last_name, c.email
          ORDER BY total_spending DESC
          LIMIT 5
        `,
      );

      return rows;
    },

    topSoldProducts: async (): Promise<RowDataPacket[]> => {
      const [rows] = await replicaPool.query<RowDataPacket[]>(
        `
          SELECT
            p.product_id,
            p.name,
            SUM(o.quantity) AS quantity_sold
          FROM products p
          INNER JOIN orders o ON o.product_id = p.product_id
          WHERE o.status != 'Cancelled'
          GROUP BY p.product_id, p.name
          ORDER BY quantity_sold DESC
          LIMIT 5
        `,
      );

      return rows;
    },

    topRevenue: async (): Promise<RowDataPacket[]> => {
      const [rows] = await replicaPool.query<RowDataPacket[]>(
        `
          SELECT
            p.product_id,
            p.name,
            SUM(o.total_amount) AS revenue
          FROM products p
          INNER JOIN orders o ON o.product_id = p.product_id
          WHERE o.status != 'Cancelled'
          GROUP BY p.product_id, p.name
          ORDER BY revenue DESC
          LIMIT 5
        `,
      );

      return rows;
    },

    ordersByStatus: async (): Promise<RowDataPacket[]> => {
      const [rows] = await replicaPool.query<RowDataPacket[]>(
        `
          SELECT status, COUNT(*) AS total_orders
          FROM orders
          GROUP BY status
          ORDER BY total_orders DESC
        `,
      );

      return rows;
    },

    dailyRevenue: async (): Promise<RowDataPacket[]> => {
      const [rows] = await replicaPool.query<RowDataPacket[]>(
        `
          SELECT
            DATE(order_date) AS order_day,
            COUNT(*) AS order_count,
            SUM(total_amount) AS revenue
          FROM orders
          WHERE status != 'Cancelled'
          GROUP BY DATE(order_date)
          ORDER BY order_day DESC
          LIMIT 30
        `,
      );

      return rows;
    },
  };

  async findAll(query: OrderListQuery): Promise<RowDataPacket[]> {
    const params: Array<string | number> = [];
    const where = this.buildWhereClause(query, params);

    const [rows] = await replicaPool.query<RowDataPacket[]>(
      `
        SELECT
          o.order_id,
          o.customer_id,
          CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
          c.email AS customer_email,
          o.product_id,
          p.name AS product_name,
          o.quantity,
          o.order_date,
          o.status,
          o.total_amount
        FROM orders o
        INNER JOIN customers c ON c.customer_id = o.customer_id
        INNER JOIN products p ON p.product_id = o.product_id
        ${where}
        ORDER BY o.order_date DESC, o.order_id DESC
        LIMIT ? OFFSET ?
      `,
      [...params, query.limit, query.offset],
    );

    return rows;
  }

  async count(query: OrderListQuery): Promise<number> {
    const params: Array<string | number> = [];
    const where = this.buildWhereClause(query, params);

    const [rows] = await replicaPool.query<RowDataPacket[]>(
      `
        SELECT COUNT(*) AS total
        FROM orders o
        ${where}
      `,
      params,
    );

    return Number(rows[0]?.total || 0);
  }

  async findById(orderId: number): Promise<RowDataPacket | null> {
    const [rows] = await replicaPool.query<RowDataPacket[]>(
      `
        SELECT
          o.order_id,
          o.customer_id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.address,
          o.product_id,
          p.name AS product_name,
          p.price AS product_price,
          o.quantity,
          o.order_date,
          o.status,
          o.total_amount
        FROM orders o
        INNER JOIN customers c ON c.customer_id = o.customer_id
        INNER JOIN products p ON p.product_id = o.product_id
        WHERE o.order_id = ?
      `,
      [orderId],
    );

    return rows[0] || null;
  }

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    const connection = await masterPool.getConnection();
    const status: OrderStatus = 'Pending';

    try {
      await connection.beginTransaction();

      const [customers] = await connection.query<RowDataPacket[]>(
        'SELECT customer_id FROM customers WHERE customer_id = ? FOR UPDATE',
        [input.customer_id],
      );

      if (!customers.length) {
        throw new Error('Customer not found');
      }

      const [products] = await connection.query<RowDataPacket[]>(
        `
          SELECT product_id, price, stock_quantity
          FROM products
          WHERE product_id = ?
          FOR UPDATE
        `,
        [input.product_id],
      );

      const product = products[0];

      if (!product) {
        throw new Error('Product not found');
      }

      if (Number(product.stock_quantity) < input.quantity) {
        throw new Error('Not enough product stock');
      }

      const totalAmount =
        input.total_amount ?? Number(product.price) * input.quantity;

      const [result] = await connection.execute<ResultSetHeader>(
        `
          INSERT INTO orders (
            customer_id,
            product_id,
            quantity,
            order_date,
            status,
            total_amount
          )
          VALUES (?, ?, ?, NOW(), ?, ?)
        `,
        [
          input.customer_id,
          input.product_id,
          input.quantity,
          status,
          totalAmount,
        ],
      );

      await connection.execute(
        `
          UPDATE products
          SET stock_quantity = stock_quantity - ?
          WHERE product_id = ?
        `,
        [input.quantity, input.product_id],
      );

      await connection.commit();

      return {
        order_id: result.insertId,
        customer_id: input.customer_id,
        product_id: input.product_id,
        quantity: input.quantity,
        status,
        total_amount: totalAmount,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateStatus(orderId: number, status: OrderStatus): Promise<boolean> {
    const [result] = await masterPool.execute<ResultSetHeader>(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, orderId],
    );

    return result.affectedRows > 0;
  }

  private buildWhereClause(
    query: OrderListQuery,
    params: Array<string | number>,
  ): string {
    const filters: string[] = [];

    if (query.status) {
      filters.push('o.status = ?');
      params.push(query.status);
    }

    if (Number.isFinite(query.customerId)) {
      filters.push('o.customer_id = ?');
      params.push(Number(query.customerId));
    }

    if (Number.isFinite(query.productId)) {
      filters.push('o.product_id = ?');
      params.push(Number(query.productId));
    }

    if (query.fromDate) {
      filters.push('o.order_date >= ?');
      params.push(query.fromDate);
    }

    if (query.toDate) {
      filters.push('o.order_date <= ?');
      params.push(query.toDate);
    }

    return filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  }
}
