import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { defaultUsers, defaultRoles } from '../data/userManagement';
import type { UserAccount, Role, PermissionKey } from '../data/userManagement';

// ─── Tipe Session ──────────────────────────────────────────────
export interface AuthSession {
  user: UserAccount;
  role: Role;
  loginAt: string;
  expiresAt: string;           // 8 jam dari loginAt
}

// ─── Tipe Context ──────────────────────────────────────────────
interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (username: string, password: string) => Promise<LoginResult>;
  logout: (reason?: string) => void;

  can: (permission: PermissionKey) => boolean;
  canAny: (permissions: PermissionKey[]) => boolean;
  canAll: (permissions: PermissionKey[]) => boolean;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

// ─── Session Storage key ───────────────────────────────────────
const SESSION_KEY = 'sim_remunerasi_session';

// ─── Credential map (username → password, hanya demo) ─────────
const CREDENTIALS: Record<string, string> = {
  superadmin:       'Admin@2026!',
  'direktur.hendra':'Direktur@2026!',
  'kabag.keuangan': 'Keuangan@2026!',
  'admin.keuangan1':'Keuangan@2026!',
  'admin.keuangan2':'Keuangan@2026!',
  'kabag.poli_dalam':'Unit@2026!',
  'kabag.poli_anak': 'Unit@2026!',
  'operator.lab':    'Operator@2026!',
  'operator.radiologi':'Operator@2026!',
  'verifikator.1':  'Verif@2026!',
  'viewer.audit':   'Viewer@2026!',
  'admin.keuangan3':'Keuangan@2026!',
  'operator.igd':   'Operator@2026!',
};

// ─── Database validation ────────────────────────────────────────
async function validateUserFromDB(username: string, password: string): Promise<{ ok: true; user: UserAccount; role: Role } | { ok: false; error: string }> {
  try {
    const apiUrl = localStorage.getItem('sim_remunerasi_api_url') || 'http://localhost:7860';
    
    const response = await fetch(`${apiUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (data.ok && data.user && data.role) {
      return { 
        ok: true, 
        user: data.user, 
        role: data.role 
      };
    } else {
      return { 
        ok: false, 
        error: data.error || 'Invalid credentials' 
      };
    }
  } catch (error) {
    // Jika gagal koneksi ke DB, fallback ke hardcoded credentials
    return validateFromHardcoded(username, password);
  }
}

function validateFromHardcoded(username: string, password: string): { ok: true; user: UserAccount; role: Role } | { ok: false; error: string } {
  const storedPassword = CREDENTIALS[username];
  if (!storedPassword) {
    return { ok: false, error: 'User tidak ditemukan' };
  }

  if (storedPassword !== password) {
    return { ok: false, error: 'Password salah' };
  }

  const user = defaultUsers.find(u => u.username === username);
  const role = defaultRoles.find(r => r.id === user?.roleId);

  if (!user || !role) {
    return { ok: false, error: 'User data tidak valid' };
  }

  return { ok: true, user, role };
}

// ─── Helpers ───────────────────────────────────────────────────
function buildSession(user: UserAccount, role: Role): AuthSession {
  const now = new Date();
  const exp = new Date(now.getTime() + 8 * 60 * 60 * 1000); // +8 jam
  return {
    user,
    role,
    loginAt: now.toISOString(),
    expiresAt: exp.toISOString(),
  };
}

function isSessionExpired(session: AuthSession): boolean {
  return new Date() > new Date(session.expiresAt);
}

function saveSession(session: AuthSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* quota exceeded → ignore */ }
}

function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s: AuthSession = JSON.parse(raw);
    if (isSessionExpired(s)) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Context ───────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true saat restore session

  // Restore session saat mount
  useEffect(() => {
    const stored = loadSession();
    if (stored) {
      // Sinkron ulang data user & role dari sumber (simu: defaultUsers)
      const freshUser = defaultUsers.find((u) => u.id === stored.user.id);
      const freshRole = defaultRoles.find((r) => r.id === stored.role.id);
      if (freshUser && freshRole && freshUser.status === 'aktif') {
        setSession({ ...stored, user: freshUser, role: freshRole });
      } else {
        clearSession();
      }
    }
    setIsLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    // Simulasi network delay
    await new Promise((r) => setTimeout(r, 900));

    const trimUser = username.trim().toLowerCase();
    const trimPass = password.trim();

    // Coba autentikasi melalui API terlebih dahulu
    const authResult = await validateUserFromDB(trimUser, trimPass);
    if (authResult.ok) {
      const newSession = buildSession(authResult.user, authResult.role);
      saveSession(newSession);
      setSession(newSession);
      return { ok: true };
    }

    // Jika API gagal, fallback ke hardcoded credentials
    console.warn('API authentication failed, falling back to hardcoded credentials');

    const user = defaultUsers.find(
      (u) => u.username.toLowerCase() === trimUser
    );

    if (!user) {
      return { ok: false, error: 'Username tidak ditemukan dalam sistem.' };
    }

    if (user.status === 'suspend') {
      return { ok: false, error: 'Akun Anda telah disuspend. Hubungi Administrator.' };
    }

    if (user.status === 'nonaktif') {
      return { ok: false, error: 'Akun Anda nonaktif. Hubungi Kepala Bagian Anda.' };
    }

    const expectedPass = CREDENTIALS[trimUser];
    if (!expectedPass || trimPass !== expectedPass) {
      return { ok: false, error: 'Password salah. Periksa kembali dan coba lagi.' };
    }

    const role = defaultRoles.find((r) => r.id === user.roleId);
    if (!role) {
      return { ok: false, error: 'Konfigurasi role tidak ditemukan. Hubungi Administrator.' };
    }

    const newSession = buildSession(user, role);
    saveSession(newSession);
    setSession(newSession);
    return { ok: true };
  }, []);

  // ── Logout ─────────────────────────────────────────────────────
  const logout = useCallback((_reason?: string) => {
    clearSession();
    setSession(null);
  }, []);

  // ── Permission checker ─────────────────────────────────────────
  const can = useCallback(
    (permission: PermissionKey) => session?.role.permissions.includes(permission) ?? false,
    [session]
  );

  const canAny = useCallback(
    (permissions: PermissionKey[]) => permissions.some((p) => session?.role.permissions.includes(p) ?? false),
    [session]
  );

  const canAll = useCallback(
    (permissions: PermissionKey[]) => permissions.every((p) => session?.role.permissions.includes(p) ?? false),
    [session]
  );

  return (
    <AuthContext.Provider value={{
      session,
      isAuthenticated: !!session,
      isLoading,
      login,
      logout,
      can,
      canAny,
      canAll,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
