export type OrderStatus =
  | 'Pending'
  | 'Payment Received'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface CreateCustomerInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
}

export interface Product {
  product_id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  created_at: string;
}

export interface CreateProductInput {
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
}

export interface Order {
  order_id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  product_id: number;
  product_name: string;
  quantity: number;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
}

export interface SummaryMetrics {
  total_customers: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  low_stock_products: number;
}

export interface DailyRevenue {
  order_day: string;
  order_count: number;
  revenue: number;
}

export interface OrdersByStatus {
  status: OrderStatus;
  total_orders: number;
}

export interface TopCustomerByOrders {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  order_count: number;
}

export interface TopCustomerBySpending {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  total_spending: number;
}

export interface TopProductByQuantity {
  product_id: number;
  name: string;
  quantity_sold: number;
}

export interface TopProductByRevenue {
  product_id: number;
  name: string;
  revenue: number;
}
