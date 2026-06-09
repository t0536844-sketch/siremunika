import { useState, useEffect } from 'react';
import {
  X, Shield, Save, RotateCcw, AlertTriangle, Eye, Pencil, Plus,
  CheckCircle2, XCircle, Lock,
} from 'lucide-react';
import type { Role, PermissionKey } from '../data/userManagement';
import { allPermissions, permissionGroups } from '../data/userManagement';
import { formatNumber } from '../utils/helpers';

interface Props {
  mode: 'add' | 'edit' | 'view';
  role?: Role;
  userCount: number;
  onSave: (
    data: Omit<Role, 'id' | 'createdAt' | 'userCount' | 'isSystem'>,
    editId?: string
  ) => void;
  onClose: () => void;
}

// Palet warna tersedia
const warnaOptions = [
  { warna: 'violet', warnaText: 'text-violet-700', warnaBg: 'bg-violet-100', warnaBorder: 'border-violet-200', preview: 'bg-violet-500' },
  { warna: 'teal',   warnaText: 'text-teal-700',   warnaBg: 'bg-teal-100',   warnaBorder: 'border-teal-200',   preview: 'bg-teal-500' },
  { warna: 'blue',   warnaText: 'text-blue-700',    warnaBg: 'bg-blue-100',   warnaBorder: 'border-blue-200',   preview: 'bg-blue-500' },
  { warna: 'cyan',   warnaText: 'text-cyan-700',    warnaBg: 'bg-cyan-100',   warnaBorder: 'border-cyan-200',   preview: 'bg-cyan-500' },
  { warna: 'amber',  warnaText: 'text-amber-700',   warnaBg: 'bg-amber-100',  warnaBorder: 'border-amber-200',  preview: 'bg-amber-500' },
  { warna: 'emerald',warnaText: 'text-emerald-700', warnaBg: 'bg-emerald-100',warnaBorder: 'border-emerald-200',preview: 'bg-emerald-500' },
  { warna: 'rose',   warnaText: 'text-rose-700',    warnaBg: 'bg-rose-100',   warnaBorder: 'border-rose-200',   preview: 'bg-rose-500' },
  { warna: 'slate',  warnaText: 'text-slate-600',   warnaBg: 'bg-slate-100',  warnaBorder: 'border-slate-200',  preview: 'bg-slate-500' },
];

type FormData = {
  nama: string;
  deskripsi: string;
  warna: string;
  warnaText: string;
  warnaBg: string;
  warnaBorder: string;
  permissions: PermissionKey[];
};

const EMPTY_FORM: FormData = {
  nama: '', deskripsi: '',
  warna: 'violet', warnaText: 'text-violet-700', warnaBg: 'bg-violet-100', warnaBorder: 'border-violet-200',
  permissions: [],
};

type FormError = { nama?: string; deskripsi?: string };

