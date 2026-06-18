import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Gauge,
  Package,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { api, currencyFormatter, getErrorMessage, numberFormatter } from '../lib/api';
import {
  ApiResponse,
  DailyRevenue,
  OrdersByStatus,
  SummaryMetrics,
  TopCustomerByOrders,
  TopCustomerBySpending,
  TopProductByQuantity,
  TopProductByRevenue,
} from '../types/api';

interface DashboardProps {
  notify: (type: 'success' | 'error', message: string) => void;
}

const chartColors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];

export function Dashboard({ notify }: DashboardProps) {
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus[]>([]);
  const [topOrders, setTopOrders] = useState<TopCustomerByOrders[]>([]);
  const [topSpending, setTopSpending] = useState<TopCustomerBySpending[]>([]);
  const [topSoldProducts, setTopSoldProducts] = useState<TopProductByQuantity[]>([]);
  const [topRevenue, setTopRevenue] = useState<TopProductByRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [
        summaryResponse,
        dailyRevenueResponse,
        ordersByStatusResponse,
        topOrdersResponse,
        topSpendingResponse,
        topSoldProductsResponse,
        topRevenueResponse,
      ] = await Promise.all([
        api.get<ApiResponse<SummaryMetrics>>('/api/analytics/summary'),
        api.get<ApiResponse<DailyRevenue[]>>('/api/analytics/daily-revenue'),
        api.get<ApiResponse<OrdersByStatus[]>>('/api/analytics/orders-by-status'),
        api.get<ApiResponse<TopCustomerByOrders[]>>('/api/analytics/top-orders'),
        api.get<ApiResponse<TopCustomerBySpending[]>>('/api/analytics/top-spending'),
        api.get<ApiResponse<TopProductByQuantity[]>>('/api/analytics/top-sold-products'),
        api.get<ApiResponse<TopProductByRevenue[]>>('/api/analytics/top-revenue'),
      ]);

      setSummary(summaryResponse.data.data);
      setDailyRevenue([...dailyRevenueResponse.data.data].reverse());
      setOrdersByStatus(ordersByStatusResponse.data.data);
      setTopOrders(topOrdersResponse.data.data);
      setTopSpending(topSpendingResponse.data.data);
      setTopSoldProducts(topSoldProductsResponse.data.data);
      setTopRevenue(topRevenueResponse.data.data);
    } catch (error) {
      notify('error', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const cards = [
    {
      label: 'Total Revenue',
      value: currencyFormatter.format(Number(summary?.total_revenue || 0)),
      caption: 'Non-cancelled orders',
      icon: DollarSign,
    },
    {
      label: 'Total Orders',
      value: numberFormatter.format(Number(summary?.total_orders || 0)),
      caption: 'All imported orders',
      icon: ShoppingCart,
    },
    {
      label: 'Active Customers',
      value: numberFormatter.format(Number(summary?.total_customers || 0)),
      caption: 'CRM records',
      icon: Users,
    },
    {
      label: 'Active Products',
      value: numberFormatter.format(Number(summary?.total_products || 0)),
      caption: 'Catalog SKUs',
      icon: Package,
    },
  ];

  const totalStatusOrders = ordersByStatus.reduce(
    (sum, item) => sum + Number(item.total_orders || 0),
    0,
  );

  const statusRadialData = ordersByStatus.map((item, index) => ({
    ...item,
    fill: chartColors[index % chartColors.length],
    percentage: totalStatusOrders
      ? Math.round((Number(item.total_orders) / totalStatusOrders) * 100)
      : 0,
  }));

  const enhancedDailyRevenue = dailyRevenue.map((item, index) => {
    const trailingWindow = dailyRevenue.slice(Math.max(index - 6, 0), index + 1);
    const averageRevenue =
      trailingWindow.reduce((sum, row) => sum + Number(row.revenue || 0), 0) /
      trailingWindow.length;
    const revenuePerOrder =
      Number(item.order_count) > 0 ? Number(item.revenue) / Number(item.order_count) : 0;

    return {
      ...item,
      averageRevenue: Math.round(averageRevenue * 100) / 100,
      revenuePerOrder: Math.round(revenuePerOrder * 100) / 100,
    };
  });

  const cumulativeRevenue = dailyRevenue.reduce<Array<DailyRevenue & { cumulative: number }>>(
    (rows, item) => {
      const previous = rows[rows.length - 1]?.cumulative || 0;
      rows.push({
        ...item,
        cumulative: Math.round((previous + Number(item.revenue || 0)) * 100) / 100,
      });
      return rows;
    },
    [],
  );

  const topProductRevenueChart = topRevenue.map((product) => ({
    name: product.name.length > 18 ? `${product.name.slice(0, 18)}...` : product.name,
    revenue: Number(product.revenue || 0),
  }));

  const topProductQuantityChart = topSoldProducts.map((product) => ({
    name: product.name.length > 18 ? `${product.name.slice(0, 18)}...` : product.name,
    quantity_sold: Number(product.quantity_sold || 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">BI Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live read traffic from analytics and reporting endpoints.
          </p>
        </div>
        <Button variant="primary" onClick={() => void loadDashboard()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          🔄 Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <section
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{card.label}</span>
                <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-2xl font-semibold text-slate-800">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.caption}</p>
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InsightCard
          label="Average Order Value"
          value={currencyFormatter.format(Number(summary?.average_order_value || 0))}
          icon={Gauge}
          tone="indigo"
        />
        <InsightCard
          label="Low Stock Products"
          value={numberFormatter.format(Number(summary?.low_stock_products || 0))}
          icon={AlertTriangle}
          tone="amber"
        />
        <InsightCard
          label="Data Pulse"
          value={`${numberFormatter.format(dailyRevenue.length)} active days`}
          icon={Sparkles}
          tone="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-800">Daily Revenue Trend</h2>
          </div>
          {dailyRevenue.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enhancedDailyRevenue}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="order_day" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip formatter={(value) => currencyFormatter.format(Number(value))} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="averageRevenue"
                    stroke="#0891b2"
                    strokeWidth={2}
                    dot={false}
                    name="7-day avg"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>No revenue data available</EmptyState>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-slate-800">
            Orders by Status
          </h2>
          {ordersByStatus.length ? (
            <div className="grid min-h-80 grid-cols-1 items-center gap-4 lg:grid-cols-2">
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart
                  data={statusRadialData}
                  innerRadius="28%"
                  outerRadius="95%"
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background
                    dataKey="total_orders"
                    cornerRadius={10}
                    name="Orders"
                  />
                  <Tooltip formatter={(value) => numberFormatter.format(Number(value))} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {statusRadialData.map((item) => (
                  <div key={item.status}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.status}</span>
                      <span className="text-slate-500">
                        {numberFormatter.format(Number(item.total_orders))} · {item.percentage}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(item.percentage, 2)}%`,
                          backgroundColor: item.fill,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>No status distribution available</EmptyState>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-5 text-base font-semibold text-slate-800">
            Revenue and Order Volume
          </h2>
          {enhancedDailyRevenue.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enhancedDailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="order_day" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'Revenue'
                        ? currencyFormatter.format(Number(value))
                        : numberFormatter.format(Number(value))
                    }
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="order_count"
                    name="Orders"
                    fill="#c7d2fe"
                    radius={[6, 6, 0, 0]}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>No order volume data available</EmptyState>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-slate-800">
            Cumulative Revenue Curve
          </h2>
          {cumulativeRevenue.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="order_day" hide />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip formatter={(value) => currencyFormatter.format(Number(value))} />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative revenue"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>No cumulative revenue data available</EmptyState>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-slate-800">
            Top Product Revenue Mix
          </h2>
          {topProductRevenueChart.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductRevenueChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <Tooltip formatter={(value) => currencyFormatter.format(Number(value))} />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 8, 8, 0]}>
                    {topProductRevenueChart.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>No product revenue data available</EmptyState>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-slate-800">
            Best Sellers by Units
          </h2>
          {topProductQuantityChart.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductQuantityChart}
                    dataKey="quantity_sold"
                    nameKey="name"
                    outerRadius={110}
                    innerRadius={62}
                    paddingAngle={3}
                  >
                    {topProductQuantityChart.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => numberFormatter.format(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState>No best seller data available</EmptyState>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Leaderboard
          title="Top 5 Customers by Order Count"
          rows={topOrders}
          getName={(row) => `${row.first_name} ${row.last_name}`}
          getMeta={(row) => row.email}
          getValue={(row) => `${numberFormatter.format(Number(row.order_count))} orders`}
        />
        <Leaderboard
          title="Top 5 Customers by Total Spending"
          rows={topSpending}
          getName={(row) => `${row.first_name} ${row.last_name}`}
          getMeta={(row) => row.email}
          getValue={(row) => currencyFormatter.format(Number(row.total_spending))}
        />
        <Leaderboard
          title="Top 5 Products by Quantity Sold"
          rows={topSoldProducts}
          getName={(row) => row.name}
          getMeta={(row) => `Product #${row.product_id}`}
          getValue={(row) => `${numberFormatter.format(Number(row.quantity_sold))} units`}
        />
        <Leaderboard
          title="Top 5 Products by Revenue Generated"
          rows={topRevenue}
          getName={(row) => row.name}
          getMeta={(row) => `Product #${row.product_id}`}
          getValue={(row) => currencyFormatter.format(Number(row.revenue))}
        />
      </div>
    </div>
  );
}

interface InsightCardProps {
  label: string;
  value: string;
  icon: typeof Gauge;
  tone: 'indigo' | 'amber' | 'emerald';
}

const insightToneClassNames: Record<InsightCardProps['tone'], string> = {
  indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

function InsightCard({ label, value, icon: Icon, tone }: InsightCardProps) {
  return (
    <section className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-xl font-semibold text-slate-800">{value}</p>
      </div>
      <span className={`rounded-xl p-3 ring-1 ${insightToneClassNames[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
    </section>
  );
}

interface LeaderboardProps<T> {
  title: string;
  rows: T[];
  getName: (row: T) => string;
  getMeta: (row: T) => string;
  getValue: (row: T) => string;
}

function Leaderboard<T>({
  title,
  rows,
  getName,
  getMeta,
  getValue,
}: LeaderboardProps<T>) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.length ? (
          rows.map((row, index) => (
            <div key={index} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{getName(row)}</p>
                <p className="truncate text-xs text-slate-500">{getMeta(row)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                {getValue(row)}
              </span>
            </div>
          ))
        ) : (
          <div className="p-5">
            <EmptyState>No ranking data available</EmptyState>
          </div>
        )}
      </div>
    </section>
  );
}
