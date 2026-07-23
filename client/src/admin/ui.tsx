import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

export const cn = (...c: (string | undefined | false | null)[]) => twMerge(clsx(c));

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle';
  size?: 'sm' | 'md';
  loading?: boolean;
}) {
  const variants = {
    primary: 'bg-accent text-on-accent hover:opacity-90 shadow-sm',
    ghost: 'border border-line bg-surface text-ink hover:bg-surface-2',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    subtle: 'text-muted hover:text-ink hover:bg-surface-2',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm' };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[12px] font-semibold transition disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20',
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, hint, error, children }: { label?: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-semibold text-ink">{label}</span>}
      {children}
      {hint && !error && <span className="block text-xs text-muted">{hint}</span>}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-[18px] border border-line bg-surface p-5 shadow-sm', className)}>{children}</div>;
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      // Without a visible label the control is just a coloured pill, so give
      // assistive tech something to announce.
      aria-label={label ? undefined : 'Показывать на сайте'}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-sm font-medium text-ink"
    >
      <span
        className={cn(
          'relative h-6 w-10 rounded-full transition',
          checked ? 'bg-accent' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </span>
      {label}
    </button>
  );
}

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'accent' | 'amber' | 'red' }) {
  const tones = {
    muted: 'bg-surface-2 text-muted',
    accent: 'bg-accent-soft text-accent',
    amber: 'bg-amber/15 text-amber',
    red: 'bg-red-500/10 text-red-600',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone])}>{children}</span>;
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-20 text-muted">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
