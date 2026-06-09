import { Bell, CheckCircle2, XCircle, Info, AlertTriangle, CheckCheck, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const typeConfig = {
  success: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  error: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
  info: { icon: Info, color: 'text-sky-600', bg: 'bg-sky-100' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
};

export default function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    showNotifications,
    setShowNotifications,
  } = useApp();

  if (!showNotifications) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setShowNotifications(false)}
      />
      {/* Panel */}
      <div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-black/50 border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm">Notifikasi</h3>
              <p className="text-[10px] text-teal-100">
                {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Semua sudah dibaca'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNotifications(false)}
            className="text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1 text-xs text-teal-700 dark:text-teal-400 hover:text-teal-900 font-medium disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tandai semua dibaca
            </button>
            <button
              onClick={clearNotifications}
              className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus semua
            </button>
          </div>
        )}

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-500">Tidak ada notifikasi</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const cfg = typeConfig[notif.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition flex items-start gap-3 ${
                    !notif.read ? 'bg-teal-50/30 dark:bg-teal-900/20' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notif.read ? 'font-bold text-slate-800' : 'font-medium text-slate-700'} truncate`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-600 text-center">
          <button className="text-xs text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 font-semibold">
            Lihat Semua Notifikasi →
          </button>
        </div>
      </div>
    </>
  );
}
