import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import { api, currencyFormatter, formatDateTime, getErrorMessage } from '../lib/api';
import { ApiResponse, Order, OrderStatus, PaginatedResult } from '../types/api';

interface OrdersProps {
  notify: (type: 'success' | 'error', message: string) => void;
}

const statusTabs: Array<'All' | OrderStatus> = [
  'All',
  'Pending',
  'Processing',
  'Delivered',
  'Cancelled',
];

const statusOptions: OrderStatus[] = [
  'Pending',
  'Payment Received',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  Pending: 'Payment Received',
  'Payment Received': 'Processing',
  Processing: 'Shipped',
  Shipped: 'Delivered',
};

export function Orders({ notify }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeStatus, setActiveStatus] = useState<'All' | OrderStatus>('All');
  const [loading, setLoading] = useState(false);

  const params = useMemo(
    () => ({
      page,
      limit: 20,
      status: activeStatus === 'All' ? undefined : activeStatus,
    }),
    [activeStatus, page],
  );

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<ApiResponse<PaginatedResult<Order>>>(
        '/api/orders',
        { params },
      );
      setOrders(response.data.data.items);
      setTotal(response.data.data.total);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      notify('error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [notify, params]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const updateStatus = async (orderId: number, status: OrderStatus) => {
    try {
      await api.patch(`/api/orders/${orderId}/status`, { status });
      notify('success', 'Order status updated successfully');
      await loadOrders();
    } catch (error) {
      notify('error', getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Order Operations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor order lifecycle and update operational status.
          </p>
        </div>
        <Button onClick={() => void loadOrders()}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="inline-flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
            {statusTabs.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setPage(1);
                  setActiveStatus(status);
                }}
                className={`h-9 rounded-lg px-4 text-sm font-medium transition ${
                  activeStatus === status
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Order</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Customer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Product</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {orders.map((order) => {
                const canAdvance =
                  order.status !== 'Delivered' && order.status !== 'Cancelled';
                const suggestedStatus = nextStatus[order.status];

                return (
                  <tr key={order.order_id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-800">#{order.order_id}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(order.order_date)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-slate-700">{order.customer_name}</p>
                      <p className="text-xs text-slate-500">{order.customer_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-xs truncate text-sm text-slate-700">
                        {order.product_name}
                      </p>
                      <p className="text-xs text-slate-500">Quantity {order.quantity}</p>
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-800">
                      {currencyFormatter.format(Number(order.total_amount))}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4">
                      {canAdvance ? (
                        <div className="flex justify-end gap-2">
                          {suggestedStatus ? (
                            <Button
                              onClick={() =>
                                void updateStatus(order.order_id, suggestedStatus)
                              }
                            >
                              Advance to {suggestedStatus}
                            </Button>
                          ) : null}
                          <select
                            value=""
                            aria-label="Change order status"
                            onChange={(event) => {
                              const value = event.target.value as OrderStatus;
                              if (value) {
                                void updateStatus(order.order_id, value);
                              }
                            }}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                          >
                            <option value="">Set status</option>
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="text-right text-sm text-slate-400">Closed</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 ? (
          <div className="p-5">
            <EmptyState>No orders found</EmptyState>
          </div>
        ) : null}

        <Pagination page={page} total={total} totalPages={totalPages} onPageChange={setPage} />
      </section>
    </div>
  );
}
