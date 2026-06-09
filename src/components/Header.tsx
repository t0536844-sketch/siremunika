import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  RefreshCw,
  Download,
  Calendar,
  Command,
  HelpCircle,
  ChevronRight,
  Home,
  Copy,
  Check,
  Sparkles,
  Clock,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import GlobalSearch from './GlobalSearch';
import HelpPanel from './HelpPanel';

const pageBreadcrumbs: Record<string, string[]> = {
  dashboard: ['Home', 'Dashboard'],
  pendapatan: ['Home', 'Transaksi', 'Pendapatan'],
  jasa: ['Home', 'Transaksi', 'Jasa Medis'],
  indexing: ['Home', 'Transaksi', 'Indexing'],
  kalkulasi: ['Home', 'Proses', 'Kalkulator'],
  hasil: ['Home', 'Proses', 'Hasil Kalkulasi'],
  approval: ['Home', 'Proses', 'Persetujuan'],
  pembayaran: ['Home', 'Proses', 'Output Pembayaran'],
  nakes: ['Home', 'Master Data', 'Profil Nakes'],
  users: ['Home', 'Master Data', 'Manajemen User'],
  laporan: ['Home', 'Laporan', 'Pusat Laporan'],
  activity: ['Home', 'Laporan', 'Activity Log'],
};

interface HeaderProps {
  title: string;
  subtitle?: string;
  showActions?: boolean;
  onExport?: () => void;
}

export default function Header({ title, subtitle, showActions = true, onExport }: HeaderProps) {
  const { unreadCount, setShowNotifications, triggerRefresh, showToast, activePage, settings, isDark, toggleTheme } = useApp();
  const { session } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const breadcrumbs = pageBreadcrumbs[activePage] || ['Home', title];
  const currentYear = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'F1') {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleRefresh = () => {
    triggerRefresh();
    showToast('success', 'Data direfresh', 'Halaman telah diperbarui');
  };

  const handleCopyInfo = async () => {
    const info = `${settings.namaRS} - ${title} (${currentYear})`;
    await navigator.clipboard.writeText(info);
    setCopied(true);
    showToast('success', 'Disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 print:hidden flex-shrink-0 z-30">
        {/* Top info bar */}
        <div className="bg-gradient-to-r from-slate-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-1.5 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span className="hidden md:inline">
              <Calendar className="w-3 h-3 inline mr-1" />
              {currentYear}
            </span>
            <span className="hidden md:inline">
              <Clock className="w-3 h-3 inline mr-1" />
              {currentTime} WITA
            </span>
            <span>
              <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
              Periode: {settings.periode}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {session && (
              <span className="hidden sm:inline text-teal-700 font-semibold">
                {session.user.nama.split(',')[0]} · {session.role.nama}
              </span>
            )}
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full pulse-ring" />
              <span className="text-slate-500">v1.0.0</span>
            </span>
            <button
              onClick={handleCopyInfo}
              className="hidden md:inline-flex items-center gap-1 hover:text-teal-700 transition"
              title="Salin informasi"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Main header */}
        <div className="px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 overflow-hidden">
                {breadcrumbs.map((crumb, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 flex-shrink-0">
                    {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                    {idx === 0 ? (
                      <Home className="w-3 h-3 text-slate-400" />
                    ) : (
                      <span
                        className={`truncate ${
                          idx === breadcrumbs.length - 1 ? 'font-semibold text-teal-700' : ''
                        }`}
                      >
                        {crumb}
                      </span>
                    )}
                  </div>
                ))}
              </nav>

              <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>

            {showActions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Global Search Button */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="hidden md:flex items-center gap-2 pl-3 pr-2 py-2 text-sm bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-teal-300 rounded-xl text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 transition w-72 group"
                >
                  <Search className="w-4 h-4 group-hover:text-teal-600" />
                  <span className="flex-1 text-left">Cari data, menu, transaksi...</span>
                  <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono text-slate-400">
                    <Command className="w-2.5 h-2.5" />K
                  </kbd>
                </button>

                {/* Mobile search */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="md:hidden p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl transition"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Help */}
                <button
                  onClick={() => setHelpOpen(true)}
                  className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-sky-900/40 hover:text-sky-700 dark:hover:text-sky-400 text-slate-700 dark:text-slate-300 rounded-xl transition"
                  title="Bantuan (F1)"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>

                {/* Dark Mode Toggle */}
                <button
                  onClick={() => {
                    toggleTheme();
                    showToast('info',
                      isDark ? '☀️ Mode Terang Aktif' : '🌙 Mode Gelap Aktif',
                      isDark ? 'Tampilan beralih ke mode terang' : 'Tampilan beralih ke mode gelap'
                    );
                  }}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:text-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600'
                  }`}
                  title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Refresh */}
                <button
                  onClick={handleRefresh}
                  className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-400 text-slate-700 dark:text-slate-300 rounded-xl transition"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Export */}
                {onExport && (
                  <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition shadow-sm hover:shadow"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                )}

                {/* Notifications */}
                <button
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 bg-slate-100 dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 text-slate-700 dark:text-slate-300 rounded-xl transition"
                  title="Notifikasi"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
