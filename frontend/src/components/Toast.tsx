import { CheckCircle2, XCircle } from 'lucide-react';

export interface ToastState {
  type: 'success' | 'error';
  message: string;
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) {
    return null;
  }

  const isSuccess = toast.type === 'success';

  return (
    <div className="fixed right-6 top-6 z-50 flex min-w-80 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xl">
      {isSuccess ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      ) : (
        <XCircle className="h-5 w-5 text-rose-600" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}
