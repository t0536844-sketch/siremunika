import {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode,
} from 'react';

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

// ─── Initial notifications ──────────────────────────────────────
const initialNotifications: Notification[] = [
  { id: 'NTF-001', type: 'warning', title: 'Persetujuan Menunggu',   message: '6 pengajuan remunerasi menunggu approval direksi', time: '5 menit lalu', read: false },
  { id: 'NTF-002', type: 'success', title: 'Periode Ditutup',        message: 'Periode Desember 2025 telah selesai diproses',     time: '1 jam lalu',   read: false },
  { id: 'NTF-003', type: 'info',    title: 'Update Sistem',          message: 'SIM Remunerasi telah diperbarui ke versi 1.0.0',   time: '3 jam lalu',   read: false },
  { id: 'NTF-004', type: 'error',   title: 'Data Belum Lengkap',     message: 'Unit Radiologi belum input data pendapatan hari ini', time: 'Kemarin',  read: true  },
];

// ─── Context type ───────────────────────────────────────────────
interface AppContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;

  globalSearch: string;
  setGlobalSearch: (val: string) => void;

  notifications: Notification[];
  unreadCount: number;
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
  const markAsRead      = useCallback((id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)), []);
  const markAllAsRead   = useCallback(() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))), []);
  const clearNotifications = useCallback(() => setNotifications([]), []);

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
      notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications,
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
