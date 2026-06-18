import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Database,
  ExternalLink,
  Users,
} from 'lucide-react';
import { Toast, ToastState } from './components/Toast';
import { Customers } from './pages/Customers';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Products } from './pages/Products';

type ViewKey = 'dashboard' | 'products' | 'customers' | 'orders';

interface NavigationItem {
  key: ViewKey;
  label: string;
  description: string;
  icon: typeof BarChart3;
}

const navigationItems: NavigationItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'BI analytics',
    icon: BarChart3,
  },
  {
    key: 'products',
    label: 'Products',
    description: 'Catalog testing',
    icon: Boxes,
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'CRM records',
    icon: Users,
  },
  {
    key: 'orders',
    label: 'Orders',
    description: 'Lifecycle ops',
    icon: ClipboardList,
  },
];

export default function App() {
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const [toast, setToast] = useState<ToastState | null>(null);

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activeItem = useMemo(
    () => navigationItems.find((item) => item.key === activeView) || navigationItems[0],
    [activeView],
  );

  const content = {
    dashboard: <Dashboard notify={notify} />,
    products: <Products notify={notify} />,
    customers: <Customers notify={notify} />,
    orders: <Orders notify={notify} />,
  }[activeView];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">ShopDB Portal</p>
              <p className="text-xs text-slate-500">Admin & BI Dashboard</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeView;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="block truncate text-xs opacity-75">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <a
              href="http://localhost:5000/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Swagger Docs
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Current Workspace
              </p>
              <h1 className="text-lg font-semibold text-slate-800">{activeItem.label}</h1>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-500 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              API Base: http://localhost:5000
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-3 lg:hidden">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeView;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveView(item.key)}
                  className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{content}</main>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
