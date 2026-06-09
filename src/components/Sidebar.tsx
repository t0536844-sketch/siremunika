import { useState } from 'react';
import {
  LayoutDashboard, Wallet, Stethoscope, BarChart3, Calculator,
  ClipboardCheck, Settings, FileBarChart2,
  Building2, LogOut, FileText, Clock, UserCheck, Workflow, Database,
  BookOpen, Banknote, ShieldCheck, Shield, Database as DatabaseIcon, RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import LogoutDialog from './LogoutDialog';

interface MenuItem { id: string; label: string; icon: any; section: string; }

const menuItems: MenuItem[] = [
  { id: 'dashboard',  label: 'Dashboard',        icon: LayoutDashboard, section: 'Dashboard'    },
  { id: 'pendapatan', label: 'Input Pendapatan',  icon: Wallet,          section: 'Transaksi'    },
  { id: 'jasa',       label: 'Input Jasa Medis',  icon: Stethoscope,     section: 'Transaksi'    },
  { id: 'indexing',   label: 'Indexing & Bobot',  icon: BarChart3,       section: 'Transaksi'    },
  { id: 'kalkulasi',  label: 'Kalkulator',        icon: Calculator,      section: 'Proses'       },
  { id: 'hasil',      label: 'Hasil Kalkulasi',   icon: FileBarChart2,   section: 'Proses'       },
  { id: 'approval',   label: 'Persetujuan',       icon: ClipboardCheck,  section: 'Proses'       },
  { id: 'pembayaran', label: 'Output Pembayaran', icon: Banknote,        section: 'Proses'       },
  { id: 'nakes',      label: 'Profil Nakes',      icon: UserCheck,       section: 'Master Data'  },
  { id: 'users',      label: 'Manajemen User',    icon: ShieldCheck,     section: 'Master Data'  },
  { id: 'laporan',    label: 'Pusat Laporan',     icon: BookOpen,        section: 'Laporan'      },
  { id: 'activity',   label: 'Activity Log',      icon: Clock,           section: 'Laporan'      },
  { id: 'networkdb',  label: 'Network Database', icon: DatabaseIcon,     section: 'Master Data' },
];

const sections = [
  { name: 'Dashboard',   icon: LayoutDashboard },
  { name: 'Transaksi',   icon: Wallet          },
  { name: 'Proses',      icon: Workflow        },
  { name: 'Master Data', icon: Database        },
  { name: 'Laporan',     icon: FileText        },
];

export default function Sidebar() {
  const { activePage, setActivePage, setShowSettings, settings, unreadCount } = useApp();
  const { session } = useAuth();
  const [showLogoutDialog, setShowLogout] = useState(false);

  const user = session?.user;
  const role = session?.role;

  return (
    <>
      {/* ────────────────────────────────────────────────────────
          SIDEBAR: fixed height (h-screen), sticky, tidak ikut scroll
          ──────────────────────────────────────────────────────── */}
      <aside className="w-72 bg-gradient-to-b from-teal-700 to-teal-900 text-white h-screen sticky top-0 flex flex-col shadow-2xl print:hidden flex-shrink-0">

        {/* ── Logo (fixed top) ── */}
        <div className="p-5 border-b border-teal-600/50 flex items-center gap-3 flex-shrink-0">
          <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Building2 className="w-6 h-6 text-teal-700" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight truncate">{settings.namaRS}</h1>
            <p className="text-[10px] text-teal-100 leading-tight">Sistem Informasi Remunerasi</p>
          </div>
        </div>

        {/* ── Menu (scrollable area — hanya bagian ini yang scroll) ── */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {sections.map((section) => {
            const items = menuItems.filter((m) => m.section === section.name);
            if (items.length === 0) return null;
            return (
              <div key={section.name} className="mt-2 first:mt-0">
                <p className="text-[10px] uppercase tracking-wider text-teal-200/80 px-3 pt-1 pb-1.5 font-semibold">
                  {section.name}
                </p>
                {items.map((item) => {
                  const Icon  = item.icon;
                  const active = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        active
                          ? 'bg-white text-teal-800 font-semibold shadow-lg'
                          : 'text-teal-50 hover:bg-teal-600/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.id === 'approval' && unreadCount > 0 && (
                        <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* ── User Info (fixed bottom) ── */}
        <div className="p-3 border-t border-teal-600/50 flex-shrink-0">
          {/* Kartu user */}
          <div className="flex items-center gap-3 px-3 py-3 bg-teal-800/60 rounded-xl mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white shadow-sm">
              {user?.avatar ?? '??'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-tight">{user?.nama?.split(',')[0] ?? 'Guest'}</p>
              <p className="text-[10px] text-teal-200 truncate">{user?.email ?? ''}</p>
              {role && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield className="w-2.5 h-2.5 text-teal-300" />
                  <span className="text-[9px] text-teal-200 truncate">{role.nama}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tombol aksi */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-teal-100 hover:bg-teal-600/50 transition"
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan</span>
          </button>
          <button
            onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-teal-100 hover:bg-rose-600/70 transition mt-0.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Logout Dialog */}
      <LogoutDialog open={showLogoutDialog} onClose={() => setShowLogout(false)} />
    </>
  );
}
