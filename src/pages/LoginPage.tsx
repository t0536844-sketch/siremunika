import { useState, useEffect, useRef } from 'react';
import {
  Eye, EyeOff, LogIn, Shield, AlertCircle, Building2,
  Lock, User, ChevronRight, Info, Loader2, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Demo accounts untuk quick-login ────────────────────────────
const demoAccounts = [
  { username: 'superadmin',        password: 'Admin@2026!',     role: 'Super Administrator', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { username: 'direktur.hendra',   password: 'Direktur@2026!',  role: 'Direktur RSUD',       color: 'bg-teal-100 text-teal-700 border-teal-200' },
  { username: 'kabag.keuangan',    password: 'Keuangan@2026!',  role: 'Kepala Keuangan',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { username: 'admin.keuangan1',   password: 'Keuangan@2026!',  role: 'Admin Keuangan',      color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { username: 'kabag.poli_dalam',  password: 'Unit@2026!',      role: 'Kepala Unit',         color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { username: 'operator.lab',      password: 'Operator@2026!',  role: 'Operator Unit',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { username: 'verifikator.1',     password: 'Verif@2026!',     role: 'Verifikator',         color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { username: 'viewer.audit',      password: 'Viewer@2026!',    role: 'Viewer',              color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

// ── Animasi background orbs ─────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl" />
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();

  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [attempts, setAttempts]   = useState(0);
  const [showDemo, setShowDemo]   = useState(false);
  const [shake, setShake]         = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { usernameRef.current?.focus(); }, []);

  // Animasi shake saat error
  useEffect(() => {
    if (shake) { const t = setTimeout(() => setShake(false), 500); return () => clearTimeout(t); }
  }, [shake]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi.');
      setShake(true);
      return;
    }
    setLoading(true);
    setError('');

    const result = await login(username.trim(), password);

    if (result.ok) {
      setSuccess(true);
      // AppContent akan re-render otomatis karena isAuthenticated berubah
    } else {
      setAttempts((a) => a + 1);
      setError(result.error);
      setShake(true);
      setPassword('');
    }
    setLoading(false);
  };

  const fillDemo = (acc: typeof demoAccounts[0]) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
    setShowDemo(false);
    usernameRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-800 flex items-center justify-center p-4 relative">
      <BackgroundOrbs />

      {/* Card wrapper */}
      <div className="w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-2xl relative z-10">

        {/* ── Panel Kiri: Branding ── */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-b from-teal-900/80 to-teal-800/80 backdrop-blur-xl w-[420px] flex-shrink-0 p-10 border-r border-white/10">
          {/* Logo & nama */}
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                <Building2 className="w-8 h-8 text-teal-700" />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl leading-tight">RSUD Mimika</h1>
                <p className="text-teal-200 text-xs">Kabupaten Mimika, Papua Tengah</p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-white text-3xl font-bold leading-tight mb-3">
                Sistem Informasi Manajemen Remunerasi
              </h2>
              <p className="text-teal-200 text-sm leading-relaxed">
                Platform terintegrasi untuk pengelolaan pendapatan, distribusi jasa medis,
                dan pembayaran remunerasi tenaga kesehatan secara transparan dan akuntabel.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                'Input & validasi pendapatan unit layanan',
                'Kalkulasi jasa medis berbasis indexing',
                'Workflow approval multi-level',
                'Output pembayaran & slip gaji digital',
                'Laporan keuangan & audit trail',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-teal-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-3 h-3 text-teal-300" />
                  </div>
                  <p className="text-teal-100 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer info */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <Shield className="w-4 h-4 text-teal-300 flex-shrink-0" />
              <p className="text-xs text-teal-200">
                Dilindungi dengan enkripsi end-to-end dan RBAC (Role-Based Access Control)
              </p>
            </div>
            <p className="text-[10px] text-teal-400 mt-4 text-center">
              © 2026 Bidang Keuangan & IT RSUD Mimika · v1.0.0
            </p>
          </div>
        </div>

        {/* ── Panel Kanan: Form Login ── */}
        <div className="flex-1 bg-white flex flex-col">
          {/* Header mobile */}
          <div className="lg:hidden bg-gradient-to-r from-teal-700 to-teal-800 text-white px-8 py-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h1 className="font-bold">SIM Remunerasi</h1>
              <p className="text-[10px] text-teal-100">RSUD Mimika</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center px-8 lg:px-12 py-10 max-w-md mx-auto w-full">
            {/* Judul form */}
            <div className="mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Selamat Datang</h2>
              <p className="text-sm text-slate-500">
                Masuk dengan akun yang telah diberikan oleh Administrator sistem.
              </p>
            </div>

            {/* Success state */}
            {success && (
              <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Login berhasil!</p>
                  <p className="text-xs text-emerald-600">Anda akan diarahkan ke dashboard…</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !success && (
              <div className={`mb-5 flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3.5 ${shake ? 'animate-shake' : ''}`}>
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-rose-700">{error}</p>
                  {attempts >= 3 && (
                    <p className="text-xs text-rose-500 mt-1">
                      Terlalu banyak percobaan. Gunakan tombol demo di bawah atau hubungi Administrator.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    ref={usernameRef}
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    placeholder="Masukkan username Anda"
                    disabled={loading || success}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full pl-11 pr-4 py-3.5 text-sm bg-slate-50 border-2 border-slate-200 rounded-2xl
                      focus:outline-none focus:border-teal-500 focus:bg-white transition-all
                      disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Masukkan password Anda"
                    disabled={loading || success}
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3.5 text-sm bg-slate-50 border-2 border-slate-200 rounded-2xl
                      focus:outline-none focus:border-teal-500 focus:bg-white transition-all
                      disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    disabled={loading || success}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-teal-600 to-teal-700
                  hover:from-teal-700 hover:to-teal-800 text-white font-bold rounded-2xl shadow-lg
                  hover:shadow-teal-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed
                  active:scale-[0.98] mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memverifikasi…</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Masuk…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Masuk ke Sistem</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-2 border-slate-200 hover:border-teal-300 hover:bg-teal-50 rounded-2xl transition text-sm font-semibold text-slate-700 group"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-600" />
                  Demo Account — Klik untuk lihat
                </span>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showDemo ? 'rotate-90' : ''}`} />
              </button>

              {showDemo && (
                <div className="mt-3 grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-0.5">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.username}
                      onClick={() => fillDemo(acc)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50/60 rounded-xl text-left transition group"
                    >
                      <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${acc.color}`}>
                        {acc.role.split(' ').map((w) => w[0]).join('').slice(0, 3)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800">@{acc.username}</p>
                        <p className="text-[10px] text-slate-500 truncate">{acc.role}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer form */}
          <div className="px-8 lg:px-12 pb-6">
            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-[10px] text-slate-400">
                Lupa password? Hubungi Administrator — 
                <a href="mailto:support@rsudmimika.go.id" className="text-teal-600 hover:underline ml-1">
                  support@rsudmimika.go.id
                </a>
              </p>
              <p className="text-[9px] text-slate-300 mt-2">
                © 2026 RSUD Mimika · SIM Remunerasi v1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-out; }
      `}</style>
    </div>
  );
}
