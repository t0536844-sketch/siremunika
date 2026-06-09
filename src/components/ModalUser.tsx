import { useState, useEffect } from 'react';
import {
  X, UserPlus, Pencil, Eye, Save, RotateCcw, AlertTriangle,
  Shield, Building2, Phone, Mail, Lock, User, Hash, IdCard,
  CheckCircle2, XCircle, Clock, Key,
} from 'lucide-react';
import type { UserAccount, Role, RoleId, UserStatus } from '../data/userManagement';
import { daftarUnit, daftarJabatan } from '../data/mockData';
import { formatDateShort, formatNumber } from '../utils/helpers';

interface Props {
  mode: 'add' | 'edit' | 'view';
  user?: UserAccount;
  roles: Role[];
  onSave: (
    data: Omit<UserAccount, 'id' | 'createdAt' | 'createdBy' | 'loginCount' | 'lastLogin' | 'passwordChangedAt' | 'isOnline'>,
    editId?: string
  ) => void;
  onClose: () => void;
}

type FormData = {
  nama: string;
  username: string;
  email: string;
  noHp: string;
  roleId: RoleId;
  unit: string;
  jabatan: string;
  avatar: string;
  status: UserStatus;
  twoFactorEnabled: boolean;
};

type FormError = Partial<Record<keyof FormData, string>>;

const EMPTY_FORM: FormData = {
  nama: '', username: '', email: '', noHp: '',
  roleId: 'operator_unit', unit: daftarUnit[0], jabatan: daftarJabatan[0],
  avatar: '', status: 'aktif', twoFactorEnabled: false,
};

function validate(form: FormData): FormError {
  const err: FormError = {};
  if (!form.nama.trim() || form.nama.trim().length < 3) err.nama = 'Nama minimal 3 karakter';
  if (!form.username.trim() || form.username.trim().length < 4) err.username = 'Username minimal 4 karakter';
  else if (!/^[a-z0-9._]+$/.test(form.username)) err.username = 'Username hanya huruf kecil, angka, titik, underscore';
  if (!form.email.trim()) err.email = 'Email wajib diisi';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = 'Format email tidak valid';
  if (!form.noHp.trim()) err.noHp = 'Nomor HP wajib diisi';
  else if (!/^0\d{8,13}$/.test(form.noHp.replace(/[-\s]/g, ''))) err.noHp = 'Format HP tidak valid';
  if (!form.unit) err.unit = 'Unit wajib dipilih';
  if (!form.jabatan) err.jabatan = 'Jabatan wajib dipilih';
  return err;
}

const inputCls = (err?: string) =>
  `w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition ${
    err ? 'border-rose-400 focus:ring-rose-300 bg-rose-50' : 'border-slate-200 focus:ring-violet-300 focus:border-violet-400'
  }`;

const Field = ({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-700 mb-1">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-rose-600 flex items-center gap-1 mt-0.5"><AlertTriangle className="w-3 h-3" />{error}</p>}
  </div>
);

