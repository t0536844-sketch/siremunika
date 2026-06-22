import {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode,
} from 'react';
import dataService from '../data/dataService';

// ─── Types ─────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export interface Notification {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  page?: string;  // Navigate to this page when clicked
}

export interface AppSettings {
  namaRS: string;
  periode: string;
  bebanOperasional: number;
  jasaMedis: number;
  jasaParamedis: number;
  jasaPenunjang: number;
  bonusPrestasi: number;
  pajakPPh: number;
  approvalAutoLevel: boolean;
  emailNotifikasi: string;
  theme: 'light' | 'dark';
}

// ─── Storage keys ───────────────────────────────────────────────
const SETTINGS_KEY = 'sim_app_settings';
const THEME_KEY    = 'sim_theme';

// ─── Helpers: theme DOM ─────────────────────────────────────────
function applyThemeToDom(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function loadStoredTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    // Respect OS preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {}
  return 'light';
}

function loadStoredSettings(): Partial<AppSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

// ─── Defaults ──────────────────────────────────────────────────
const defaultSettings: AppSettings = {
  namaRS: 'RSUD Mimika',
  periode: 'Januari 2026',
  bebanOperasional: 40,
  jasaMedis: 30,
  jasaParamedis: 15,
  jasaPenunjang: 9,
  bonusPrestasi: 6,
  pajakPPh: 5,
  approvalAutoLevel: true,
  emailNotifikasi: 'admin.rsud@mimika.go.id',
  theme: 'light',
};

// Merge stored settings into defaults
const initialSettings: AppSettings = {
  ...defaultSettings,
  ...loadStoredSettings(),
};

// ─── Generate initial notifications from data ──────────────────
function buildDataNotifications(data: any): Notification[] {
  const notifs: Notification[] = [];
  const now = new Date();
  const timeAgo = (mins: number) => mins < 60 ? `${mins} menit lalu` : mins < 1440 ? `${Math.floor(mins/60)} jam lalu` : 'Kemarin';

  // Pending approvals
  const approvalData = data?.approval || [];
  const pendingApproval = approvalData.filter((a: any) => a.status === 'pending');
  if (pendingApproval.length > 0) {
    notifs.push({
      id: 'NTF-APR-PENDING',
      type: 'warning',
      title: 'Persetujuan Menunggu',
      message: `${pendingApproval.length} pengajuan remunerasi menunggu approval`,
      time: timeAgo(5),
      read: false,
      page: 'approval',
    });
  }

  // Hasil kalkulasi draft (not finalized yet)
  const hasilData = data?.hasilKalkulasi || [];
  const draftHasil = hasilData.filter((h: any) => h.status === 'draft');
  if (draftHasil.length > 0) {
    notifs.push({
      id: 'NTF-HASIL-DRAFT',
      type: 'info',
      title: 'Hasil Kalkulasi Belum Final',
      message: `${draftHasil.length} unit hasil kalkulasi masih berstatus draft`,
      time: timeAgo(30),
      read: false,
      page: 'hasil',
    });
  }

  // Pembayaran awaiting finalization
  const pembayaranData = data?.pembayaran || [];
  const draftPembayaran = pembayaranData.filter((p: any) => p.status === 'draft');
  if (draftPembayaran.length > 0) {
    notifs.push({
      id: 'NTF-PMB-DRAFT',
      type: 'info',
      title: 'Pembayaran Menunggu Finalisasi',
      message: `${draftPembayaran.length} pembayaran draft menunggu finalisasi`,
      time: timeAgo(60),
      read: false,
      page: 'pembayaran',
    });
  }

  // Approved pembayaran (ready to pay)
  const approvedPembayaran = pembayaranData.filter((p: any) => p.status === 'approved');
  if (approvedPembayaran.length > 0) {
    notifs.push({
      id: 'NTF-PMB-APPROVED',
      type: 'success',
      title: 'Pembayaran Siap Transfer',
      message: `${approvedPembayaran.length} pembayaran telah disetujui dan siap ditransfer`,
      time: timeAgo(120),
      read: false,
      page: 'pembayaran',
    });
  }

  // Rejected approvals
  const rejectedApproval = approvalData.filter((a: any) => a.status === 'rejected');
  if (rejectedApproval.length > 0) {
    notifs.push({
      id: 'NTF-APR-REJECTED',
      type: 'error',
      title: 'Pengajuan Ditolak',
      message: `${rejectedApproval.length} pengajuan remunerasi telah ditolak`,
      time: timeAgo(180),
      read: true,
      page: 'approval',
    });
  }

  // System info (always present)
  notifs.push({
    id: 'NTF-SYS-VERSION',
    type: 'info',
    title: 'Update Sistem',
    message: 'SIM Remunerasi versi 1.0 — Kalkulator→Hasil→Approval→Pembayaran pipeline aktif',
    time: timeAgo(300),
    read: true,
  });

  return notifs;
}

