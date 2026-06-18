import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700',
  secondary:
    'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300',
  danger:
    'border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300',
  ghost:
    'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
};

export function Button({
  variant = 'secondary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-sm transition disabled:opacity-50 ${variantClassNames[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