export default function ModalUser({ mode, user, roles, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormError>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity'>('info');

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && user) {
      setForm({
        nama: user.nama, username: user.username, email: user.email,
        noHp: user.noHp, roleId: user.roleId, unit: user.unit,
        jabatan: user.jabatan, avatar: user.avatar, status: user.status,
        twoFactorEnabled: user.twoFactorEnabled,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({}); setTouched({});
  }, [mode, user]);

  const setField = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    const next = { ...form, [k]: v };
    if (k === 'nama') {
      const words = String(v).trim().replace(/^(dr\.|drg\.|Ns\.|Bidan|Apt\.)\s*/i, '').split(' ');
      next.avatar = (words[0]?.[0] ?? '') + (words[1]?.[0] ?? words[0]?.[1] ?? '');
      next.avatar = next.avatar.toUpperCase();
    }
    setForm(next);
    if (touched[k]) {
      const e = validate(next);
      setErrors((prev) => ({ ...prev, [k]: e[k] }));
    }
  };

  const touch = (k: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [k]: true }));
    const e = validate(form);
    setErrors((prev) => ({ ...prev, [k]: e[k] }));
  };

  const handleSave = () => {
    const allKeys = Object.keys(EMPTY_FORM) as (keyof FormData)[];
    setTouched(Object.fromEntries(allKeys.map((k) => [k, true])));
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setTimeout(() => {
      onSave(form, mode === 'edit' ? user?.id : undefined);
      setSaving(false);
    }, 500);
  };

  const selectedRole = roles.find((r) => r.id === form.roleId);
  const isView = mode === 'view';

  const modeConfig = {
    add:  { title: 'Tambah Pengguna Baru',   icon: UserPlus, gradient: 'from-violet-700 to-indigo-700' },
    edit: { title: `Edit — ${user?.nama}`,   icon: Pencil,   gradient: 'from-amber-600 to-orange-600'  },
    view: { title: `Detail — ${user?.nama}`, icon: Eye,      gradient: 'from-slate-700 to-slate-800'   },
  };
  const cfg = modeConfig[mode];
  const ModeIcon = cfg.icon;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-pop">

        {/* Header */}
        <div className={`bg-gradient-to-r ${cfg.gradient} text-white px-6 py-5 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
              <ModeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{cfg.title}</h3>
              {mode !== 'add' && user && <p className="text-[10px] opacity-70 font-mono">{user.id} · @{user.username}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
          {[
            { id: 'info',     label: 'Informasi' },
            { id: 'security', label: 'Keamanan' },
            ...(isView ? [{ id: 'activity', label: 'Aktivitas' }] : []),
          ].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
                activeTab === t.id
                  ? 'border-violet-600 text-violet-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* ── Tab: Informasi ── */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              {/* Avatar preview + nama */}
              <div className="flex items-center gap-4 p-4 bg-violet-50 border border-violet-200 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {form.avatar || '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{form.nama || 'Nama Pengguna'}</p>
                  <p className="text-xs text-slate-500 font-mono">@{form.username || 'username'}</p>
                  {selectedRole && (
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold mt-1 ${selectedRole.warnaBg} ${selectedRole.warnaText} ${selectedRole.warnaBorder}`}>
                      <Shield className="w-3 h-3" />{selectedRole.nama}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nama Lengkap" required error={errors.nama}>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={form.nama} onChange={(e) => setField('nama', e.target.value)}
                      onBlur={() => touch('nama')} disabled={isView}
                      placeholder="cth: dr. Andi Putra, Sp.PD"
                      className={`${inputCls(errors.nama)} pl-9 ${isView ? 'bg-slate-50 cursor-default' : ''}`} />
                  </div>
                </Field>

                <Field label="Username" required error={errors.username}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                    <input value={form.username} onChange={(e) => setField('username', e.target.value.toLowerCase())}
                      onBlur={() => touch('username')} disabled={isView}
                      placeholder="cth: admin.keuangan"
                      className={`${inputCls(errors.username)} pl-8 ${isView ? 'bg-slate-50 cursor-default' : ''}`} />
                  </div>
                </Field>

                <Field label="Email Institusi" required error={errors.email}>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)}
                      onBlur={() => touch('email')} disabled={isView}
                      placeholder="nama@rsudmimika.go.id"
                      className={`${inputCls(errors.email)} pl-9 ${isView ? 'bg-slate-50 cursor-default' : ''}`} />
                  </div>
                </Field>

                <Field label="Nomor HP" required error={errors.noHp}>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={form.noHp} onChange={(e) => setField('noHp', e.target.value)}
                      onBlur={() => touch('noHp')} disabled={isView}
                      placeholder="0812-3456-7890"
                      className={`${inputCls(errors.noHp)} pl-9 ${isView ? 'bg-slate-50 cursor-default' : ''}`} />
                  </div>
                </Field>

                <Field label="Role / Hak Akses" required error={errors.roleId}>
                  <div className="relative">
                    <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={form.roleId} onChange={(e) => setField('roleId', e.target.value as RoleId)}
                      disabled={isView}
                      className={`${inputCls(errors.roleId)} pl-9 ${isView ? 'bg-slate-50 cursor-default' : ''}`}>
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                    </select>
                  </div>
                  {selectedRole && !isView && (
                    <p className="text-[10px] text-slate-500 mt-1">{selectedRole.deskripsi}</p>
                  )}
                </Field>

                <Field label="Status Akun">
                  <div className="flex gap-2">
                    {(['aktif', 'nonaktif'] as UserStatus[]).map((s) => (
                      <label key={s} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer flex-1 justify-center transition ${
                        form.status === s ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-slate-300'
                      } ${isView ? 'cursor-default' : ''}`}>
                        <input type="radio" checked={form.status === s} onChange={() => !isView && setField('status', s)} className="hidden" />
                        <span className={`text-sm font-semibold ${form.status === s ? 'text-violet-700' : 'text-slate-500'}`}>
                          {s === 'aktif' ? '✓ Aktif' : '✗ Nonaktif'}
                        </span>
                      </label>
                    ))}
                  </div>
                </Field>

                <Field label="Unit Kerja" required error={errors.unit}>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={form.unit} onChange={(e) => setField('unit', e.target.value)}
                      disabled={isView}
                      className={`${inputCls(errors.unit)} pl-9 ${isView ? 'bg-slate-50 cursor-default' : ''}`}>
                      {[...daftarUnit, 'Bagian Keuangan', 'Direksi', 'IT & Sistem Informasi', 'Inspektorat'].map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </Field>

                <Field label="Jabatan" required error={errors.jabatan}>
                  <div className="relative">
                    <IdCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={form.jabatan} onChange={(e) => setField('jabatan', e.target.value)}
                      disabled={isView}
                      className={`${inputCls(errors.jabatan)} pl-9 ${isView ? 'bg-slate-50 cursor-default' : ''}`}>
                      {[...daftarJabatan, 'Kepala Bagian Keuangan', 'Staff Keuangan Senior', 'Staff Keuangan',
                        'System Administrator', 'Direktur RSUD Mimika', 'Verifikator Keuangan', 'Auditor Internal'].map((j) => (
                        <option key={j}>{j}</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>

              {/* Permission preview dari role terpilih */}
              {selectedRole && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-700 mb-2">Hak Akses dari Role "{selectedRole.nama}" ({selectedRole.permissions.length} permission):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRole.permissions.map((p) => (
                      <span key={p} className="text-[9px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Keamanan ── */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {mode === 'add' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Password awal akan digenerate otomatis dan ditampilkan setelah user disimpan. Pengguna wajib mengganti password saat login pertama.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-violet-600" />
                      <p className="text-sm font-bold text-slate-800">Two-Factor Authentication</p>
                    </div>
                    <button onClick={() => !isView && setField('twoFactorEnabled', !form.twoFactorEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        form.twoFactorEnabled ? 'bg-violet-600' : 'bg-slate-300'
                      } ${isView ? 'cursor-default' : 'cursor-pointer'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        form.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {form.twoFactorEnabled
                      ? '✓ 2FA aktif — pengguna harus verifikasi OTP saat login'
                      : 'Nonaktif — aktifkan untuk keamanan tambahan'}
                  </p>
                </div>

                {isView && user && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Key className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-bold text-slate-800">Informasi Password</p>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      <p>Terakhir diubah: <b>{formatDateShort(user.passwordChangedAt)}</b></p>
                      <p>Status: <span className="text-emerald-600 font-semibold">Aktif</span></p>
                    </div>
                  </div>
                )}
              </div>

              {isView && user && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4 text-slate-600" />
                    <p className="text-sm font-bold text-slate-800">Info Akun</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'ID User', value: user.id },
                      { label: 'Dibuat', value: formatDateShort(user.createdAt) },
                      { label: 'Dibuat Oleh', value: user.createdBy },
                      { label: 'Total Login', value: formatNumber(user.loginCount) + 'x' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[9px] text-slate-500 uppercase font-semibold">{label}</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Aktivitas (view only) ── */}
          {activeTab === 'activity' && isView && user && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Total Login', value: formatNumber(user.loginCount) + 'x', icon: Key, color: 'text-violet-700' },
                  { label: 'Login Terakhir', value: user.lastLogin !== '-' ? formatDateShort(user.lastLogin.split(' ')[0]) : '-', icon: Clock, color: 'text-teal-700' },
                  { label: 'Status Saat Ini', value: user.isOnline ? 'Online' : 'Offline', icon: user.isOnline ? CheckCircle2 : XCircle, color: user.isOnline ? 'text-emerald-700' : 'text-slate-600' },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${s.color}`} />
                        <p className="text-[10px] text-slate-500 font-semibold uppercase">{s.label}</p>
                      </div>
                      <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                Riwayat aktivitas detail tersedia di menu <b>Activity Log</b>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isView && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <button onClick={() => { setForm(mode === 'edit' && user ? { nama: user.nama, username: user.username, email: user.email, noHp: user.noHp, roleId: user.roleId, unit: user.unit, jabatan: user.jabatan, avatar: user.avatar, status: user.status, twoFactorEnabled: user.twoFactorEnabled } : EMPTY_FORM); setErrors({}); setTouched({}); }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Form
            </button>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition ${
                  mode === 'add' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-amber-600 hover:bg-amber-700'
                } disabled:opacity-60`}>
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Menyimpan…' : mode === 'add' ? 'Simpan User' : 'Perbarui'}
              </button>
            </div>
          </div>
        )}
        {isView && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end flex-shrink-0">
            <button onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition">
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