// ─── Initial notifications (empty — loaded from data) ──────────
const initialNotifications: Notification[] = [];

// ─── Context type ───────────────────────────────────────────────
interface AppContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;

  globalSearch: string;
  setGlobalSearch: (val: string) => void;

  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;

  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  refreshKey: number;
  triggerRefresh: () => void;

  showSettings: boolean;
  setShowSettings: (val: boolean) => void;

  showNotifications: boolean;
  setShowNotifications: (val: boolean) => void;

  activePage: string;
  setActivePage: (page: string) => void;

  // Sync state
  isSyncing: boolean;
  setIsSyncing: (val: boolean) => void;
  lastSync: string | null;
  setLastSync: (val: string | null) => void;
  syncStatus: 'idle' | 'connecting' | 'syncing' | 'success' | 'error';
  setSyncStatus: (val: 'idle' | 'connecting' | 'syncing' | 'success' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [toasts,            setToasts]            = useState<Toast[]>([]);
  const [globalSearch,      setGlobalSearch]      = useState('');
  const [notifications,     setNotifications]     = useState<Notification[]>(initialNotifications);
  const [settings,          setSettings]          = useState<AppSettings>(initialSettings);
  const [refreshKey,        setRefreshKey]        = useState(0);
  const [showSettings,      setShowSettings]      = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activePage,        setActivePage]        = useState('dashboard');
  
  // Sync state
  const [isSyncing,         setIsSyncing]         = useState(false);
  const [lastSync,          setLastSync]          = useState<string | null>(null);
  const [syncStatus,        setSyncStatus]        = useState<'idle' | 'connecting' | 'syncing' | 'success' | 'error'>('idle');

  // Derive isDark from settings.theme
  const isDark = settings.theme === 'dark';

  // Apply theme to DOM whenever settings.theme changes
  useEffect(() => {
    // On first mount, load stored theme so DOM is correct before render
    const storedTheme = loadStoredTheme();
    if (storedTheme !== settings.theme) {
      setSettings((prev) => ({ ...prev, theme: storedTheme }));
    }
    applyThemeToDom(storedTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyThemeToDom(settings.theme);
    try {
      localStorage.setItem(THEME_KEY, settings.theme);
    } catch {}
  }, [settings.theme]);

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // ── Toast ────────────────────────────────────────────────────
  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Notifications ────────────────────────────────────────────
  const addNotification = useCallback((n: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const id = `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newNotif: Notification = { ...n, id, time: 'Baru saja', read: false };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markAsRead      = useCallback((id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)), []);
  const markAllAsRead   = useCallback(() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))), []);
  const clearNotifications = useCallback(() => setNotifications([]), []);

  // Load data-driven notifications from Supabase on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await dataService.exportAllData();
        const dataNotifs = buildDataNotifications(data);
        setNotifications(dataNotifs);
      } catch {
        // Fallback to system-only notification
        setNotifications([
          { id: 'NTF-SYS-OFFLINE', type: 'warning', title: 'Mode Offline', message: 'Database tidak terhubung — data menggunakan lokal', time: 'Baru saja', read: false },
        ]);
      }
    };
    loadNotifications();
  }, []);

  // ── Settings ─────────────────────────────────────────────────
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // ── Theme ─────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  // ── Refresh ──────────────────────────────────────────────────
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider value={{
      toasts, showToast, removeToast,
      globalSearch, setGlobalSearch,
      notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearNotifications,
      settings, updateSettings,
      isDark, toggleTheme, setTheme,
      refreshKey, triggerRefresh,
      showSettings, setShowSettings,
      showNotifications, setShowNotifications,
      activePage, setActivePage,
      // Sync state
      isSyncing, setIsSyncing,
      lastSync, setLastSync,
      syncStatus, setSyncStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
