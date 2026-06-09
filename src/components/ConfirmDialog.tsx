import { AlertTriangle, CheckCircle2, Info, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger: {
    iconBg: 'bg-rose-100 text-rose-600',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700',
    icon: Trash2,
  },
  warning: {
    iconBg: 'bg-amber-100 text-amber-600',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700',
    icon: AlertTriangle,
  },
  info: {
    iconBg: 'bg-sky-100 text-sky-600',
    confirmBtn: 'bg-sky-600 hover:bg-sky-700',
    icon: Info,
  },
  success: {
    iconBg: 'bg-emerald-100 text-emerald-600',
    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700',
    icon: CheckCircle2,
  },
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'popIn 0.2s ease-out' }}
      >
        <div className="p-6 flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-5 py-2 text-sm font-semibold text-white ${cfg.confirmBtn} rounded-lg shadow-sm transition`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
