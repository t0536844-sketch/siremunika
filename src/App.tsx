import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import InputPendapatan from './pages/InputPendapatan';
import InputJasa from './pages/InputJasa';
import Indexing from './pages/Indexing';
import Kalkulator from './pages/Kalkulator';
import Hasil from './pages/Hasil';
import Approval from './pages/Approval';
import ProfilNakes from './pages/ProfilNakes';
import Laporan from './pages/Laporan';
import ActivityLog from './pages/ActivityLog';
import OutputPembayaran from './pages/OutputPembayaran';
import ManajemenUser from './pages/ManajemenUser';
import NetworkDatabase from './pages/NetworkDatabase';
import LoginPage from './pages/LoginPage';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ToastContainer from './components/Toast';
import NotificationPanel from './components/NotificationPanel';
import SettingsPanel from './components/SettingsPanel';

// ─── Mapping judul halaman ──────────────────────────────────────
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard:  { title: 'Dashboard',                  subtitle: 'Ringkasan kinerja dan remunerasi RSUD Mimika' },
  pendapatan: { title: 'Input Pendapatan',            subtitle: 'Kelola data pendapatan per unit layanan' },
  jasa:       { title: 'Input Jasa Medis',            subtitle: 'Catat jasa medis per tenaga kesehatan' },
  indexing:   { title: 'Indexing & Bobot',            subtitle: 'Master data bobot dan skala remunerasi' },
  kalkulasi:  { title: 'Kalkulator Remunerasi',      subtitle: 'Simulasi perhitungan distribusi jasa' },
  hasil:      { title: 'Hasil Kalkulasi',             subtitle: 'Laporan hasil perhitungan per periode' },
  approval:   { title: 'Persetujuan',                 subtitle: 'Manajemen approval alur remunerasi' },
  pembayaran: { title: 'Output Pembayaran',           subtitle: 'Finalisasi dan pencairan remunerasi tenaga kesehatan' },
  nakes:      { title: 'Profil Tenaga Kesehatan',    subtitle: 'Master data profil dan kualifikasi Nakes' },
  users:      { title: 'Manajemen User & RBAC',      subtitle: 'Kelola pengguna, role, dan hak akses sistem' },
  laporan:    { title: 'Pusat Laporan',               subtitle: 'Generate laporan keuangan, SDM, dan analitik' },
  activity:   { title: 'Activity Log',                subtitle: 'Riwayat aktivitas pengguna sistem' },
  networkdb:  { title: 'Network Database',           subtitle: 'Kelola sinkronisasi data dengan SQL Server' },
};

// ─── Halaman utama (setelah login) ────────────────────────────
function AppContent() {
  const { activePage, showToast, setActivePage } = useApp();
  const { session, isAuthenticated, logout } = useAuth();

  // Guard: redirect ke dashboard kalau halaman tidak dikenali
  useEffect(() => {
    if (isAuthenticated && !pageTitles[activePage]) setActivePage('dashboard');
  }, [activePage, isAuthenticated, setActivePage]);

  // Auto-logout ketika sesi expired (cek tiap 60 detik)
  useEffect(() => {
    if (!session) return;
    const check = () => {
      if (new Date() > new Date(session.expiresAt)) {
        showToast('warning', 'Sesi berakhir', 'Anda telah otomatis keluar dari sistem');
        logout('session_expired');
      }
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [session, logout, showToast]);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':  return <Dashboard />;
      case 'pendapatan': return <InputPendapatan />;
      case 'jasa':       return <InputJasa />;
      case 'indexing':   return <Indexing />;
      case 'kalkulasi':  return <Kalkulator />;
      case 'hasil':      return <Hasil />;
      case 'approval':   return <Approval />;
      case 'pembayaran': return <OutputPembayaran />;
      case 'nakes':      return <ProfilNakes />;
      case 'users':      return <ManajemenUser />;
      case 'laporan':    return <Laporan />;
      case 'activity':   return <ActivityLog />;
      case 'networkdb':  return <NetworkDatabase />;
      default:           return <Dashboard />;
    }
  };

  const pageInfo = pageTitles[activePage] || pageTitles.dashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Sidebar: h-screen sticky — tidak ikut scroll */}
      <Sidebar />

      {/* Kolom kanan: Header fixed top + main scroll + footer fixed bottom */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header: sticky, tidak ikut scroll */}
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />

        {/* Main: satu-satunya area yang scroll */}
        <main className="flex-1 overflow-y-auto print:overflow-visible bg-slate-50 dark:bg-slate-950" id="main-content">
          {renderPage()}
        </main>

        {/* Footer: fixed di bawah, tidak ikut scroll */}
        <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-8 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between print:hidden flex-shrink-0">
          <span>© 2026 RSUD Mimika — Sistem Informasi Remunerasi v1.0.0</span>
          {session && (
            <span className="hidden md:inline">
              Login sebagai <b>{session.user.nama.split(',')[0]}</b> · Role: <b>{session.role.nama}</b>
            </span>
          )}
        </footer>
      </div>

      {/* Global overlays */}
      <ToastContainer />
      <NotificationPanel />
      <SettingsPanel />
    </div>
  );
}

// ─── Router: Login ↔ App ──────────────────────────────────────
function AuthGate() {
  const { isAuthenticated, isLoading, session } = useAuth();
  const { showToast, setActivePage } = useApp();

  // Toast selamat datang setelah login berhasil
  useEffect(() => {
    if (isAuthenticated && session) {
      showToast(
        'success',
        `Selamat datang, ${session.user.nama.split(',')[0]}! 👋`,
        `Login sebagai ${session.role.nama}`
      );
      setActivePage('dashboard');
    }
  // Hanya saat pertama mount setelah login (track via session.loginAt)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.loginAt]);

  // Loading: restore session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-800 to-teal-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold">Memuat sesi…</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AppContent /> : <LoginPage />;
}

// ─── Root ──────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AuthGate />
      </AppProvider>
    </AuthProvider>
  );
}