function validate(form: FormData): FormError {
  const err: FormError = {};
  if (!form.nama.trim() || form.nama.trim().length < 3) err.nama = 'Nama role minimal 3 karakter';
  if (!form.deskripsi.trim()) err.deskripsi = 'Deskripsi wajib diisi';
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

export default function ModalRole({ mode, role, userCount, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormError>({});
  const [saving, setSaving] = useState(false);
  const [searchPerm, setSearchPerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(permissionGroups));

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && role) {
      setForm({
        nama: role.nama, deskripsi: role.deskripsi,
        warna: role.warna, warnaText: role.warnaText,
        warnaBg: role.warnaBg, warnaBorder: role.warnaBorder,
        permissions: [...role.permissions],
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setSearchPerm('');
  }, [mode, role]);

  const isView = mode === 'view';

  // ── Permission helpers ────────────────────────────────────────
  const togglePerm = (key: PermissionKey) => {
    if (isView) return;
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const toggleGroup = (group: string) => {
    if (isView) return;
    const groupPerms = allPermissions.filter((p) => p.group === group).map((p) => p.key as PermissionKey);
    const allChecked = groupPerms.every((p) => form.permissions.includes(p));
    setForm((prev) => ({
      ...prev,
      permissions: allChecked
        ? prev.permissions.filter((p) => !groupPerms.includes(p))
        : [...new Set([...prev.permissions, ...groupPerms])],
    }));
  };

  const selectAll = () => {
    if (isView) return;
    setForm((prev) => ({ ...prev, permissions: allPermissions.map((p) => p.key as PermissionKey) }));
  };

  const clearAll = () => {
    if (isView) return;
    setForm((prev) => ({ ...prev, permissions: [] }));
  };

  const toggleGroupExpand = (group: string) => {
    setExpandedGroups((prev) => {
      const s = new Set(prev);
      s.has(group) ? s.delete(group) : s.add(group);
      return s;
    });
  };

  const filteredPerms = (group: string) => {
    return allPermissions.filter(
      (p) => p.group === group &&
        (searchPerm === '' || p.label.toLowerCase().includes(searchPerm.toLowerCase()) || p.key.toLowerCase().includes(searchPerm.toLowerCase()))
    );
  };

  const setWarna = (opt: typeof warnaOptions[0]) => {
    setForm((prev) => ({
      ...prev,
      warna: opt.warna, warnaText: opt.warnaText,
      warnaBg: opt.warnaBg, warnaBorder: opt.warnaBorder,
    }));
  };

  const handleSave = () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    setTimeout(() => {
      onSave(form, mode === 'edit' ? role?.id : undefined);
      setSaving(false);
    }, 400);
  };

  const modeConfig = {
    add:  { title: 'Buat Role Baru',    icon: Plus,   gradient: 'from-violet-700 to-indigo-700' },
    edit: { title: `Edit Role`,         icon: Pencil, gradient: 'from-amber-600 to-orange-600'  },
    view: { title: `Detail Role`,       icon: Eye,    gradient: 'from-slate-700 to-slate-800'   },
  };
  const cfg = modeConfig[mode];
  const ModeIcon = cfg.icon;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-pop">

        {/* Header */}
        <div className={`bg-gradient-to-r ${cfg.gradient} text-white px-6 py-5 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
              <ModeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{cfg.title}{mode !== 'add' && role ? ` — ${role.nama}` : ''}</h3>
              {mode !== 'add' && (
                <p className="text-[10px] opacity-70">{formatNumber(userCount)} pengguna menggunakan role ini</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Body: 2 kolom */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Kiri: Info role */}
          <div className="w-72 flex-shrink-0 border-r border-slate-200 flex flex-col overflow-y-auto">
            <div className="p-5 space-y-4">
              <Field label="Nama Role" required error={errors.nama}>
                <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  disabled={isView} placeholder="cth: Admin Keuangan"
                  className={`${inputCls(errors.nama)} ${isView ? 'bg-slate-50' : ''}`} />
              </Field>

              <Field label="Deskripsi" required error={errors.deskripsi}>
                <textarea value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  disabled={isView} rows={3} placeholder="Deskripsi singkat hak akses role ini…"
                  className={`${inputCls(errors.deskripsi)} resize-none ${isView ? 'bg-slate-50' : ''}`} />
              </Field>

              {/* Pilih warna */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Warna Badge</label>
                <div className="flex flex-wrap gap-2">
                  {warnaOptions.map((opt) => (
                    <button key={opt.warna} onClick={() => !isView && setWarna(opt)} disabled={isView}
                      title={opt.warna}
                      className={`w-7 h-7 rounded-full ${opt.preview} transition-all ${
                        form.warna === opt.warna ? 'ring-2 ring-offset-2 ring-slate-600 scale-110' : 'opacity-70 hover:opacity-100'
                      } ${isView ? 'cursor-default' : ''}`} />
                  ))}
                </div>
              </div>

              {/* Preview badge */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 mb-2 font-semibold">PREVIEW BADGE</p>
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-bold ${form.warnaBg} ${form.warnaText} ${form.warnaBorder}`}>
                  <Shield className="w-3.5 h-3.5" />
                  {form.nama || 'Nama Role'}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-violet-600 font-semibold uppercase">Permission</p>
                  <p className="text-xl font-bold text-violet-700">{form.permissions.length}</p>
                  <p className="text-[9px] text-violet-500">dari {allPermissions.length}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-slate-500 font-semibold uppercase">User</p>
                  <p className="text-xl font-bold text-slate-700">{formatNumber(userCount)}</p>
                  <p className="text-[9px] text-slate-400">pengguna aktif</p>
                </div>
              </div>

              {role?.isSystem && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800">Role sistem — beberapa field dikunci untuk stabilitas aplikasi</p>
                </div>
              )}
            </div>
          </div>

          {/* Kanan: Permission picker */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Toolbar permission */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg flex-1">
                <Lock className="w-4 h-4 text-slate-400" />
                <input value={searchPerm} onChange={(e) => setSearchPerm(e.target.value)}
                  placeholder="Cari permission…"
                  className="bg-transparent text-sm focus:outline-none w-full" />
              </div>
              {!isView && (
                <>
                  <button onClick={selectAll}
                    className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition whitespace-nowrap">
                    ✓ Pilih Semua
                  </button>
                  <button onClick={clearAll}
                    className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition whitespace-nowrap">
                    ✗ Hapus Semua
                  </button>
                </>
              )}
            </div>

            {/* Permission groups */}
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {permissionGroups.map((group) => {
                const groupPerms = allPermissions.filter((p) => p.group === group);
                const filtPerms = filteredPerms(group);
                if (filtPerms.length === 0 && searchPerm) return null;
                const checkedCount = groupPerms.filter((p) => form.permissions.includes(p.key as PermissionKey)).length;
                const allChecked = checkedCount === groupPerms.length;
                const someChecked = checkedCount > 0 && !allChecked;
                const isExpanded = expandedGroups.has(group);

                return (
                  <div key={group} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    {/* Group header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition"
                      onClick={() => toggleGroupExpand(group)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Group checkbox */}
                        <button onClick={(e) => { e.stopPropagation(); toggleGroup(group); }} disabled={isView}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition flex-shrink-0 ${
                            allChecked ? 'bg-violet-600 border-violet-600' : someChecked ? 'bg-violet-200 border-violet-400' : 'border-slate-300 hover:border-violet-400'
                          } ${isView ? 'cursor-default' : ''}`}>
                          {allChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                          {someChecked && <span className="w-2 h-2 bg-violet-600 rounded-sm" />}
                        </button>
                        <span className="text-sm font-bold text-slate-800">{group}</span>
                        <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">
                          {checkedCount}/{groupPerms.length}
                        </span>
                      </div>
                      <span className="text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    {/* Permission list */}
                    {isExpanded && (
                      <div className="divide-y divide-slate-100">
                        {(searchPerm ? filtPerms : groupPerms).map((perm) => {
                          const isChecked = form.permissions.includes(perm.key as PermissionKey);
                          return (
                            <label key={perm.key}
                              className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition ${isView ? 'cursor-default' : 'cursor-pointer'}`}>
                              <div onClick={() => togglePerm(perm.key as PermissionKey)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                                  isChecked ? 'bg-violet-600 border-violet-600' : 'border-slate-300 hover:border-violet-400'
                                }`}>
                                {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800">{perm.label}</p>
                                <p className="text-[10px] text-slate-400">{perm.description}</p>
                              </div>
                              <span className="text-[9px] font-mono text-slate-400 hidden sm:block">{perm.key}</span>
                              {isChecked
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                : <XCircle className="w-4 h-4 text-slate-200 flex-shrink-0" />}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        {!isView && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => { setForm(mode === 'edit' && role ? { nama: role.nama, deskripsi: role.deskripsi, warna: role.warna, warnaText: role.warnaText, warnaBg: role.warnaBg, warnaBorder: role.warnaBorder, permissions: [...role.permissions] } : EMPTY_FORM); setErrors({}); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <p className="text-xs text-slate-500">
                <b className="text-violet-700">{form.permissions.length}</b> permission dipilih
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition ${
                  mode === 'add' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-amber-600 hover:bg-amber-700'
                } disabled:opacity-60`}>
                {saving
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Save className="w-4 h-4" />}
                {saving ? 'Menyimpan…' : mode === 'add' ? 'Buat Role' : 'Perbarui Role'}
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
