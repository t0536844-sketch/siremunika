import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Phone,
  Mail,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  TrendingUp,
  Award,
  Building2,
  GraduationCap,
  IdCard,
  FileBarChart2,
  Printer,
  FileSpreadsheet,
  FileText as FileTextIcon,
  Pencil,
  Trash2,
  Save,
  X,
  UserPlus,
  AlertTriangle,
  RotateCcw,
  Hash,
  User,
} from 'lucide-react';
import { dataNakes, daftarUnit, daftarJabatan } from '../data/mockData';
import dataService from '../data/dataService';
import { formatRupiah, formatNumber, formatDateShort } from '../utils/helpers';
import { exportToExcel, exportToPDF, printPage } from '../utils/exporters';
import { useApp } from '../context/AppContext';
import type { Nakes } from '../data/mockData';

// ─── Tipe form ────────────────────────────────────────────────────────────────
type FormNakes = Omit<Nakes, 'id'>;
type FormError = Partial<Record<keyof FormNakes, string>>;

const EMPTY_FORM: FormNakes = {
  nip: '',
  nama: '',
  jabatan: daftarJabatan[0],
  unit: daftarUnit[0],
  noStr: '',
  noSip: '',
  tanggalLahir: '',
  tanggalMasuk: '',
  pendidikan: '',
  noHp: '',
  email: '',
  statusAktif: true,
  jasaPerTindakan: 0,
  totalTindakan: 0,
  totalJasa: 0,
  rating: 4.5,
};

// ─── Validator ────────────────────────────────────────────────────────────────
function validateForm(form: FormNakes): FormError {
  const err: FormError = {};
  const nip = form.nip ?? '';
  const nama = form.nama ?? '';
  const noStr = form.noStr ?? '';
  const noHp = form.noHp ?? '';
  const pendidikan = form.pendidikan ?? '';
  const email = form.email ?? '';
  if (!nip.trim()) err.nip = 'NIP wajib diisi';
  else if (!/^\d{18}$/.test(nip.trim())) err.nip = 'NIP harus 18 digit angka';
  if (!nama.trim()) err.nama = 'Nama lengkap wajib diisi';
  else if (nama.trim().length < 4) err.nama = 'Nama minimal 4 karakter';
  if (!form.jabatan) err.jabatan = 'Jabatan wajib dipilih';
  if (!form.unit) err.unit = 'Unit wajib dipilih';
  if (!noStr.trim()) err.noStr = 'No. STR wajib diisi';
  if (!form.tanggalLahir) err.tanggalLahir = 'Tanggal lahir wajib diisi';
  if (!form.tanggalMasuk) err.tanggalMasuk = 'Tanggal masuk wajib diisi';
  if (!pendidikan.trim()) err.pendidikan = 'Pendidikan wajib diisi';
  if (!noHp.trim()) err.noHp = 'Nomor HP wajib diisi';
  else if (!/^0\d{9,12}$/.test(noHp.replace(/[-\s]/g, '')))
    err.noHp = 'Format HP tidak valid (contoh: 08123456789)';
  if (!email.trim()) err.email = 'Email wajib diisi';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    err.email = 'Format email tidak valid';
  if (form.jasaPerTindakan <= 0) err.jasaPerTindakan = 'Tarif jasa harus lebih dari 0';
  if (form.rating < 1 || form.rating > 5) err.rating = 'Rating harus antara 1 – 5';
  return err;
}

