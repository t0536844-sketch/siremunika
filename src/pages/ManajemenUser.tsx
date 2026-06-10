import { useState, useMemo, useEffect } from 'react';
import {
  Users, Shield, Plus, Search, Filter, Eye, Pencil, Trash2,
  ToggleRight, ToggleLeft, Key, Copy, CheckCircle2, XCircle,
  Clock, AlertTriangle, Wifi, WifiOff, UserPlus, Lock,
  ShieldCheck, ShieldOff, MoreVertical, Download,
} from 'lucide-react';
import {
  defaultUsers, defaultRoles,
  allPermissions, permissionGroups,
  type UserAccount, type Role, type RoleId, type UserStatus, type PermissionKey,
} from '../data/userManagement';
import { formatNumber, formatDateShort } from '../utils/helpers';
import { exportToExcel } from '../utils/exporters';
import { useApp } from '../context/AppContext';
import ModalUser from '../components/ModalUser';
import ModalRole from '../components/ModalRole';
import dataService from '../data/dataService';

// ── Tab utama ──────────────────────────────────────────────────
type TabType = 'users' | 'roles' | 'permissions';

// ── Status config ──────────────────────────────────────────────
const statusConfig: Record<UserStatus, { label: string; cls: string; icon: any }> = {
  aktif:    { label: 'Aktif',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  nonaktif: { label: 'Nonaktif', cls: 'bg-slate-100 text-slate-600 border-slate-200',       icon: XCircle },
  suspend:  { label: 'Suspend',  cls: 'bg-rose-100 text-rose-700 border-rose-200',          icon: AlertTriangle },
};

export default function ManajemenUser() {
  const { showToast } = useApp();
  // ── Data state ────────────────────────────────────────────────
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  useEffect(() => {
    dataService.exportAllData().then((data) => {
      if (data.mstUser && data.mstUser.length > 0) {
        // Merge Supabase data with default UserAccount fields (Supabase only stores subset)
        const merged = data.mstUser.map((u: any) => {
          const defaults = defaultUsers.find(d => d.id === u.id || d.username === u.username);
          return {
            id: u.id || 'USR-000',
            nama: u.nama || '',
            username: u.username || '',
            email: u.email || '',
            noHp: u.noHp || '',
            roleId: (u.roleId || 'viewer') as RoleId,
            unit: u.unit || u.unitId || '',
            jabatan: u.jabatan || '',
            avatar: u.avatar || u.nama?.substring(0, 2).toUpperCase() || '??',
            status: (u.status || 'aktif') as UserStatus,
            lastLogin: u.lastLogin || defaults?.lastLogin || '-',
            createdAt: u.createdAt || defaults?.createdAt || new Date().toISOString().slice(0, 10),
            createdBy: u.createdBy || defaults?.createdBy || 'System',
            twoFactorEnabled: u.twoFactorEnabled ?? defaults?.twoFactorEnabled ?? false,
            loginCount: u.loginCount ?? defaults?.loginCount ?? 0,
            passwordChangedAt: u.passwordChangedAt || defaults?.passwordChangedAt || new Date().toISOString().slice(0, 10),
            isOnline: u.isOnline ?? defaults?.isOnline ?? false,
          } as UserAccount;
        });
        setUsers(merged);
      }
      if (data.mstRole && data.mstRole.length > 0) {
        const mergedRoles = data.mstRole.map((r: any) => {
          const defaults = defaultRoles.find(d => d.id === r.id);
          return {
            id: (r.id || 'role_unknown') as RoleId,
            nama: r.nama || r.namaRole || '',
            deskripsi: r.deskripsi || defaults?.deskripsi || '',
            warna: r.warna || defaults?.warna || 'slate',
            warnaText: r.warnaText || defaults?.warnaText || 'text-slate-600',
            warnaBg: r.warnaBg || defaults?.warnaBg || 'bg-slate-100',
            warnaBorder: r.warnaBorder || defaults?.warnaBorder || 'border-slate-200',
            permissions: r.permissions || defaults?.permissions || [],
            isSystem: r.isSystem ?? defaults?.isSystem ?? false,
            createdAt: r.createdAt || defaults?.createdAt || new Date().toISOString().slice(0, 10),
            userCount: r.userCount ?? defaults?.userCount ?? 0,
          } as Role;
        });
        setRoles(mergedRoles);
      }
    }).catch(() => { setUsers(defaultUsers); setRoles(defaultRoles); });
  }, []);

  // ── UI state ──────────────────────────────────────────────────
  const [tab, setTab]                           = useState<TabType>('users');
  const [search, setSearch]                     = useState('');
  const [filterRole, setFilterRole]             = useState<string>('Semua');
  const [filterStatus, setFilterStatus]         = useState<string>('Semua');
  const [filterUnit, setFilterUnit]             = useState<string>('Semua');
  const [openMenuId, setOpenMenuId]             = useState<string | null>(null);

  // ── Modal state ───────────────────────────────────────────────
  const [modalUser, setModalUser]               = useState<{ mode: 'add' | 'edit' | 'view'; user?: UserAccount } | null>(null);
  const [modalRole, setModalRole]               = useState<{ mode: 'add' | 'edit' | 'view'; role?: Role } | null>(null);
  const [confirmDelete, setConfirmDelete]       = useState<{ type: 'user' | 'role'; id: string; nama: string } | null>(null);
  const [resetPassTarget, setResetPassTarget]   = useState<UserAccount | null>(null);
  const [generatedPass, setGeneratedPass]       = useState<string>('');
  const [copiedPass, setCopiedPass]             = useState(false);

  // ── Derived: filtered users ───────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch  = search === '' ||
        u.nama.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole    = filterRole   === 'Semua' || u.roleId === filterRole;
      const matchStatus  = filterStatus === 'Semua' || u.status === filterStatus;
      const matchUnit    = filterUnit   === 'Semua' || u.unit   === filterUnit;
      return matchSearch && matchRole && matchStatus && matchUnit;
    });
  }, [users, search, filterRole, filterStatus, filterUnit]);

  // ── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    users.length,
    aktif:    users.filter((u) => u.status === 'aktif').length,
    online:   users.filter((u) => u.isOnline).length,
    suspend:  users.filter((u) => u.status === 'suspend').length,
    total2fa: users.filter((u) => u.twoFactorEnabled).length,
  }), [users]);

  // ── Helpers ───────────────────────────────────────────────────
  const getRoleById = (id: RoleId) => roles.find((r) => r.id === id);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  // ── CRUD: Users ───────────────────────────────────────────────
  const handleSaveUser = async (data: Omit<UserAccount, 'id' | 'createdAt' | 'createdBy' | 'loginCount' | 'lastLogin' | 'passwordChangedAt' | 'isOnline'>, editId?: string) => {
    if (editId) {
      setUsers((prev) => prev.map((u) => u.id === editId ? { ...u, ...data } : u));
      try {
        await dataService.saveUser({ id: editId, nama: data.nama, username: data.username, email: data.email, noHp: data.noHp, roleId: data.roleId, unitId: data.unitId, jabatan: data.jabatan, status: data.status });
        showToast('success', 'User diperbarui', data.nama);
      } catch (e) {
        showToast('warning', 'Updated locally only', 'Failed to sync to database');
      }
    } else {
      const newUser: UserAccount = {
        id: `USR-${String(users.length + 1).padStart(3, '0')}`,
        ...data,
        createdAt: new Date().toISOString().slice(0, 10),
        createdBy: 'USR-001',
        loginCount: 0,
        lastLogin: '-',
        passwordChangedAt: new Date().toISOString().slice(0, 10),
        isOnline: false,
      };
      setUsers((prev) => [newUser, ...prev]);
      try {
        await dataService.saveUser({ nama: data.nama, username: data.username, email: data.email, noHp: data.noHp, roleId: data.roleId, unitId: data.unitId, jabatan: data.jabatan, status: data.status });
        showToast('success', 'User baru dibuat', `${data.nama} (${data.username})`);
      } catch (e) {
        showToast('warning', 'Created locally only', 'Failed to sync to database');
      }
    }
    setModalUser(null);
  };

  const handleDeleteUser = async (id: string) => {
    const u = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setConfirmDelete(null);
    try {
      await dataService.deleteUser(id);
      showToast('warning', 'User dihapus', u?.nama);
    } catch (e) {
      showToast('warning', 'Deleted locally only', 'Failed to sync to database');
    }
  };

  const handleToggleStatus = (id: string) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== id) return u;
      const next: UserStatus = u.status === 'aktif' ? 'nonaktif' : 'aktif';
      showToast(next === 'aktif' ? 'success' : 'warning',
        `User ${next === 'aktif' ? 'diaktifkan' : 'dinonaktifkan'}`, u.nama);
      return { ...u, status: next };
    }));
  };

  const handleSuspend = (id: string) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== id) return u;
      showToast('error', 'User disuspend', u.nama);
      return { ...u, status: 'suspend' as UserStatus };
    }));
    setOpenMenuId(null);
  };

  const handleResetPassword = (user: UserAccount) => {
    const pwd = generatePassword();
    setGeneratedPass(pwd);
    setResetPassTarget(user);
    setOpenMenuId(null);
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(generatedPass);
    setCopiedPass(true);
    showToast('success', 'Password disalin ke clipboard');
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleToggle2FA = (id: string) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id !== id) return u;
      showToast('info', u.twoFactorEnabled ? '2FA dinonaktifkan' : '2FA diaktifkan', u.nama);
      return { ...u, twoFactorEnabled: !u.twoFactorEnabled };
    }));
    setOpenMenuId(null);
  };

  // ── CRUD: Roles ───────────────────────────────────────────────
  const handleSaveRole = (data: Omit<Role, 'id' | 'createdAt' | 'userCount' | 'isSystem'>, editId?: string) => {
    if (editId) {
      setRoles((prev) => prev.map((r) => r.id === editId ? { ...r, ...data } : r));
      showToast('success', 'Role diperbarui', data.nama);
    } else {
      const newRole: Role = {
        id: `role_${Date.now()}` as RoleId,
        ...data,
        createdAt: new Date().toISOString().slice(0, 10),
        userCount: 0,
        isSystem: false,
      };
      setRoles((prev) => [...prev, newRole]);
      showToast('success', 'Role baru dibuat', data.nama);
    }
    setModalRole(null);
  };

  const handleDeleteRole = (id: string) => {
    const usersWithRole = users.filter((u) => u.roleId === id);
    if (usersWithRole.length > 0) {
      showToast('error', 'Role tidak bisa dihapus', `Masih digunakan oleh ${usersWithRole.length} user`);
      setConfirmDelete(null);
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== id));
    showToast('warning', 'Role dihapus', roles.find((r) => r.id === id)?.nama);
    setConfirmDelete(null);
  };

  // ── Export ────────────────────────────────────────────────────
  const handleExportUsers = () => {
    exportToExcel('Daftar_User', 'Users',
      [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nama', key: 'nama', width: 28 },
        { header: 'Username', key: 'username', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 22 },
        { header: 'Unit', key: 'unit', width: 24 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Login Terakhir', key: 'lastLogin', width: 20 },
        { header: '2FA', key: 'twoFactor', width: 8 },
        { header: 'Total Login', key: 'loginCount', format: 'number' as const, width: 12 },
      ],
      filteredUsers.map((u) => ({
        id: u.id, nama: u.nama, username: u.username, email: u.email,
        role: getRoleById(u.roleId)?.nama ?? u.roleId,
        unit: u.unit, status: u.status, lastLogin: u.lastLogin,
        twoFactor: u.twoFactorEnabled ? 'Ya' : 'Tidak', loginCount: u.loginCount,
      })),
      { title: 'DAFTAR PENGGUNA SIM REMUNERASI', subtitle: `${filteredUsers.length} user` }
    );
    showToast('success', 'Daftar user diekspor ke Excel');
  };

  // ── Unique units dari users ───────────────────────────────────
  const unitList = Array.from(new Set(users.map((u) => u.unit)));

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5 bg-slate-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full -mr-24 -mt-24 pointer-events-none" />
        <div className="absolute -left-8 bottom-0 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">Manajemen User & RBAC</h2>
                <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-bold tracking-wide">Role-Based Access Control</span>
              </div>
              <p className="text-violet-100 text-sm max-w-2xl">
                Kelola akun pengguna, role, dan permission akses sistem SIM Remunerasi RSUD Mimika secara terpusat dan aman.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Total User',  value: stats.total,    icon: Users },
              { label: 'Online',      value: stats.online,   icon: Wifi },
              { label: 'Role',        value: roles.length,   icon: Shield },
              { label: '2FA Aktif',   value: stats.total2fa, icon: Lock },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm font-semibold border border-white/10">
                  <Icon className="w-4 h-4 text-violet-100" />
                  <span>{s.label}: {s.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Pengguna',  value: stats.total,    color: 'text-slate-800',   bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Aktif',           value: stats.aktif,    color: 'text-emerald-700', bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Sedang Online',   value: stats.online,   color: 'text-sky-700',     bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Suspend',         value: stats.suspend,  color: 'text-rose-700',    bg: 'bg-white', border: 'border-slate-200' },
          { label: '2FA Enabled',     value: stats.total2fa, color: 'text-violet-700',  bg: 'bg-white', border: 'border-slate-200' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} ${s.border} border rounded-2xl p-4 hover:shadow-md transition`}>
            <p className="text-xs text-slate-500 mb-1 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab Navigator ── */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-slate-200 w-fit shadow-sm">
        {([
          { id: 'users',       label: 'Pengguna',   icon: Users,  count: users.length },
          { id: 'roles',       label: 'Role',        icon: Shield, count: roles.length },
          { id: 'permissions', label: 'Permission Matrix', icon: Lock, count: allPermissions.length },
        ] as const).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════ TAB: USERS ═══════════════ */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, username, atau email…"
                className="bg-transparent text-sm focus:outline-none w-full" />
            </div>
            {/* Filter Role */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Shield className="w-4 h-4 text-slate-400" />
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                className="bg-transparent text-sm focus:outline-none min-w-[160px]">
                <option>Semua</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
              </select>
            </div>
            {/* Filter Status */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Filter className="w-4 h-4 text-slate-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-sm focus:outline-none min-w-[110px]">
                <option>Semua</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
                <option value="suspend">Suspend</option>
              </select>
            </div>
            {/* Filter Unit */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Filter className="w-4 h-4 text-slate-400" />
              <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}
                className="bg-transparent text-sm focus:outline-none min-w-[160px]">
                <option>Semua</option>
                {unitList.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <button onClick={handleExportUsers}
              className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => setModalUser({ mode: 'add' })}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm transition">
              <UserPlus className="w-4 h-4" /> Tambah User
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                    <th className="px-5 py-3 text-left font-semibold">Pengguna</th>
                    <th className="px-5 py-3 text-left font-semibold">Role</th>
                    <th className="px-5 py-3 text-left font-semibold">Unit</th>
                    <th className="px-5 py-3 text-center font-semibold">Status</th>
                    <th className="px-5 py-3 text-center font-semibold">2FA</th>
                    <th className="px-5 py-3 text-left font-semibold">Login Terakhir</th>
                    <th className="px-5 py-3 text-right font-semibold">Total Login</th>
                    <th className="px-5 py-3 text-center font-semibold w-[120px]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const role = getRoleById(user.roleId);
                    const stCfg = statusConfig[user.status];
                    const StIcon = stCfg.icon;
                    return (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-violet-50/30 transition-colors group">
                        {/* Pengguna */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {user.avatar}
                              </div>
                              {user.isOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{user.nama}</p>
                              <p className="text-[10px] text-slate-500 font-mono">@{user.username}</p>
                              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-5 py-3">
                          {role && (
                            <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border font-bold ${role.warnaBg} ${role.warnaText} ${role.warnaBorder}`}>
                              <Shield className="w-3 h-3" />
                              {role.nama}
                            </span>
                          )}
                        </td>
                        {/* Unit */}
                        <td className="px-5 py-3 text-xs text-slate-600 max-w-[160px] truncate">{user.unit}</td>
                        {/* Status */}
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => handleToggleStatus(user.id)} title="Klik untuk toggle">
                            <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border font-semibold cursor-pointer hover:opacity-80 ${stCfg.cls}`}>
                              <StIcon className="w-3 h-3" />
                              {stCfg.label}
                            </span>
                          </button>
                        </td>
                        {/* 2FA */}
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => handleToggle2FA(user.id)} title="Toggle 2FA">
                            {user.twoFactorEnabled
                              ? <ToggleRight className="w-6 h-6 text-emerald-500 mx-auto" />
                              : <ToggleLeft className="w-6 h-6 text-slate-300 mx-auto" />}
                          </button>
                        </td>
                        {/* Login terakhir */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            {user.isOnline
                              ? <><Wifi className="w-3 h-3 text-emerald-500" /><span className="text-emerald-600 font-semibold">Online sekarang</span></>
                              : <><WifiOff className="w-3 h-3 text-slate-400" /><span>{user.lastLogin !== '-' ? formatDateShort(user.lastLogin.split(' ')[0]) : '-'}</span></>}
                          </div>
                        </td>
                        {/* Total login */}
                        <td className="px-5 py-3 text-right text-slate-600 text-xs font-semibold">
                          {formatNumber(user.loginCount)}x
                        </td>
                        {/* Aksi */}
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setModalUser({ mode: 'view', user })}
                              className="p-1.5 text-slate-400 hover:bg-sky-100 hover:text-sky-700 rounded-lg transition" title="Detail">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => setModalUser({ mode: 'edit', user })}
                              className="p-1.5 text-slate-400 hover:bg-amber-100 hover:text-amber-700 rounded-lg transition" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            {/* Dropdown more */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenuId === user.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-20 min-w-[180px]">
                                    <button onClick={() => handleResetPassword(user)}
                                      className="w-full px-4 py-2 text-left text-xs hover:bg-amber-50 text-slate-700 hover:text-amber-700 flex items-center gap-2">
                                      <Key className="w-3.5 h-3.5" /> Reset Password
                                    </button>
                                    <button onClick={() => handleSuspend(user.id)}
                                      className="w-full px-4 py-2 text-left text-xs hover:bg-rose-50 text-slate-700 hover:text-rose-700 flex items-center gap-2">
                                      <ShieldOff className="w-3.5 h-3.5" /> Suspend User
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                      onClick={() => { setConfirmDelete({ type: 'user', id: user.id, nama: user.nama }); setOpenMenuId(null); }}
                                      className="w-full px-4 py-2 text-left text-xs hover:bg-rose-50 text-rose-600 flex items-center gap-2">
                                      <Trash2 className="w-3.5 h-3.5" /> Hapus User
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                        <p className="text-slate-500 font-semibold">Tidak ada user ditemukan</p>
                        <button onClick={() => setModalUser({ mode: 'add' })}
                          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg">
                          + Tambah User Baru
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Menampilkan <b>{filteredUsers.length}</b> dari <b>{users.length}</b> pengguna</span>
              <span>Online: <b className="text-emerald-600">{stats.online}</b> · Suspend: <b className="text-rose-600">{stats.suspend}</b></span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB: ROLES ═══════════════ */}
      {tab === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">{roles.length} role terdaftar · {roles.filter((r) => r.isSystem).length} role sistem (tidak bisa dihapus)</p>
            <button onClick={() => setModalRole({ mode: 'add' })}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg shadow-sm">
              <Plus className="w-4 h-4" /> Tambah Role
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map((role) => {
              const userCount = users.filter((u) => u.roleId === role.id).length;
              return (
                <div key={role.id}
                  className={`bg-white rounded-2xl border-2 p-5 flex flex-col gap-3 hover:shadow-lg transition group ${role.warnaBorder}`}>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role.warnaBg} ${role.warnaText}`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {role.isSystem && (
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold border border-slate-200">SISTEM</span>
                      )}
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${role.warnaBg} ${role.warnaText} ${role.warnaBorder}`}>
                        {formatNumber(userCount)} user
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{role.nama}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{role.deskripsi}</p>
                  </div>
                  {/* Permission preview */}
                  <div className="flex flex-wrap gap-1 min-h-[48px]">
                    {role.permissions.slice(0, 6).map((p) => (
                      <span key={p} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{p.split('.')[0]}.{p.split('.')[1]}</span>
                    ))}
                    {role.permissions.length > 6 && (
                      <span className="text-[9px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded font-bold">+{role.permissions.length - 6} lainnya</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Dibuat {formatDateShort(role.createdAt)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModalRole({ mode: 'view', role })}
                        className="p-1.5 text-slate-400 hover:bg-sky-100 hover:text-sky-700 rounded-lg" title="Detail">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => setModalRole({ mode: 'edit', role })}
                        className="p-1.5 text-slate-400 hover:bg-amber-100 hover:text-amber-700 rounded-lg" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!role.isSystem && (
                        <button onClick={() => setConfirmDelete({ type: 'role', id: role.id, nama: role.nama })}
                          className="p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-700 rounded-lg" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════ TAB: PERMISSION MATRIX ═══════════════ */}
      {tab === 'permissions' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Matrix ini menampilkan hak akses semua role secara bersamaan. Edit permission melalui halaman <b>Detail Role</b>.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="text-xs w-full min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-bold text-slate-700 sticky left-0 bg-slate-50 z-10 min-w-[200px]">
                      Permission
                    </th>
                    {roles.map((r) => (
                      <th key={r.id} className="px-3 py-3 text-center min-w-[100px]">
                        <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${r.warnaBg} ${r.warnaText}`}>
                          {r.nama.split(' ').slice(-1)[0]}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissionGroups.map((group) => {
                    const perms = allPermissions.filter((p) => p.group === group);
                    return (
                      <>
                        <tr key={`group-${group}`} className="bg-violet-50 border-t border-violet-100">
                          <td colSpan={roles.length + 1} className="px-4 py-2 font-bold text-violet-800 text-[10px] uppercase tracking-wider sticky left-0 bg-violet-50">
                            {group}
                          </td>
                        </tr>
                        {perms.map((perm) => (
                          <tr key={perm.key} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-2.5 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                              <p className="font-semibold text-slate-700">{perm.label}</p>
                              <p className="text-slate-400 text-[9px] font-mono">{perm.key}</p>
                            </td>
                            {roles.map((r) => (
                              <td key={r.id} className="px-3 py-2.5 text-center">
                                {r.permissions.includes(perm.key as PermissionKey)
                                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                  : <XCircle className="w-4 h-4 text-slate-200 mx-auto" />}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: USER ═══════════════ */}
      {modalUser && (
        <ModalUser
          mode={modalUser.mode}
          user={modalUser.user}
          roles={roles}
          onSave={handleSaveUser}
          onClose={() => setModalUser(null)}
        />
      )}

      {/* ═══════════════ MODAL: ROLE ═══════════════ */}
      {modalRole && (
        <ModalRole
          mode={modalRole.mode}
          role={modalRole.role}
          userCount={modalRole.role ? users.filter((u) => u.roleId === modalRole.role!.id).length : 0}
          onSave={handleSaveRole}
          onClose={() => setModalRole(null)}
        />
      )}

      {/* ═══════════════ KONFIRMASI HAPUS ═══════════════ */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Hapus {confirmDelete.type === 'user' ? 'Pengguna' : 'Role'}?
              </h3>
              <p className="text-sm text-slate-600 mb-1">Anda akan menghapus:</p>
              <p className="font-bold text-slate-800 mb-4">"{confirmDelete.nama}"</p>
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition">
                Batal
              </button>
              <button
                onClick={() => confirmDelete.type === 'user' ? handleDeleteUser(confirmDelete.id) : handleDeleteRole(confirmDelete.id)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: RESET PASSWORD ═══════════════ */}
      {resetPassTarget && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Reset Password</h3>
                  <p className="text-[10px] text-amber-100">{resetPassTarget.nama}</p>
                </div>
              </div>
              <button onClick={() => { setResetPassTarget(null); setGeneratedPass(''); }}
                className="text-white/70 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Password baru telah digenerate secara otomatis. Salin dan kirimkan kepada pengguna melalui jalur aman.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-[10px] text-amber-700 font-semibold mb-2 uppercase tracking-wide">Password Baru</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-bold font-mono text-slate-800 tracking-widest">
                    {generatedPass}
                  </code>
                  <button onClick={handleCopyPassword}
                    className={`p-2 rounded-lg transition ${copiedPass ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-600'}`}>
                    {copiedPass ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                Pengguna harus mengganti password ini segera setelah login pertama. Password ini hanya ditampilkan satu kali.
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setResetPassTarget(null); setGeneratedPass(''); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition">
                Tutup
              </button>
              <button onClick={handleCopyPassword}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition">
                <Copy className="w-4 h-4" /> Salin Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
