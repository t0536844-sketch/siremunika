import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Filter,
  MessageSquare, User, Building2, FileText, Wallet,
  Stethoscope, BarChart3, Search, ShieldCheck, X,
  Eye, Shield, Loader2, ThumbsUp, ThumbsDown,
  CalendarDays, Hash, DollarSign, ArrowUpRight, Undo2,
} from 'lucide-react';
import { dataApproval, dataPendapatan as mockPendapatan, dataJasa as mockJasa, dataHasil as mockHasil } from '../data/mockData';
import { formatRupiah, formatDateShort, formatDate, statusColors, statusLabel } from '../utils/helpers';
import type { ApprovalItem, Pendapatan, JasaMedis, HasilKalkulasi } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import dataService from '../data/dataService';

// ─── Config ────────────────────────────────────────────────────
const levelColors: Record<string, string> = {
  Unit:     'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  Keuangan: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-700',
  Direksi:  'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700',
};

const levelPermission: Record<string, string> = {
  Unit:     'approval.approve_unit',
  Keuangan: 'approval.approve_keuangan',
  Direksi:  'approval.approve_direksi',
};

const tipeIcon: Record<string, any> = {
  pendapatan: Wallet,
  jasa:       Stethoscope,
  hasil:      BarChart3,
};

const tipeLabel: Record<string, string> = {
  pendapatan: 'Data Pendapatan',
  jasa:       'Jasa Medis',
  hasil:      'Hasil Kalkulasi',
};

const tipeColor: Record<string, string> = {
  pendapatan: 'from-teal-500 to-teal-700',
  jasa:       'from-cyan-500 to-cyan-700',
  hasil:      'from-indigo-500 to-indigo-700',
};

// ─── Extended ApprovalItem dengan riwayat ──────────────────────
interface ApprovalItemExt extends ApprovalItem {
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  alasanTolak?: string;
}