// ─── Helper komponen ──────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-rose-600 flex items-center gap-1 mt-0.5">
      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
      {msg}
    </p>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition ${
    err
      ? 'border-rose-400 focus:ring-rose-300 bg-rose-50'
      : 'border-slate-200 focus:ring-rose-300 focus:border-rose-400'
  }`;

// ─── Komponen Utama ───────────────────────────────────────────────────────────
export default function ProfilNakes() {
  const { showToast } = useApp();

  // Data
  const [items, setItems] = useState<Nakes[]>([]);
  useEffect(() => {
    dataService.getNakes().then((data) => {
      if (data && data.length > 0) setItems(data);
    }).catch(() => { setItems(dataNakes); });
  }, []);

  // Filters
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [filterJabatan, setFilterJabatan] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // UI state
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Mode: null = tidak ada modal, 'view' | 'add' | 'edit' | 'delete'
  const [mode, setMode] = useState<'view' | 'add' | 'edit' | 'delete' | null>(null);
  const [activeNakes, setActiveNakes] = useState<Nakes | null>(null);

  // Form
  const [form, setForm] = useState<FormNakes>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormError>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormNakes, boolean>>>({});
  const [saving, setSaving] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      items.filter(
        (n) =>
          (filterUnit === 'Semua' || n.unit === filterUnit) &&
          (filterJabatan === 'Semua' || n.jabatan === filterJabatan) &&
          (filterStatus === 'Semua' ||
            (filterStatus === 'Aktif' ? n.statusAktif : !n.statusAktif)) &&
          ((n.nama || '').toLowerCase().includes(search.toLowerCase()) ||
            (n.nip || '').includes(search) ||
            (n.unit || '').toLowerCase().includes(search.toLowerCase()) ||
            (n.email || '').toLowerCase().includes(search.toLowerCase()))
      ),
    [items, search, filterUnit, filterJabatan, filterStatus]
  );

  const stats = useMemo(
    () => ({
      total: items.length,
      aktif: items.filter((n) => n.statusAktif).length,
      nonaktif: items.filter((n) => !n.statusAktif).length,
      totalJasa: items.reduce((s, n) => s + (n.totalJasa || 0), 0),
      avgRating: items.length ? items.reduce((s, n) => s + (n.rating || 0), 0) / items.length : 0,
    }),
    [items]
  );

  // ── Form helpers ─────────────────────────────────────────────────────────────
  const setField = <K extends keyof FormNakes>(key: K, val: FormNakes[K]) => {
    const next = { ...form, [key]: val };
    setForm(next);
    if (touched[key]) {
      const e = validateForm(next);
      setErrors((prev) => ({ ...prev, [key]: e[key] }));
    }
  };

  const touch = (key: keyof FormNakes) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const e = validateForm(form);
    setErrors((prev) => ({ ...prev, [key]: e[key] }));
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setTouched({});
    setActiveNakes(null);
    setMode('add');
  };

  const openEdit = (n: Nakes) => {
    const { id, ...rest } = n;
    // Sanitize null values from Supabase to empty strings for form
    const sanitized: FormNakes = {} as FormNakes;
    for (const [k, v] of Object.entries(rest)) {
      sanitized[k as keyof FormNakes] = (v === null || v === undefined ? (typeof EMPTY_FORM[k as keyof FormNakes] === 'string' ? '' : 0) : v) as any;
    }
    setForm(sanitized);
    setErrors({});
    setTouched({});
    setActiveNakes(n);
    setMode('edit');
  };

  const openView = (n: Nakes) => {
    setActiveNakes(n);
    setMode('view');
  };

  const openDelete = (n: Nakes) => {
    setActiveNakes(n);
    setMode('delete');
  };

  const closeModal = () => {
    setMode(null);
    setActiveNakes(null);
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Touch semua field
    const allKeys = Object.keys(EMPTY_FORM) as (keyof FormNakes)[];
    setTouched(Object.fromEntries(allKeys.map((k) => [k, true])));
    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast('error', 'Data belum valid', 'Periksa kembali isian yang ditandai merah');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'add') {
        const newId = `NKS-${String(items.length + 1).padStart(3, '0')}`;
        const newNakes: Nakes = { id: newId, ...form };
        setItems([newNakes, ...items]);
        const savedItem = {
          nip: form.nip,
          nama: form.nama,
          jabatan: form.jabatan,
          unit: form.unit,
          noStr: form.noStr,
          noSip: form.noSip,
          tanggalLahir: form.tanggalLahir,
          tanggalMasuk: form.tanggalMasuk,
          pendidikan: form.pendidikan,
          noHp: form.noHp,
          email: form.email,
          statusAktif: form.statusAktif,
          jasaPerTindakan: form.jasaPerTindakan,
          totalTindakan: form.totalTindakan,
          totalJasa: form.jasaPerTindakan * form.totalTindakan,
          rating: form.rating,
        };
        await dataService.saveNakes(savedItem);
        showToast('success', 'saved to database', `${form.nama} telah terdaftar (${newId})`);
      } else if (mode === 'edit' && activeNakes) {
        setItems(items.map((n) => (n.id === activeNakes.id ? { id: n.id, ...form, totalJasa: form.jasaPerTindakan * form.totalTindakan } : n)));
        const savedItem = {
          id: activeNakes.id,
          nip: form.nip,
          nama: form.nama,
          jabatan: form.jabatan,
          unit: form.unit,
          noStr: form.noStr,
          noSip: form.noSip,
          tanggalLahir: form.tanggalLahir,
          tanggalMasuk: form.tanggalMasuk,
          pendidikan: form.pendidikan,
          noHp: form.noHp,
          email: form.email,
          statusAktif: form.statusAktif,
          jasaPerTindakan: form.jasaPerTindakan,
          totalTindakan: form.totalTindakan,
          totalJasa: form.jasaPerTindakan * form.totalTindakan,
          rating: form.rating,
        };
        await dataService.saveNakes(savedItem);
        showToast('success', 'saved to database', `Profil ${form.nama} telah disimpan`);
      }
    } catch {
      showToast('warning', 'saved locally, failed to save to database', 'Data tersimpan lokal, sync saat online');
    }
    setSaving(false);
    closeModal();
  };

  const handleDelete = async () => {
    if (!activeNakes) return;
    setSaving(true);
    try {
      setItems(items.filter((n) => n.id !== activeNakes.id));
      await dataService.deleteNakes(activeNakes.id);
      showToast('success', 'Nakes dihapus', `${activeNakes.nama} telah dihapus dari sistem`);
    } catch {
      showToast('warning', 'deleted locally only', 'Data tersimpan lokal, sync saat online');
    }
    setSaving(false);
    closeModal();
  };

  const handleToggleStatus = async (id: string) => {
    const n = items.find((n) => n.id === id);
    if (!n) return;
    setItems(items.map((n) => (n.id === id ? { ...n, statusAktif: !n.statusAktif } : n)));
    try {
      await dataService.toggleNakesStatus(id);
      showToast(
        'success',
        n.statusAktif ? 'Status diubah menjadi Nonaktif' : 'Status diubah menjadi Aktif',
        n.nama
      );
    } catch {
      showToast('warning', 'updated locally only', 'Data tersimpan lokal, sync saat online');
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    exportToExcel(
      'Data_Nakes',
      'Nakes',
      [
        { header: 'ID', key: 'id', width: 12 },
        { header: 'NIP', key: 'nip', width: 22 },
        { header: 'Nama', key: 'nama', width: 32 },
        { header: 'Jabatan', key: 'jabatan', width: 24 },
        { header: 'Unit', key: 'unit', width: 22 },
        { header: 'No. STR', key: 'noStr', width: 18 },
        { header: 'No. SIP', key: 'noSip', width: 18 },
        { header: 'Pendidikan', key: 'pendidikan', width: 22 },
        { header: 'Tgl Lahir', key: 'tanggalLahir', format: 'date' as const, width: 14 },
        { header: 'Tgl Masuk', key: 'tanggalMasuk', format: 'date' as const, width: 14 },
        { header: 'No. HP', key: 'noHp', width: 16 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Jasa/Tindakan', key: 'jasaPerTindakan', format: 'currency' as const, width: 18 },
        { header: 'Total Tindakan', key: 'totalTindakan', format: 'number' as const, width: 14 },
        { header: 'Total Jasa', key: 'totalJasa', format: 'currency' as const, width: 20 },
        { header: 'Rating', key: 'rating', format: 'number' as const, width: 10 },
        { header: 'Status', key: 'statusAktif', width: 12 },
      ],
      filtered.map((n) => ({ ...n, statusAktif: n.statusAktif ? 'Aktif' : 'Nonaktif' })),
      { title: 'DATA TENAGA KESEHATAN RSUD MIMIKA', subtitle: `${filtered.length} nakes terdaftar` }
    );
    showToast('success', 'Export Excel berhasil', `${filtered.length} data diekspor`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    exportToPDF(
      'Data_Nakes',
      'Daftar Tenaga Kesehatan RSUD Mimika',
      [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nama', key: 'nama', width: 28 },
        { header: 'Jabatan', key: 'jabatan', width: 22 },
        { header: 'Unit', key: 'unit', width: 20 },
        { header: 'No. HP', key: 'noHp', width: 14 },
        { header: 'Total Jasa', key: 'totalJasa', format: 'currency' as const, width: 20 },
        { header: 'Rating', key: 'rating', format: 'number' as const, width: 8 },
        { header: 'Status', key: 'statusAktif', width: 10 },
      ],
      filtered.map((n) => ({ ...n, statusAktif: n.statusAktif ? 'Aktif' : 'Nonaktif' })),
      { subtitle: `${filtered.length} nakes terdaftar` }
    );
    showToast('success', 'Export PDF berhasil');
    setShowExportMenu(false);
  };

  // ── Render bintang ────────────────────────────────────────────────────────────
  const renderStars = (rating: number | null, interactive = false, onChange?: (v: number) => void) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          onClick={() => interactive && onChange?.(n)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : ''} w-3.5 h-3.5 transition-transform ${
            n <= Math.floor(rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-slate-600 font-semibold">{(rating ?? 0).toFixed(1)}</span>
    </div>
  );

  // ── Warna avatar ──────────────────────────────────────────────────────────────
  const avatarColors = [
    'from-rose-400 to-pink-500',
    'from-teal-400 to-cyan-500',
    'from-amber-400 to-orange-500',
    'from-violet-400 to-purple-500',
    'from-sky-400 to-blue-500',
    'from-emerald-400 to-green-500',
  ];
  const getAvatarColor = (id: string) =>
    avatarColors[parseInt((id || '0').replace(/\D/g, ''), 10) % avatarColors.length];

  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 space-y-5 bg-slate-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Profil Tenaga Kesehatan</h2>
              <p className="text-rose-100 text-sm mt-1 max-w-xl">
                Master data nakes RSUD Mimika — tambah, edit, dan kelola profil, kualifikasi, serta riwayat remunerasi
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> {stats.aktif} Aktif
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-semibold">
              <XCircle className="w-4 h-4" /> {stats.nonaktif} Nonaktif
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-semibold">
              <TrendingUp className="w-4 h-4" /> {formatRupiah(stats.totalJasa)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Nakes', value: formatNumber(stats.total), color: 'text-slate-800', icon: User },
          { label: 'Aktif', value: formatNumber(stats.aktif), color: 'text-emerald-700', icon: CheckCircle2 },
          { label: 'Total Jasa', value: formatRupiah(stats.totalJasa), color: 'text-teal-700', icon: TrendingUp },
          { label: 'Rata-rata Rating', value: stats.avgRating.toFixed(1), color: 'text-amber-600', icon: Star },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <Icon className={`w-4 h-4 ${s.color} opacity-60`} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar: filters + actions ── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center gap-3">
        {/* Unit */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)} className="bg-transparent text-sm focus:outline-none min-w-[130px]">
            <option>Semua</option>
            {daftarUnit.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        {/* Jabatan */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterJabatan} onChange={(e) => setFilterJabatan(e.target.value)} className="bg-transparent text-sm focus:outline-none min-w-[180px]">
            <option>Semua</option>
            {daftarJabatan.map((j) => <option key={j}>{j}</option>)}
          </select>
        </div>
        {/* Status */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent text-sm focus:outline-none min-w-[100px]">
            <option>Semua</option>
            <option>Aktif</option>
            <option>Nonaktif</option>
          </select>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, NIP, unit, email…" className="bg-transparent text-sm focus:outline-none w-full" />
          {search && <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-700"><X className="w-3 h-3" /></button>}
        </div>
        {/* Export dropdown */}
        <div className="relative">
          <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100">
            <FileSpreadsheet className="w-4 h-4" /> Export
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-20 min-w-[180px]">
                <button onClick={handleExportExcel} className="w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
                </button>
                <button onClick={handleExportPDF} className="w-full px-4 py-2 text-left text-sm hover:bg-rose-50 text-slate-700 hover:text-rose-700 flex items-center gap-2">
                  <FileTextIcon className="w-4 h-4 text-rose-600" /> Export PDF
                </button>
                <button onClick={() => { showToast('info', 'Menyiapkan cetak…'); setTimeout(printPage, 200); setShowExportMenu(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2 border-t border-slate-100">
                  <Printer className="w-4 h-4 text-slate-500" /> Cetak
                </button>
              </div>
            </>
          )}
        </div>
        {/* Tambah */}
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all hover:shadow-md">
          <UserPlus className="w-4 h-4" /> Tambah Nakes
        </button>
      </div>

      {/* ── Tabel data ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <th className="px-5 py-3 text-left font-semibold">Nakes</th>
                <th className="px-5 py-3 text-left font-semibold">Jabatan & Unit</th>
                <th className="px-5 py-3 text-left font-semibold">Kontak</th>
                <th className="px-5 py-3 text-left font-semibold">Lisensi</th>
                <th className="px-5 py-3 text-right font-semibold">Jasa/Tindakan</th>
                <th className="px-5 py-3 text-right font-semibold">Total Jasa</th>
                <th className="px-5 py-3 text-center font-semibold">Rating</th>
                <th className="px-5 py-3 text-center font-semibold">Status</th>
                <th className="px-5 py-3 text-center font-semibold w-[140px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id} className="border-b border-slate-100 hover:bg-rose-50/30 transition-colors group">
                  {/* Avatar + nama */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(n.id)} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
                        {(n.nama || '??').replace(/^(dr\.|drg\.|Ns\.|Bidan|Apt\.)\s*/i, '').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{n.nama}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{n.nip}</p>
                      </div>
                    </div>
                  </td>
                  {/* Jabatan */}
                  <td className="px-5 py-3">
                    <p className="text-xs font-medium text-slate-700">{n.jabatan}</p>
                    <p className="text-[10px] text-slate-500">{n.unit}</p>
                  </td>
                  {/* Kontak */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{n.noHp}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[120px]">{n.email}</span>
                    </div>
                  </td>
                  {/* Lisensi */}
                  <td className="px-5 py-3">
                    <p className="text-[10px] text-slate-500">STR: <span className="text-slate-700 font-medium">{n.noStr}</span></p>
                    <p className="text-[10px] text-slate-500">SIP: <span className="text-slate-700 font-medium">{n.noSip}</span></p>
                  </td>
                  {/* Jasa/tindakan */}
                  <td className="px-5 py-3 text-right">
                    <p className="text-xs text-slate-700 font-medium">{formatRupiah(n.jasaPerTindakan)}</p>
                    <p className="text-[10px] text-slate-400">{formatNumber(n.totalTindakan)} tindakan</p>
                  </td>
                  {/* Total jasa */}
                  <td className="px-5 py-3 text-right font-bold text-rose-700">{formatRupiah(n.totalJasa)}</td>
                  {/* Rating */}
                  <td className="px-5 py-3">{renderStars(n.rating)}</td>
                  {/* Status */}
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => handleToggleStatus(n.id)} title={n.statusAktif ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'} className="focus:outline-none">
                      {n.statusAktif ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-200 transition">
                          <CheckCircle2 className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-semibold hover:bg-slate-200 transition">
                          <XCircle className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </button>
                  </td>
                  {/* Aksi */}
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openView(n)} title="Detail" className="p-1.5 hover:bg-sky-100 hover:text-sky-700 text-slate-500 rounded-lg transition">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(n)} title="Edit" className="p-1.5 hover:bg-amber-100 hover:text-amber-700 text-slate-500 rounded-lg transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDelete(n)} title="Hapus" className="p-1.5 hover:bg-rose-100 hover:text-rose-700 text-slate-500 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <User className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                    <p className="text-slate-500 font-semibold">Tidak ada data nakes</p>
                    <p className="text-slate-400 text-xs mt-1">Coba ubah filter atau tambah nakes baru</p>
                    <button onClick={openAdd} className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg">
                      + Tambah Nakes
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Footer tabel */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan <b className="text-slate-700">{filtered.length}</b> dari <b className="text-slate-700">{items.length}</b> nakes</span>
          <span>Total Jasa: <b className="text-rose-700">{formatRupiah(filtered.reduce((s, n) => s + (n.totalJasa || 0), 0))}</b></span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: DETAIL VIEW
      ═══════════════════════════════════════════════════════════════════════ */}
      {mode === 'view' && activeNakes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-pop">
            {/* Header */}
            <div className={`bg-gradient-to-r from-rose-700 to-pink-700 text-white px-6 py-6 flex items-start gap-4`}>
              <div className={`w-20 h-20 bg-gradient-to-br ${getAvatarColor(activeNakes.id)} rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 border-2 border-white/30`}>
                {(activeNakes.nama || '??').replace(/^(dr\.|drg\.|Ns\.|Bidan|Apt\.)\s*/i, '').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-xl leading-tight">{activeNakes.nama}</h3>
                <p className="text-rose-100 text-sm mt-1">{activeNakes.jabatan} · {activeNakes.unit}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-[10px] bg-white/20 rounded-full px-2.5 py-1 font-mono">{activeNakes.id}</span>
                  <span className="text-[10px] bg-white/20 rounded-full px-2.5 py-1">NIP: {activeNakes.nip}</span>
                  <span className={`text-[10px] ${activeNakes.statusAktif ? 'bg-emerald-500/40' : 'bg-slate-400/40'} rounded-full px-2.5 py-1 font-semibold`}>
                    {activeNakes.statusAktif ? '● Aktif' : '○ Nonaktif'}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className="text-white/70 hover:text-white p-1 flex-shrink-0 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Kinerja */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Jasa/Tindakan', value: formatRupiah(activeNakes.jasaPerTindakan), color: 'teal' },
                  { label: 'Total Tindakan', value: formatNumber(activeNakes.totalTindakan), color: 'amber' },
                  { label: 'Total Jasa', value: formatRupiah(activeNakes.totalJasa), color: 'rose' },
                ].map((c) => (
                  <div key={c.label} className={`bg-${c.color}-50 rounded-xl p-4 border border-${c.color}-200 text-center`}>
                    <p className={`text-[10px] text-${c.color}-700 font-semibold mb-1 uppercase tracking-wide`}>{c.label}</p>
                    <p className={`text-base font-bold text-${c.color}-800`}>{c.value}</p>
                  </div>
                ))}
              </div>

              {/* Rating bintang */}
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Rating Kinerja</p>
                  <div className="mt-0.5">{renderStars(activeNakes.rating)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Data kepegawaian */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-rose-600" /> Data Kepegawaian
                  </h4>
                  <dl className="space-y-2 text-xs">
                    {[
                      ['Nomor STR', activeNakes.noStr],
                      ['Nomor SIP', activeNakes.noSip],
                      ['Tanggal Lahir', formatDateShort(activeNakes.tanggalLahir)],
                      ['Tanggal Masuk', formatDateShort(activeNakes.tanggalMasuk)],
                      ['Pendidikan', activeNakes.pendidikan],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 py-1.5 border-b border-slate-100">
                        <dt className="text-slate-500 flex-shrink-0">{k}</dt>
                        <dd className="font-semibold text-slate-800 text-right">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {/* Kontak */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-teal-600" /> Informasi Kontak
                  </h4>
                  <dl className="space-y-2 text-xs">
                    {[
                      ['Nomor HP', activeNakes.noHp, Phone],
                      ['Email', activeNakes.email, Mail],
                      ['Unit Kerja', activeNakes.unit, Building2],
                      ['Pendidikan', activeNakes.pendidikan, GraduationCap],
                    ].map(([k, v, Icon]: any) => (
                      <div key={k} className="flex items-start gap-2 py-1.5 border-b border-slate-100">
                        <Icon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-500 text-[10px]">{k}</p>
                          <p className="font-semibold text-slate-800 break-all">{v}</p>
                        </div>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {/* Grafik mini riwayat */}
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-teal-800 mb-3 flex items-center gap-2">
                  <FileBarChart2 className="w-4 h-4" /> Estimasi Riwayat Jasa 6 Bulan Terakhir
                </h4>
                <div className="grid grid-cols-6 gap-2">
                  {['Ags', 'Sep', 'Okt', 'Nov', 'Des', 'Jan'].map((bln, i) => {
                    const pct = 35 + i * 12;
                    const est = (activeNakes.totalJasa / 6) * (0.7 + i * 0.08);
                    return (
                      <div key={bln} className="text-center">
                        <p className="text-[10px] text-teal-700 font-semibold mb-1">{bln}</p>
                        <div className="h-20 bg-white rounded-lg flex items-end p-1 border border-teal-100 overflow-hidden">
                          <div className="w-full bg-gradient-to-t from-teal-500 to-teal-300 rounded-t transition-all" style={{ height: `${pct}%` }} />
                        </div>
                        <p className="text-[9px] text-slate-500 mt-1">{(est / 1_000_000).toFixed(0)} Jt</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition">
                Tutup
              </button>
              <div className="flex gap-2">
                <button onClick={() => { closeModal(); openEdit(activeNakes); }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => {
                    showToast('success', 'Rekap data dicetak', `Rekap ${activeNakes.nama} sedang disiapkan`);
                    setTimeout(printPage, 200);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition"
                >
                  <Printer className="w-4 h-4" /> Cetak Rekap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: TAMBAH / EDIT (form lengkap)
      ═══════════════════════════════════════════════════════════════════════ */}
      {(mode === 'add' || mode === 'edit') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-pop">
            {/* Header modal */}
            <div className={`${mode === 'add' ? 'bg-gradient-to-r from-rose-700 to-pink-700' : 'bg-gradient-to-r from-amber-600 to-orange-600'} text-white px-6 py-5 flex items-center justify-between flex-shrink-0`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {mode === 'add' ? <UserPlus className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{mode === 'add' ? 'Tambah Tenaga Kesehatan' : `Edit Profil – ${activeNakes?.nama}`}</h3>
                  <p className="text-xs opacity-80">{mode === 'add' ? 'Isi data lengkap nakes baru' : `ID: ${activeNakes?.id}`}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-white/70 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body form */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="space-y-6">

                {/* ── Bagian 1: Identitas ── */}
                <section>
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Hash className="w-4 h-4 text-rose-500" /> Identitas & Kepegawaian
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="NIP" required error={errors.nip}>
                      <input
                        value={form.nip}
                        onChange={(e) => setField('nip', e.target.value)}
                        onBlur={() => touch('nip')}
                        placeholder="18 digit angka, cth: 198501012010011001"
                        maxLength={18}
                        className={inputCls(errors.nip)}
                      />
                    </FormField>
                    <FormField label="Nama Lengkap (beserta gelar)" required error={errors.nama}>
                      <input
                        value={form.nama}
                        onChange={(e) => setField('nama', e.target.value)}
                        onBlur={() => touch('nama')}
                        placeholder="cth: dr. Andi Putra, Sp.PD"
                        className={inputCls(errors.nama)}
                      />
                    </FormField>
                    <FormField label="Jabatan" required error={errors.jabatan}>
                      <select value={form.jabatan} onChange={(e) => setField('jabatan', e.target.value)} onBlur={() => touch('jabatan')} className={inputCls(errors.jabatan)}>
                        {daftarJabatan.map((j) => <option key={j}>{j}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Unit Kerja" required error={errors.unit}>
                      <select value={form.unit} onChange={(e) => setField('unit', e.target.value)} onBlur={() => touch('unit')} className={inputCls(errors.unit)}>
                        {daftarUnit.map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Tanggal Lahir" required error={errors.tanggalLahir}>
                      <input type="date" value={form.tanggalLahir} onChange={(e) => setField('tanggalLahir', e.target.value)} onBlur={() => touch('tanggalLahir')} className={inputCls(errors.tanggalLahir)} />
                    </FormField>
                    <FormField label="Tanggal Masuk / TMT" required error={errors.tanggalMasuk}>
                      <input type="date" value={form.tanggalMasuk} onChange={(e) => setField('tanggalMasuk', e.target.value)} onBlur={() => touch('tanggalMasuk')} className={inputCls(errors.tanggalMasuk)} />
                    </FormField>
                    <FormField label="Pendidikan Terakhir" required error={errors.pendidikan}>
                      <input value={form.pendidikan} onChange={(e) => setField('pendidikan', e.target.value)} onBlur={() => touch('pendidikan')} placeholder="cth: Spesialis Penyakit Dalam" className={inputCls(errors.pendidikan)} />
                    </FormField>
                    {/* Status */}
                    <FormField label="Status Kepegawaian">
                      <div className="flex gap-3 pt-1">
                        {[{ val: true, label: 'Aktif', color: 'emerald' }, { val: false, label: 'Nonaktif', color: 'slate' }].map((opt) => (
                          <label key={String(opt.val)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer flex-1 justify-center transition ${form.statusAktif === opt.val ? `border-${opt.color}-400 bg-${opt.color}-50` : 'border-slate-200 hover:border-slate-300'}`}>
                            <input type="radio" checked={form.statusAktif === opt.val} onChange={() => setField('statusAktif', opt.val)} className="hidden" />
                            <span className={`text-sm font-semibold ${form.statusAktif === opt.val ? `text-${opt.color}-700` : 'text-slate-500'}`}>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </FormField>
                  </div>
                </section>

                {/* ── Bagian 2: Lisensi ── */}
                <section>
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 pb-2 border-b border-slate-200">
                    <IdCard className="w-4 h-4 text-rose-500" /> Lisensi & Sertifikasi
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Nomor STR" required error={errors.noStr}>
                      <input value={form.noStr} onChange={(e) => setField('noStr', e.target.value)} onBlur={() => touch('noStr')} placeholder="cth: STR-001/2024" className={inputCls(errors.noStr)} />
                    </FormField>
                    <FormField label="Nomor SIP">
                      <input value={form.noSip} onChange={(e) => setField('noSip', e.target.value)} placeholder="cth: SIP-001/2024/RSUD (opsional)" className={inputCls()} />
                    </FormField>
                  </div>
                </section>

                {/* ── Bagian 3: Kontak ── */}
                <section>
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Phone className="w-4 h-4 text-rose-500" /> Informasi Kontak
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Nomor HP" required error={errors.noHp}>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={form.noHp} onChange={(e) => setField('noHp', e.target.value)} onBlur={() => touch('noHp')} placeholder="0812-3456-7890" className={`${inputCls(errors.noHp)} pl-9`} />
                      </div>
                    </FormField>
                    <FormField label="Email Institusi" required error={errors.email}>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} onBlur={() => touch('email')} placeholder="nama@rsudmimika.go.id" className={`${inputCls(errors.email)} pl-9`} />
                      </div>
                    </FormField>
                  </div>
                </section>

                {/* ── Bagian 4: Remunerasi ── */}
                <section>
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 pb-2 border-b border-slate-200">
                    <TrendingUp className="w-4 h-4 text-rose-500" /> Data Remunerasi
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Tarif Jasa per Tindakan (Rp)" required error={errors.jasaPerTindakan}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rp</span>
                        <input type="number" value={form.jasaPerTindakan || ''} onChange={(e) => { const val = Number(e.target.value); setField('jasaPerTindakan', val); setField('totalJasa', val * form.totalTindakan); }} onBlur={() => touch('jasaPerTindakan')} placeholder="250000" className={`${inputCls(errors.jasaPerTindakan)} pl-9`} />
                      </div>
                    </FormField>
                    <FormField label="Total Tindakan (periode ini)">
                      <input type="number" value={form.totalTindakan || ''} onChange={(e) => { const val = Number(e.target.value); setField('totalTindakan', val); setField('totalJasa', form.jasaPerTindakan * val); }} placeholder="0" className={inputCls()} />
                    </FormField>
                    <FormField label="Rating Kinerja (1–5)" error={errors.rating}>
                      <div>
                        <input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={(e) => setField('rating', Number(e.target.value))} onBlur={() => touch('rating')} className={inputCls(errors.rating)} />
                        <div className="mt-1.5">{renderStars(form.rating, true, (v) => setField('rating', v))}</div>
                      </div>
                    </FormField>
                  </div>
                  {/* Preview kalkulasi */}
                  {form.jasaPerTindakan > 0 && (
                    <div className="mt-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-6 text-sm">
                      <div>
                        <p className="text-[10px] text-teal-600 font-semibold uppercase">Total Jasa (Estimasi)</p>
                        <p className="font-bold text-teal-800">{formatRupiah(form.jasaPerTindakan * form.totalTindakan)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-teal-600 font-semibold uppercase">Pajak PPh (5%)</p>
                        <p className="font-bold text-amber-700">{formatRupiah(form.jasaPerTindakan * form.totalTindakan * 0.05)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-teal-600 font-semibold uppercase">Netto (Estimasi)</p>
                        <p className="font-bold text-emerald-700">{formatRupiah(form.jasaPerTindakan * form.totalTindakan * 0.95)}</p>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Footer form */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
              {/* Reset form */}
              <button onClick={() => { setForm(mode === 'edit' && activeNakes ? (() => { const { id, ...rest } = activeNakes; const sanitized = {} as FormNakes; for (const [k, v] of Object.entries(rest)) { sanitized[k as keyof FormNakes] = (v === null || v === undefined ? (typeof EMPTY_FORM[k as keyof FormNakes] === 'string' ? '' : 0) : v) as any; } return sanitized; })() : EMPTY_FORM); setErrors({}); setTouched({}); }} className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition">
                <RotateCcw className="w-3.5 h-3.5" /> Reset Form
              </button>
              <div className="flex gap-2">
                <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition">
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all
                    ${mode === 'add' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'}
                    ${saving ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {saving ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Menyimpan…' : mode === 'add' ? 'Simpan Nakes' : 'Perbarui Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: KONFIRMASI HAPUS
      ═══════════════════════════════════════════════════════════════════════ */}
      {mode === 'delete' && activeNakes && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-pop">
            <div className="p-6">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Hapus Tenaga Kesehatan?</h3>
              <p className="text-sm text-slate-600 text-center mb-4">
                Anda akan menghapus data <span className="font-bold text-slate-800">{activeNakes.nama}</span> secara permanen.
                <br />Tindakan ini <span className="text-rose-600 font-semibold">tidak dapat dibatalkan</span>.
              </p>
              {/* Kartu info nakes */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 mb-5">
                <div className={`w-11 h-11 bg-gradient-to-br ${getAvatarColor(activeNakes.id)} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {(activeNakes.nama || '??').replace(/^(dr\.|drg\.|Ns\.|Bidan|Apt\.)\s*/i, '').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{activeNakes.nama}</p>
                  <p className="text-xs text-slate-500">{activeNakes.jabatan} · {activeNakes.unit}</p>
                  <p className="text-xs font-mono text-slate-400">{activeNakes.id} · NIP {activeNakes.nip}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">Data jasa medis dan riwayat remunerasi terkait juga akan ikut terhapus.</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition">
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition ${saving ? 'opacity-70 cursor-wait' : ''}`}
              >
                {saving ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {saving ? 'Menghapus…' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
