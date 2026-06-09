import type { ReactNode } from 'react';
import { FileSearch, AlertCircle, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: { label: string; onClick: () => void };
  variant?: 'empty' | 'search' | 'error';
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  variant = 'empty',
}: EmptyStateProps) {
  const defaultIcon =
    variant === 'search' ? <FileSearch className="w-14 h-14 text-slate-300" />
    : variant === 'error' ? <AlertCircle className="w-14 h-14 text-rose-300" />
    : <PlusCircle className="w-14 h-14 text-slate-300" />;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="mb-4 opacity-80">{icon || defaultIcon}</div>
      <h3 className="text-base font-bold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