// ─── Helper: ambil detail data terkait ─────────────────────────
function getRelatedDetail(item: ApprovalItem) {
  if (item.tipe === 'pendapatan') {
    const d = dataPendapatan.find((p) => p.id === item.referensi);
    if (!d) return null;
    return {
      rows: [
        { label: 'ID Transaksi', value: d.id },
        { label: 'Tanggal', value: formatDateShort(d.tanggal) },
        { label: 'Unit', value: d.unit },
        { label: 'Jenis Pelayanan', value: d.jenisPelayanan },
        { label: 'Jumlah Pasien', value: String(d.jumlahPasien) },
        { label: 'Nilai Pendapatan', value: formatRupiah(d.nilaiPendapatan), bold: true },
        { label: 'Operator', value: d.operator },
        { label: 'Status Data', value: d.status },
      ],
    };
  }
  if (item.tipe === 'jasa') {
    const d = dataJasa.find((j) => j.id === item.referensi);
    if (!d) return null;
    return {
      rows: [
        { label: 'ID Jasa', value: d.id },
        { label: 'Periode', value: d.periode },
        { label: 'Nama Nakes', value: d.nakes },
        { label: 'Jabatan', value: d.jabatan },
        { label: 'Unit', value: d.unit },
        { label: 'Tarif/Tindakan', value: formatRupiah(d.tarifJasa) },
        { label: 'Jumlah Tindakan', value: String(d.jumlahTindakan) },
        { label: 'Total Jasa', value: formatRupiah(d.totalJasa), bold: true },
        { label: 'Status Data', value: d.status },
      ],
    };
  }
  if (item.tipe === 'hasil') {
    const d = dataHasil.find((h) => h.id === item.referensi);
    if (!d) return null;
    return {
      rows: [
        { label: 'ID Kalkulasi', value: d.id },
        { label: 'Periode', value: d.periode },
        { label: 'Unit', value: d.unit },
        { label: 'Total Pendapatan', value: formatRupiah(d.totalPendapatan) },
        { label: 'Beban Operasional', value: formatRupiah(d.totalBeban) },
        { label: 'Jasa Medis', value: formatRupiah(d.totalJasaMedis) },
        { label: 'Jasa Paramedis', value: formatRupiah(d.totalJasaParamedis) },
        { label: 'Jasa Penunjang', value: formatRupiah(d.totalJasaPenunjang) },
        { label: 'Bonus Prestasi', value: formatRupiah(d.bonusPrestasi) },
        { label: 'Pajak', value: formatRupiah(d.pajak) },
        { label: 'Netto', value: formatRupiah(d.netto), bold: true },
        { label: 'Status Data', value: d.status },
      ],
    };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
export default function Approval() {
  const { showToast } = useApp();
  const { session, can } = useAuth();

  const [items, setItems] = useState<ApprovalItemExt[]>([]);
  useEffect(() => {
    dataService.getApproval().then((data) => {
      if (data && data.length > 0) setItems(data.map((a: any) => ({ ...a })));
    }).catch(() => { setItems(dataApproval.map((a) => ({ ...a }))); });
  }, []);
  const [search, setSearch]                     = useState('');
  const [filterTipe, setFilterTipe]             = useState('Semua');
  const [filterLevel, setFilterLevel]           = useState('Semua');
  const [filterStatus, setFilterStatus]         = useState('Semua');

  // Modal state
  const [detailItem, setDetailItem]             = useState<ApprovalItemExt | null>(null);
  const [confirmAction, setConfirmAction]       = useState<{ item: ApprovalItemExt; action: 'approve' | 'reject' } | null>(null);
  const [rejectNote, setRejectNote]             = useState('');
  const [processing, setProcessing]             = useState(false);

  // ── Filtered ─────────────────────────────────────────────────
  const filtered = useMemo(() => items.filter(
    (item) =>
      (filterTipe   === 'Semua' || item.tipe   === filterTipe) &&
      (filterLevel  === 'Semua' || item.level  === filterLevel) &&
      (filterStatus === 'Semua' || item.status === filterStatus) &&
      (item.referensi.toLowerCase().includes(search.toLowerCase()) ||
       item.pengaju.toLowerCase().includes(search.toLowerCase()) ||
       item.catatan.toLowerCase().includes(search.toLowerCase()))
  ), [items, filterTipe, filterLevel, filterStatus, search]);

  // ── Stats ────────────────────────────────────────────────────
  const totalPending  = items.filter((i) => i.status === 'pending').length;
  const totalApproved = items.filter((i) => i.status === 'approved').length;
  const totalRejected = items.filter((i) => i.status === 'rejected').length;
  const totalNilaiPending = items.filter((i) => i.status === 'pending').reduce((s, i) => s + i.nilai, 0);

  // ── Permission check ─────────────────────────────────────────
  const canApproveLevel = (level: string): boolean => {
    const permKey = levelPermission[level];
    if (!permKey) return false;
    return can(permKey as any);
  };

  const userName = session?.user.nama.split(',')[0] ?? 'Admin';

  // ── Actions ──────────────────────────────────────────────────
  const openConfirmApprove = (item: ApprovalItemExt) => {
    if (!canApproveLevel(item.level)) {
      showToast('error', 'Akses Ditolak', `Anda tidak memiliki izin untuk approve di level ${item.level}. Hubungi administrator.`);
      return;
    }
    setConfirmAction({ item, action: 'approve' });
    setRejectNote('');
  };

  const openConfirmReject = (item: ApprovalItemExt) => {
    if (!canApproveLevel(item.level)) {
      showToast('error', 'Akses Ditolak', `Anda tidak memiliki izin untuk menolak di level ${item.level}. Hubungi administrator.`);
      return;
    }
    setConfirmAction({ item, action: 'reject' });
    setRejectNote('');
  };

  const executeAction = () => {
    if (!confirmAction) return;
    const { item, action } = confirmAction;

    if (action === 'reject' && !rejectNote.trim()) {
      showToast('error', 'Alasan wajib diisi', 'Tuliskan alasan penolakan sebelum konfirmasi');
      return;
    }

    setProcessing(true);
    const now = new Date().toISOString();

    setTimeout(() => {
      setItems((prev) => prev.map((i) => {
        if (i.id !== item.id) return i;
        if (action === 'approve') {
          return {
            ...i,
            status: 'approved' as const,
            approvedBy: userName,
            approvedAt: now,
            catatan: i.catatan + ` [Disetujui oleh ${userName}]`,
          };
        } else {
          return {
            ...i,
            status: 'rejected' as const,
            rejectedBy: userName,
            rejectedAt: now,
            alasanTolak: rejectNote,
            catatan: rejectNote,
          };
        }
      }));

      if (action === 'approve') {
        showToast('success', '✅ Pengajuan Disetujui', `${item.referensi} senilai ${formatRupiah(item.nilai)} telah disetujui oleh ${userName}`);
      } else {
        showToast('warning', '❌ Pengajuan Ditolak', `${item.referensi} ditolak — alasan: "${rejectNote.substring(0, 60)}…"`);
      }

      // Sync to database
      try {
        if (action === 'approve') {
          dataService.updateApproval({ id: item.id, status: 'approved', approvedBy: userName, approvedAt: now });
        } else {
          dataService.updateApproval({ id: item.id, status: 'rejected', rejectedBy: userName, rejectedAt: now, alasanTolak: rejectNote });
        }
      } catch {
        showToast('warning', 'Updated locally only', 'Failed to sync to database');
      }

      setProcessing(false);
      setConfirmAction(null);
      setRejectNote('');
    }, 800);
  };

  const handleRevert = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'pending' as const, approvedBy: undefined, approvedAt: undefined, rejectedBy: undefined, rejectedAt: undefined, alasanTolak: undefined } : i));
    showToast('info', 'Status dikembalikan', `${item.referensi} dikembalikan ke status "Menunggu"`);
    try {
      dataService.updateApproval({ id, status: 'pending', approvedBy: undefined, approvedAt: undefined, rejectedBy: undefined, rejectedAt: undefined, alasanTolak: undefined });
    } catch {
      showToast('warning', 'Updated locally only', 'Failed to sync to database');
    }
  };

  const approveAll = async () => {
    const pendingFiltered = filtered.filter((i) => i.status === 'pending');
    const allowed = pendingFiltered.filter((i) => canApproveLevel(i.level));
    if (allowed.length === 0) {
      showToast('error', 'Tidak ada yang bisa disetujui', 'Anda tidak memiliki izin untuk menyetujui pengajuan yang ditampilkan.');
      return;
    }
    if (!confirm(`Setujui ${allowed.length} pengajuan yang berhak Anda proses?`)) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => {
      if (i.status !== 'pending') return i;
      if (!allowed.find((a) => a.id === i.id)) return i;
      return { ...i, status: 'approved' as const, approvedBy: userName, approvedAt: now, catatan: i.catatan + ` [Bulk approve oleh ${userName}]` };
    }));
    showToast('success', 'Bulk Approval Berhasil', `${allowed.length} pengajuan telah disetujui`);
    try {
      for (const a of allowed) {
        await dataService.updateApproval({ id: a.id, status: 'approved', approvedBy: userName, approvedAt: now });
      }
    } catch {
      showToast('warning', 'Updated locally only', 'Failed to sync to database');
    }
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5 bg-slate-50 dark:bg-slate-950">

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-amber-100" />
            <span className="text-3xl font-bold">{totalPending}</span>
          </div>
          <p className="text-amber-50 text-xs">Menunggu Persetujuan</p>
          <p className="text-xs text-amber-100 mt-1">{formatRupiah(totalNilaiPending)}</p>
        </div>
        {[
          { label: 'Disetujui', value: totalApproved, icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Ditolak',   value: totalRejected, icon: XCircle,      color: 'text-rose-700 dark:text-rose-400' },
          { label: 'Total',     value: items.length,  icon: ShieldCheck,  color: 'text-teal-700 dark:text-teal-400' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${s.color}`} />
                <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── RBAC Info ── */}
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-2xl px-4 py-3 flex items-start gap-3">
        <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-violet-800 dark:text-violet-200">
            Login sebagai: {userName} — Role: {session?.role.nama ?? '-'}
          </p>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
            Anda dapat menyetujui/menolak di level:
            {['Unit', 'Keuangan', 'Direksi'].map((lv) => (
              <span key={lv} className={`ml-1.5 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                canApproveLevel(lv) ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600 line-through'
              }`}>
                {canApproveLevel(lv) ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {lv}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
        {[
          { label: 'Tipe', value: filterTipe, setValue: setFilterTipe, icon: Filter,
            options: ['Semua', { v: 'pendapatan', l: 'Pendapatan' }, { v: 'jasa', l: 'Jasa' }, { v: 'hasil', l: 'Hasil' }] },
          { label: 'Level', value: filterLevel, setValue: setFilterLevel, icon: Building2,
            options: ['Semua', 'Unit', 'Keuangan', 'Direksi'] },
          { label: 'Status', value: filterStatus, setValue: setFilterStatus, icon: AlertTriangle,
            options: ['Semua', { v: 'pending', l: 'Menunggu' }, { v: 'approved', l: 'Disetujui' }, { v: 'rejected', l: 'Ditolak' }] },
        ].map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
              <Icon className="w-4 h-4 text-slate-400" />
              <select value={f.value} onChange={(e) => f.setValue(e.target.value)}
                className="bg-transparent text-sm focus:outline-none min-w-[120px] text-slate-700 dark:text-slate-300">
                {f.options.map((o) => typeof o === 'string'
                  ? <option key={o} value={o}>{o}</option>
                  : <option key={o.v} value={o.v}>{o.l}</option>
                )}
              </select>
            </div>
          );
        })}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari referensi atau pengaju..."
            className="bg-transparent text-sm focus:outline-none w-full text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" /></button>}
        </div>
        {totalPending > 0 && (
          <button onClick={approveAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition">
            <CheckCircle2 className="w-4 h-4" /> Approve Semua
          </button>
        )}
      </div>

      {/* ── List ── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-200 dark:border-slate-700 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-slate-500 dark:text-slate-400">Tidak ada data persetujuan dengan filter ini</p>
          </div>
        )}

        {filtered.map((item) => {
          const TipeIcon = tipeIcon[item.tipe];
          const canProcess = canApproveLevel(item.level);
          return (
            <div key={item.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden transition-all hover:shadow-md ${
                item.status === 'pending'
                  ? 'border-amber-200 dark:border-amber-700 shadow-sm'
                  : item.status === 'approved'
                    ? 'border-emerald-200 dark:border-emerald-800'
                    : 'border-rose-200 dark:border-rose-800'
              }`}
            >
              <div className="p-5 flex flex-wrap items-center gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 bg-gradient-to-br ${tipeColor[item.tipe]} text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <TipeIcon className="w-7 h-7" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${levelColors[item.level]}`}>
                      Level: {item.level}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                      {tipeLabel[item.tipe]}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${statusColors[item.status]}`}>
                      {statusLabel[item.status]}
                    </span>
                    {!canProcess && item.status === 'pending' && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-700 font-bold">
                        🔒 Tidak berhak
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                    {item.referensi}
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-lg font-bold text-teal-700 dark:text-teal-400">{formatRupiah(item.nilai)}</span>
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.pengaju}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateShort(item.tanggalPengajuan)}</span>
                    {item.catatan && (
                      <span className="flex items-center gap-1 italic text-slate-600 dark:text-slate-300 max-w-[300px] truncate">
                        <MessageSquare className="w-3 h-3 flex-shrink-0" />{item.catatan}
                      </span>
                    )}
                  </div>

                  {/* Riwayat approval/reject */}
                  {item.approvedBy && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Disetujui oleh <b>{item.approvedBy}</b>
                      {item.approvedAt && ` pada ${formatDateShort(item.approvedAt.split('T')[0])}`}
                    </p>
                  )}
                  {item.rejectedBy && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Ditolak oleh <b>{item.rejectedBy}</b>
                      {item.rejectedAt && ` pada ${formatDateShort(item.rejectedAt.split('T')[0])}`}
                      {item.alasanTolak && ` — "${item.alasanTolak}"`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 gap-2">
                  {/* Detail */}
                  <button onClick={() => setDetailItem(item)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition">
                    <Eye className="w-4 h-4" /> Detail
                  </button>

                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => openConfirmApprove(item)}
                        disabled={!canProcess}
                        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg shadow-sm transition ${
                          canProcess
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                        title={canProcess ? 'Setujui pengajuan ini' : `Anda tidak memiliki izin approve di level ${item.level}`}
                      >
                        <ThumbsUp className="w-4 h-4" /> Setujui
                      </button>
                      <button
                        onClick={() => openConfirmReject(item)}
                        disabled={!canProcess}
                        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition ${
                          canProcess
                            ? 'bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700'
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600 cursor-not-allowed'
                        }`}
                        title={canProcess ? 'Tolak pengajuan ini' : `Anda tidak memiliki izin menolak di level ${item.level}`}
                      >
                        <ThumbsDown className="w-4 h-4" /> Tolak
                      </button>
                    </>
                  )}

                  {item.status !== 'pending' && (
                    <div className="flex items-center gap-2">
                      {item.status === 'approved' && (
                        <span className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg">
                          <CheckCircle2 className="w-4 h-4" /> Disetujui
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-lg">
                          <XCircle className="w-4 h-4" /> Ditolak
                        </span>
                      )}
                      {canProcess && (
                        <button onClick={() => handleRevert(item.id)}
                          className="flex items-center gap-1 px-2.5 py-2 text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Kembalikan ke status Menunggu">
                          <Undo2 className="w-3.5 h-3.5" /> Batal
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════════ MODAL DETAIL ═══════════ */}
      {detailItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-pop">
            <div className={`bg-gradient-to-r ${tipeColor[detailItem.tipe]} text-white px-6 py-5 flex items-center justify-between flex-shrink-0`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
                  {(() => { const IC = tipeIcon[detailItem.tipe]; return <IC className="w-5 h-5" />; })()}
                </div>
                <div>
                  <h3 className="font-bold text-lg">Detail Pengajuan</h3>
                  <p className="text-xs opacity-80">{detailItem.id} · {tipeLabel[detailItem.tipe]}</p>
                </div>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-white/70 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Info pengajuan */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Referensi', value: detailItem.referensi, icon: Hash },
                  { label: 'Nilai', value: formatRupiah(detailItem.nilai), icon: DollarSign },
                  { label: 'Pengaju', value: detailItem.pengaju, icon: User },
                  { label: 'Tanggal Pengajuan', value: formatDate(detailItem.tanggalPengajuan), icon: CalendarDays },
                  { label: 'Level Approval', value: detailItem.level, icon: Building2 },
                  { label: 'Status', value: statusLabel[detailItem.status], icon: detailItem.status === 'approved' ? CheckCircle2 : detailItem.status === 'rejected' ? XCircle : Clock },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{f.label}</p>
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{f.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Catatan */}
              {detailItem.catatan && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">{detailItem.catatan}</p>
                </div>
              )}

              {/* Data terkait dari modul asal */}
              {(() => {
                const detail = getRelatedDetail(detailItem);
                if (!detail) return (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">Data sumber tidak ditemukan</p>
                );
                return (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-700/40 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Data Sumber — {tipeLabel[detailItem.tipe]}</p>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {detail.rows.map((r: any) => (
                        <div key={r.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{r.label}</span>
                          <span className={`text-xs ${r.bold ? 'font-bold text-teal-700 dark:text-teal-400 text-sm' : 'font-semibold text-slate-800 dark:text-slate-100'}`}>
                            {r.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Riwayat keputusan */}
              {(detailItem.approvedBy || detailItem.rejectedBy) && (
                <div className={`rounded-xl p-4 border ${
                  detailItem.approvedBy
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                    : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
                }`}>
                  <p className={`text-sm font-bold ${detailItem.approvedBy ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
                    {detailItem.approvedBy ? '✅ Disetujui' : '❌ Ditolak'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Oleh: <b>{detailItem.approvedBy ?? detailItem.rejectedBy}</b>
                    {(detailItem.approvedAt || detailItem.rejectedAt) && ` · ${formatDateShort((detailItem.approvedAt ?? detailItem.rejectedAt ?? '').split('T')[0])}`}
                  </p>
                  {detailItem.alasanTolak && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 italic">Alasan: "{detailItem.alasanTolak}"</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
              <button onClick={() => setDetailItem(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                Tutup
              </button>
              {detailItem.status === 'pending' && canApproveLevel(detailItem.level) && (
                <div className="flex gap-2">
                  <button onClick={() => { setDetailItem(null); openConfirmReject(detailItem); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition">
                    <ThumbsDown className="w-4 h-4" /> Tolak
                  </button>
                  <button onClick={() => { setDetailItem(null); openConfirmApprove(detailItem); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition">
                    <ThumbsUp className="w-4 h-4" /> Setujui
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ MODAL KONFIRMASI APPROVE / REJECT ═══════════ */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-pop">
            {/* Header */}
            <div className={`px-6 py-5 text-white ${
              confirmAction.action === 'approve'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700'
                : 'bg-gradient-to-r from-rose-600 to-rose-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  {confirmAction.action === 'approve' ? <ThumbsUp className="w-5 h-5" /> : <ThumbsDown className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {confirmAction.action === 'approve' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
                  </h3>
                  <p className="text-xs opacity-80">{confirmAction.item.referensi} · {tipeLabel[confirmAction.item.tipe]}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Info singkat */}
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 space-y-2 border border-slate-100 dark:border-slate-700">
                {[
                  { label: 'Pengaju', value: confirmAction.item.pengaju },
                  { label: 'Nilai', value: formatRupiah(confirmAction.item.nilai) },
                  { label: 'Level', value: confirmAction.item.level },
                  { label: 'Anda menyetujui sebagai', value: `${userName} (${session?.role.nama})` },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{r.label}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Alasan jika reject */}
              {confirmAction.action === 'reject' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Alasan Penolakan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Tuliskan alasan lengkap mengapa pengajuan ini ditolak..."
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Catatan ini akan terlihat oleh pengaju ({confirmAction.item.pengaju}) dan tercatat dalam log
                  </p>
                </div>
              )}

              {/* Peringatan */}
              <div className={`flex items-start gap-2 rounded-xl px-4 py-3 border ${
                confirmAction.action === 'approve'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                  : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
              }`}>
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  confirmAction.action === 'approve' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`} />
                <p className={`text-xs ${
                  confirmAction.action === 'approve' ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'
                }`}>
                  {confirmAction.action === 'approve'
                    ? 'Dengan menyetujui, data ini akan diteruskan ke proses selanjutnya. Tindakan ini akan tercatat atas nama Anda.'
                    : 'Dengan menolak, pengajuan ini akan ditandai sebagai ditolak. Pengaju akan mendapatkan notifikasi beserta alasan yang Anda tuliskan.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => { setConfirmAction(null); setRejectNote(''); }}
                disabled={processing}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition disabled:opacity-50">
                Batal
              </button>
              <button
                onClick={executeAction}
                disabled={processing || (confirmAction.action === 'reject' && !rejectNote.trim())}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition min-w-[160px] disabled:opacity-60 ${
                  confirmAction.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {processing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Memproses…</>
                ) : confirmAction.action === 'approve' ? (
                  <><ThumbsUp className="w-4 h-4" />Ya, Setujui</>
                ) : (
                  <><ThumbsDown className="w-4 h-4" />Ya, Tolak</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
