import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const config = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-900/80', border: 'border-emerald-200 dark:border-emerald-700', iconColor: 'text-emerald-600 dark:text-emerald-400', title: 'text-emerald-800 dark:text-emerald-200' },
  error:   { icon: XCircle,      bg: 'bg-rose-50 dark:bg-rose-900/80',       border: 'border-rose-200 dark:border-rose-700',       iconColor: 'text-rose-600 dark:text-rose-400',       title: 'text-rose-800 dark:text-rose-200'       },
  info:    { icon: Info,         bg: 'bg-sky-50 dark:bg-sky-900/80',         border: 'border-sky-200 dark:border-sky-700',         iconColor: 'text-sky-600 dark:text-sky-400',         title: 'text-sky-800 dark:text-sky-200'         },
  warning: { icon: AlertTriangle,bg: 'bg-amber-50 dark:bg-amber-900/80',     border: 'border-amber-200 dark:border-amber-700',     iconColor: 'text-amber-600 dark:text-amber-400',     title: 'text-amber-800 dark:text-amber-200'     },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const cfg = config[toast.type];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className={`${cfg.bg} ${cfg.border} border rounded-xl p-4 shadow-lg dark:shadow-black/40 flex items-start gap-3 animate-in slide-in-from-right pointer-events-auto backdrop-blur-sm`}
            style={{ animation: 'slideInRight 0.3s ease-out' }}
          >
            <Icon className={`w-5 h-5 ${cfg.iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${cfg.title}`}>{toast.title}</p>
              {toast.message && <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
