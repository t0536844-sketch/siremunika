import { useState } from 'react';
import { LogOut, X, AlertTriangle, Clock, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function LogoutDialog({ open, onClose }: LogoutDialogProps) {
  const { logout, session } = useAuth();
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  if (!open) return null;

  const handleLogout = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // animasi singkat
    setSuccess(true);
    await new Promise((r) => setTimeout(r, 700));
    logout('user_initiated');
    onClose();
  };

  // Hitung durasi sesi
  const sessionDuration = session
    ? (() => {
        const ms = Date.now() - new Date(session.loginAt).getTime();
        const m  = Math.floor(ms / 60_000);
        const h  = Math.floor(m / 60);
        return h > 0 ? `${h} jam ${m % 60} menit` : `${m} menit`;
      })()
    : '-';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: 'popIn 0.2s ease-out' }}>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 p-6 text-white overflow-hidden">
          <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                {success ? <CheckCircle2 className="w-6 h-6" /> : <LogOut className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-bold">{success ? 'Keluar…' : 'Keluar dari Sistem?'}</h3>
                <p className="text-rose-100 text-xs">{success ? 'Menghapus sesi…' : 'Sesi aktif akan diakhiri'}</p>
              </div>
            </div>
            {!loading && (
              <button onClick={onClose} className="text-white/70 hover:text-white p-1 transition">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Info sesi */}
          {session && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-1">Pengguna</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {session.user.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate leading-tight">{session.user.nama.split(',')[0]}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">@{session.user.username}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mb-2">Role</p>
                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold ${session.role.warnaBg} ${session.role.warnaText} ${session.role.warnaBorder}`}>
                  <Shield className="w-3 h-3" />
                  {session.role.nama}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Durasi sesi: <b>{sessionDuration}</b>
              {session && ` · Login pukul ${new Date(session.loginAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>

          <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-800">
              Pastikan semua perubahan sudah disimpan sebelum keluar. Data yang belum disimpan akan hilang.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleLogout}
            disabled={loading || success}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 rounded-2xl shadow-sm transition disabled:opacity-70 active:scale-[0.98]"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Keluar…</>
            ) : success ? (
              <><CheckCircle2 className="w-4 h-4" />Selamat tinggal!</>
            ) : (
              <><LogOut className="w-4 h-4" />Ya, Keluar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
