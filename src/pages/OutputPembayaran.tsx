import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  Building2,
  CreditCard,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  FileCheck,
  Zap,
  Pencil,
} from 'lucide-react';
import { dataPembayaran } from '../data/mockData';
import dataService from '../data/dataService';
import { formatRupiah, formatNumber, formatDate } from '../utils/helpers';
import { exportToExcel, exportToPDF, printPage } from '../utils/exporters';
import { useApp } from '../context/AppContext';
import SlipPembayaran from '../components/SlipPembayaran';
import type { Pembayaran } from '../data/mockData';

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText, label: 'Draft' },
  final: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: FileCheck, label: 'Final' },
  disetujui: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Disetujui' },
  approved: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock, label: 'Disetujui' },
  dibayar: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Dibayar' },
  paid: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Dibayar' },
  dibatalkan: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Dibatalkan' },
  cancelled: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Dibatalkan' },
};

// Map Supabase English status → frontend Indonesian for consistency
const STATUS_TO_ID = {
  approved: 'disetujui',
  paid: 'dibayar',
  cancelled: 'dibatalkan',
  draft: 'draft',
  final: 'final',
};

// Map frontend Indonesian → Supabase English for saving
const STATUS_TO_EN = {
  disetujui: 'approved',
  dibayar: 'paid',
  dibatalkan: 'cancelled',
  draft: 'draft',
  final: 'final',
};

type PembayaranStatus = 'draft' | 'final' | 'disetujui' | 'dibayar' | 'dibatalkan';
function normalizeStatus(status: string): PembayaranStatus {
  return (STATUS_TO_ID as Record<string, PembayaranStatus>)[status] || status as PembayaranStatus;
}

export default function OutputPembayaran() {
  const { showToast } = useApp();
  const [items, setItems] = useState<Pembayaran[]>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const data = await dataService.getPembayaran();
        // Normalize Supabase English status to frontend Indonesian
        const normalized = (data && data.length > 0 ? data : dataPembayaran).map((p: any) => ({
          ...p,
          status: normalizeStatus(p.status || 'draft'),
        }));
        setItems(normalized);
      } catch {
        setItems(dataPembayaran.map((p) => ({ ...p, status: normalizeStatus(p.status || 'draft') })));
      }
    };
    load();
  }, []);

  const loadFromSupabase = async () => {
    try {
      const data = await dataService.getPembayaran();
      if (data && data.length > 0) {
        setItems(data.map((p: any) => ({ ...p, status: normalizeStatus(p.status || 'draft') })));
      }
    } catch { /* keep current local state */ }
  };
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [filterJabatan, setFilterJabatan] = useState('Semua');
  const [selectedPayment, setSelectedPayment] = useState<Pembayaran | null>(null);
  const [showSlip, setShowSlip] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editItem, setEditItem] = useState<Pembayaran | null>(null);

  // Get unique values for filters
  const units = Array.from(new Set(items.map((i) => i.unit)));
  const jabatans = Array.from(new Set(items.map((i) => i.jabatan)));

  // Filter items
  const filtered = items.filter((item) => {
    const matchSearch =
      search === '' ||
      (item.nakesNama || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.nip || '').includes(search) ||
      (item.noBukti || '').includes(search);
    const matchStatus = filterStatus === 'Semua' || item.status === filterStatus;
    const matchUnit = filterUnit === 'Semua' || item.unit === filterUnit;
    const matchJabatan = filterJabatan === 'Semua' || item.jabatan === filterJabatan;
    return matchSearch && matchStatus && matchUnit && matchJabatan;
  });

  // Calculate totals
  const totals = filtered.reduce(
    (acc, item) => ({
      totalKotor: acc.totalKotor + (item.totalJasaKotor || 0),
      totalPotongan: acc.totalPotongan + (item.totalPotongan || 0),
      totalNetto: acc.totalNetto + (item.nettoDibayar || 0),
      totalPajak: acc.totalPajak + (item.pajakPPh || 0),
    }),
    { totalKotor: 0, totalPotongan: 0, totalNetto: 0, totalPajak: 0 }
  );

  const statusCounts = {
    draft: items.filter((i) => i.status === 'draft').length,
    final: items.filter((i) => i.status === 'final').length,
    disetujui: items.filter((i) => i.status === 'disetujui').length,
    dibayar: items.filter((i) => i.status === 'dibayar').length,
    dibatalkan: items.filter((i) => i.status === 'dibatalkan').length,
  };

  const handleFinalisasi = async (id: string) => {
    const now = new Date().toISOString();
    setItems(items.map((i) => (i.id === id ? { ...i, status: 'final' as const, tanggalFinalisasi: now } : i)));
    showToast('success', 'Pembayaran Difinalisasi', `Pembayaran ${id} telah difinalisasi dan siak disetujui`);
    try {
      await dataService.savePembayaran({ id, status: STATUS_TO_EN['final'], tanggalFinalisasi: now });
      loadFromSupabase();
    } catch { showToast('warning', 'Updated locally only', 'Failed to sync to database'); }
  };

  const handleSetujui = async (id: string) => {
    const now = new Date().toISOString();
    setItems(items.map((i) => (i.id === id ? { ...i, status: 'disetujui' as const, tanggalPersetujuan: now } : i)));
    showToast('success', 'Pembayaran Disetujui', `Pembayaran ${id} telah disetujui oleh Kepala Keuangan`);
    try {
      await dataService.savePembayaran({ id, status: STATUS_TO_EN['disetujui'], tanggalPersetujuan: now });
      loadFromSupabase();
    } catch { showToast('warning', 'Updated locally only', 'Failed to sync to database'); }
  };

  const handleBayar = async (id: string) => {
    const noBukti = `TRF/2026/01/${String(items.filter((i) => i.status === 'dibayar').length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    setItems(items.map((i) => (i.id === id ? { ...i, status: 'dibayar' as const, tanggalPembayaran: now, noBukti } : i)));
    showToast('success', 'Pembayaran Berhasil', `Transfer ${noBukti} telah dilakukan`);
    try {
      await dataService.savePembayaran({ id, status: STATUS_TO_EN['dibayar'], tanggalPembayaran: now, noBukti });
      loadFromSupabase();
    } catch { showToast('warning', 'Updated locally only', 'Failed to sync to database'); }
  };

  const handleBatal = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin membatalkan pembayaran ini?')) {
      setItems(items.map((i) => (i.id === id ? { ...i, status: 'dibatalkan' as const } : i)));
      showToast('warning', 'Pembayaran Dibatalkan', `Pembayaran ${id} telah dibatalkan`);
      try {
        await dataService.savePembayaran({ id, status: STATUS_TO_EN['dibatalkan'] });
        loadFromSupabase();
      } catch { showToast('warning', 'Updated locally only', 'Failed to sync to database'); }
    }
  };

  const handleExportExcel = () => {
    const rows = filtered.map((p) => ({
      id: p.id,
      periode: p.periode,
      nakesId: p.nakesId,
      nakesNama: p.nakesNama,
      nip: p.nip,
      jabatan: p.jabatan,
      unit: p.unit,
      noRekening: p.noRekening,
      bank: p.bank,
      jasaMedis: p.jasaMedis,
      jasaParamedis: p.jasaParamedis,
      jasaPenunjang: p.jasaPenunjang,
      bonusPrestasi: p.bonusPrestasi,
      totalJasaKotor: p.totalJasaKotor,
      pajakPPh: p.pajakPPh,
      iuranBPJS: p.iuranBPJS,
      potonganLain: p.potonganLain,
      totalPotongan: p.totalPotongan,
      nettoDibayar: p.nettoDibayar,
      status: p.status,
      noBukti: p.noBukti || '-',
      tanggalPembayaran: p.tanggalPembayaran ? formatDate(p.tanggalPembayaran) : '-',
    }));

    exportToExcel(
      'Output_Pembayaran',
      'Pembayaran',
      [
        { header: 'ID Pembayaran', key: 'id', width: 18 },
        { header: 'Periode', key: 'periode', width: 14 },
        { header: 'ID Nakes', key: 'nakesId', width: 14 },
        { header: 'Nama Nakes', key: 'nakesNama', width: 28 },
        { header: 'NIP', key: 'nip', width: 22 },
        { header: 'Jabatan', key: 'jabatan', width: 24 },
        { header: 'Unit', key: 'unit', width: 20 },
        { header: 'No. Rekening', key: 'noRekening', width: 16 },
        { header: 'Bank', key: 'bank', width: 14 },
        { header: 'Jasa Medis', key: 'jasaMedis', format: 'currency' as const, width: 16 },
        { header: 'Jasa Paramedis', key: 'jasaParamedis', format: 'currency' as const, width: 16 },
        { header: 'Jasa Penunjang', key: 'jasaPenunjang', format: 'currency' as const, width: 16 },
        { header: 'Bonus Prestasi', key: 'bonusPrestasi', format: 'currency' as const, width: 16 },
        { header: 'Total Jasa Kotor', key: 'totalJasaKotor', format: 'currency' as const, width: 18 },
        { header: 'Pajak PPh', key: 'pajakPPh', format: 'currency' as const, width: 16 },
        { header: 'Iuran BPJS', key: 'iuranBPJS', format: 'currency' as const, width: 16 },
        { header: 'Potongan Lain', key: 'potonganLain', format: 'currency' as const, width: 16 },
        { header: 'Total Potongan', key: 'totalPotongan', format: 'currency' as const, width: 18 },
        { header: 'Netto Dibayar', key: 'nettoDibayar', format: 'currency' as const, width: 18 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'No. Bukti', key: 'noBukti', width: 18 },
        { header: 'Tanggal Pembayaran', key: 'tanggalPembayaran', width: 18 },
      ],
      rows,
      { title: 'OUTPUT PEMBAYARAN REMUNERASI', subtitle: `${filtered.length} pembayaran · Total: ${formatRupiah(totals.totalNetto)}` }
    );
    showToast('success', 'Export Excel Berhasil', `${filtered.length} pembayaran telah diekspor`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    const rows = filtered.map((p) => ({
      id: p.id,
      nakesNama: p.nakesNama,
      jabatan: p.jabatan,
      unit: p.unit,
      noRekening: p.noRekening,
      bank: p.bank,
      totalJasaKotor: p.totalJasaKotor,
      totalPotongan: p.totalPotongan,
      nettoDibayar: p.nettoDibayar,
      status: p.status,
    }));

    exportToPDF(
      'Output_Pembayaran',
      'Output Pembayaran Remunerasi',
      [
        { header: 'ID', key: 'id', width: 16 },
        { header: 'Nama Nakes', key: 'nakesNama', width: 26 },
        { header: 'Jabatan', key: 'jabatan', width: 22 },
        { header: 'Unit', key: 'unit', width: 18 },
        { header: 'No. Rek', key: 'noRekening', width: 16 },
        { header: 'Bank', key: 'bank', width: 12 },
        { header: 'Total Kotor', key: 'totalJasaKotor', format: 'currency' as const, width: 18 },
        { header: 'Potongan', key: 'totalPotongan', format: 'currency' as const, width: 18 },
        { header: 'Netto', key: 'nettoDibayar', format: 'currency' as const, width: 18 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      rows,
      { subtitle: `Total: ${formatRupiah(totals.totalNetto)} · ${filtered.length} pembayaran` }
    );
    showToast('success', 'Export PDF Berhasil', 'Laporan pembayaran telah diekspor ke PDF');
    setShowExportMenu(false);
  };

  const handleExportBatchTransfer = () => {
    const batchData = filtered
      .filter((p) => p.status === 'disetujui')
      .map((p) => ({
        noRekening: p.noRekening,
        namaPenerima: p.nakesNama,
        nominal: p.nettoDibayar,
        bank: p.bank,
        referensi: p.id,
      }));

    if (batchData.length === 0) {
      showToast('warning', 'Tidak Ada Data', 'Tidak ada pembayaran dengan status "Disetujui" untuk diexport');
      return;
    }

    // Create batch transfer file (CSV format)
    const csv = [
      ['No Rekening', 'Nama Penerima', 'Nominal', 'Bank', 'Referensi'].join(','),
      ...batchData.map((b) =>
        [b.noRekening, b.namaPenerima, b.nominal, b.bank, b.referensi].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Batch_Transfer_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('success', 'Batch Transfer Exported', `${batchData.length} pembayaran siap ditransfer`);
    setShowExportMenu(false);
  };

  const handleViewSlip = (payment: Pembayaran) => {
    setSelectedPayment(payment);
    setShowSlip(true);
  };

  const handlePrintSlip = (payment: Pembayaran) => {
    setSelectedPayment(payment);
    setTimeout(() => printPage(), 200);
  };

  return (
    <div className="p-6 space-y-5 bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Banknote className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Output Pembayaran</h2>
              <p className="text-green-100 text-sm mt-1 max-w-2xl">
                Kelola pembayaran remunerasi tenaga kesehatan — dari finalisasi, persetujuan, hingga transfer bank
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
              <Users className="w-4 h-4" />
              {formatNumber(items.length)} Nakes
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
              <DollarSign className="w-4 h-4" />
              {formatRupiah(totals.totalNetto)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Draft</p>
          <p className="text-2xl font-bold text-gray-700">{formatNumber(statusCounts.draft)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Final</p>
          <p className="text-2xl font-bold text-blue-700">{formatNumber(statusCounts.final)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Disetujui</p>
          <p className="text-2xl font-bold text-yellow-700">{formatNumber(statusCounts.disetujui)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Dibayar</p>
          <p className="text-2xl font-bold text-green-700">{formatNumber(statusCounts.dibayar)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Dibatalkan</p>
          <p className="text-2xl font-bold text-red-700">{formatNumber(statusCounts.dibatalkan)}</p>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-blue-100 text-xs mb-1">Total Jasa Kotor</p>
          <p className="text-2xl font-bold">{formatRupiah(totals.totalKotor)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-red-100 text-xs mb-1">Total Potongan</p>
          <p className="text-2xl font-bold">{formatRupiah(totals.totalPotongan)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-amber-100 text-xs mb-1">Total Pajak PPh</p>
          <p className="text-2xl font-bold">{formatRupiah(totals.totalPajak)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-green-100 text-xs mb-1">Total Netto Dibayar</p>
          <p className="text-2xl font-bold">{formatRupiah(totals.totalNetto)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[130px]"
          >
            <option>Semua</option>
            <option value="draft">Draft</option>
            <option value="final">Final</option>
            <option value="disetujui">Disetujui</option>
            <option value="dibayar">Dibayar</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Building2 className="w-4 h-4 text-slate-500" />
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[180px]"
          >
            <option>Semua</option>
            {units.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <select
            value={filterJabatan}
            onChange={(e) => setFilterJabatan(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[180px]"
          >
            <option>Semua</option>
            {jabatans.map((j) => (
              <option key={j}>{j}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIP, atau no. bukti..."
            className="bg-transparent text-sm focus:outline-none w-full"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-20 min-w-[200px]">
                <button onClick={handleExportExcel} className="w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Export Excel
                </button>
                <button onClick={handleExportPDF} className="w-full px-4 py-2 text-left text-sm hover:bg-rose-50 text-slate-700 hover:text-rose-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  Export PDF
                </button>
                <button onClick={handleExportBatchTransfer} className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-slate-700 hover:text-blue-700 flex items-center gap-2 border-t border-slate-100">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Batch Transfer (CSV)
                </button>
                <button
                  onClick={() => {
                    showToast('info', 'Menyiapkan halaman cetak...');
                    setTimeout(() => printPage(), 200);
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-2 border-t border-slate-100"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  Cetak Halaman
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <th className="px-5 py-3 text-left font-semibold">ID</th>
                <th className="px-5 py-3 text-left font-semibold">Nakes</th>
                <th className="px-5 py-3 text-left font-semibold">Jabatan</th>
                <th className="px-5 py-3 text-left font-semibold">Unit</th>
                <th className="px-5 py-3 text-right font-semibold">Total Kotor</th>
                <th className="px-5 py-3 text-right font-semibold">Potongan</th>
                <th className="px-5 py-3 text-right font-semibold">Netto</th>
                <th className="px-5 py-3 text-center font-semibold">Status</th>
                <th className="px-5 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const cfg = statusConfig[item.status || 'draft'];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-green-700 font-semibold">{item.id}</td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="font-medium text-slate-800">{item.nakesNama}</p>
                        <p className="text-[10px] text-slate-500">NIP: {item.nip}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{item.jabatan}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{item.unit}</td>
                    <td className="px-5 py-3 text-right text-slate-600 text-xs">{formatRupiah(item.totalJasaKotor || 0)}</td>
                    <td className="px-5 py-3 text-right text-red-700 text-xs">{formatRupiah(item.totalPotongan || 0)}</td>
                    <td className="px-5 py-3 text-right font-bold text-green-700">{formatRupiah(item.nettoDibayar || 0)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border font-semibold ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewSlip(item)}
                          className="p-1.5 text-slate-500 hover:bg-green-50 hover:text-green-600 rounded-lg"
                          title="Lihat Slip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(item.status === 'draft' || item.status === 'final') && (
                          <button
                            onClick={() => setEditItem({ ...item })}
                            className="p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintSlip(item)}
                          className="p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          title="Cetak Slip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {item.status === 'draft' && (
                          <button
                            onClick={() => handleFinalisasi(item.id)}
                            className="p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                            title="Finalisasi"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        )}
                        {item.status === 'final' && (
                          <button
                            onClick={() => handleSetujui(item.id)}
                            className="p-1.5 text-slate-500 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg"
                            title="Setujui"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {item.status === 'disetujui' && (
                          <button
                            onClick={() => handleBayar(item.id)}
                            className="p-1.5 text-slate-500 hover:bg-green-50 hover:text-green-600 rounded-lg"
                            title="Bayar"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        )}
                        {(item.status === 'draft' || item.status === 'final') && (
                          <button
                            onClick={() => handleBatal(item.id)}
                            className="p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg"
                            title="Batalkan"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Menampilkan <b>{filtered.length}</b> dari <b>{items.length}</b> pembayaran
          </span>
          <span>
            Total Netto: <b className="text-green-700">{formatRupiah(totals.totalNetto)}</b>
          </span>
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Edit Pembayaran</h3>
                <p className="text-xs text-indigo-100">{editItem.id} · {editItem.nakesNama}</p>
              </div>
              <button onClick={() => setEditItem(null)} className="text-white/80 hover:text-white text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Bank & Rekening */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bank</label>
                  <input
                    value={editItem.bank || ''}
                    onChange={(e) => setEditItem({ ...editItem, bank: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">No. Rekening</label>
                  <input
                    value={editItem.noRekening || ''}
                    onChange={(e) => setEditItem({ ...editItem, noRekening: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              {/* Financial fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jasa Medis</label>
                  <input
                    type="number"
                    value={editItem.jasaMedis || 0}
                    onChange={(e) => setEditItem({ ...editItem, jasaMedis: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jasa Paramedis</label>
                  <input
                    type="number"
                    value={editItem.jasaParamedis || 0}
                    onChange={(e) => setEditItem({ ...editItem, jasaParamedis: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Jasa Penunjang</label>
                  <input
                    type="number"
                    value={editItem.jasaPenunjang || 0}
                    onChange={(e) => setEditItem({ ...editItem, jasaPenunjang: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bonus Prestasi</label>
                  <input
                    type="number"
                    value={editItem.bonusPrestasi || 0}
                    onChange={(e) => setEditItem({ ...editItem, bonusPrestasi: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              {/* Potongan */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pajak PPh</label>
                  <input
                    type="number"
                    value={editItem.pajakPPh || 0}
                    onChange={(e) => setEditItem({ ...editItem, pajakPPh: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Iuran BPJS</label>
                  <input
                    type="number"
                    value={editItem.iuranBPJS || 0}
                    onChange={(e) => setEditItem({ ...editItem, iuranBPJS: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Potongan Lain</label>
                  <input
                    type="number"
                    value={editItem.potonganLain || 0}
                    onChange={(e) => setEditItem({ ...editItem, potonganLain: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Catatan</label>
                  <input
                    value={editItem.catatan || ''}
                    onChange={(e) => setEditItem({ ...editItem, catatan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
              {/* Auto-computed totals */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-700">Total Jasa Kotor</span>
                  <span className="font-bold text-indigo-800">{formatRupiah((editItem.jasaMedis||0)+(editItem.jasaParamedis||0)+(editItem.jasaPenunjang||0)+(editItem.bonusPrestasi||0))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-700">Total Potongan</span>
                  <span className="font-bold text-red-700">{formatRupiah((editItem.pajakPPh||0)+(editItem.iuranBPJS||0)+(editItem.potonganLain||0))}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-indigo-800">Netto Dibayar</span>
                  <span className="text-green-700">{formatRupiah((editItem.jasaMedis||0)+(editItem.jasaParamedis||0)+(editItem.jasaPenunjang||0)+(editItem.bonusPrestasi||0)-(editItem.pajakPPh||0)-(editItem.iuranBPJS||0)-(editItem.potonganLain||0))}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setEditItem(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  const totalJasaKotor = (editItem.jasaMedis||0)+(editItem.jasaParamedis||0)+(editItem.jasaPenunjang||0)+(editItem.bonusPrestasi||0);
                  const totalPotongan = (editItem.pajakPPh||0)+(editItem.iuranBPJS||0)+(editItem.potonganLain||0);
                  const nettoDibayar = totalJasaKotor - totalPotongan;
                  const localUpdate = { ...editItem, totalJasaKotor, totalPotongan, nettoDibayar };
                  const supabasePayload = { ...localUpdate, status: STATUS_TO_EN[editItem.status] || editItem.status };
                  setItems(items.map((i) => i.id === localUpdate.id ? localUpdate : i));
                  setEditItem(null);
                  showToast('success', 'Pembayaran Diperbarui', `${localUpdate.id} telah diperbarui`);
                  try {
                    await dataService.savePembayaran(supabasePayload);
                    loadFromSupabase();
                  } catch { showToast('warning', 'Updated locally only', 'Failed to sync to database'); }
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPayment && !showSlip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Detail Pembayaran</h3>
                <p className="text-xs text-green-100">{selectedPayment.id} · {selectedPayment.periode}</p>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="text-white/80 hover:text-white text-2xl">×</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Nama Nakes</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPayment.nakesNama}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">NIP</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPayment.nip}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Jabatan</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPayment.jabatan}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Unit</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPayment.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">No. Rekening</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPayment.noRekening}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Bank</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedPayment.bank}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Rincian Pendapatan</h4>
                <div className="space-y-2">
                  {selectedPayment.jasaMedis > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Jasa Medis</span>
                      <span className="font-semibold text-slate-800">{formatRupiah(selectedPayment.jasaMedis)}</span>
                    </div>
                  )}
                  {selectedPayment.jasaParamedis > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Jasa Paramedis</span>
                      <span className="font-semibold text-slate-800">{formatRupiah(selectedPayment.jasaParamedis)}</span>
                    </div>
                  )}
                  {selectedPayment.jasaPenunjang > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Jasa Penunjang</span>
                      <span className="font-semibold text-slate-800">{formatRupiah(selectedPayment.jasaPenunjang)}</span>
                    </div>
                  )}
                  {selectedPayment.bonusPrestasi > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Bonus Prestasi</span>
                      <span className="font-semibold text-slate-800">{formatRupiah(selectedPayment.bonusPrestasi)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200 font-bold">
                    <span className="text-slate-800">Total Jasa Kotor</span>
                    <span className="text-blue-700">{formatRupiah(selectedPayment.totalJasaKotor)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-bold text-slate-800 mb-3">Potongan</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Pajak PPh 21</span>
                    <span className="font-semibold text-red-700">-{formatRupiah(selectedPayment.pajakPPh)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Iuran BPJS Kesehatan</span>
                    <span className="font-semibold text-red-700">-{formatRupiah(selectedPayment.iuranBPJS)}</span>
                  </div>
                  {selectedPayment.potonganLain > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Potongan Lain</span>
                      <span className="font-semibold text-red-700">-{formatRupiah(selectedPayment.potonganLain)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-200 font-bold">
                    <span className="text-slate-800">Total Potongan</span>
                    <span className="text-red-700">-{formatRupiah(selectedPayment.totalPotongan)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-green-800">NETTO DIBAYAR</span>
                  <span className="text-xl font-bold text-green-700">{formatRupiah(selectedPayment.nettoDibayar)}</span>
                </div>
              </div>

              {selectedPayment.noBukti && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs text-blue-700">
                    <strong>No. Bukti Transfer:</strong> {selectedPayment.noBukti}
                  </p>
                  {selectedPayment.tanggalPembayaran && (
                    <p className="text-xs text-blue-600 mt-1">
                      Tanggal: {formatDate(selectedPayment.tanggalPembayaran)}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                onClick={() => setShowSlip(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
              >
                Lihat Slip Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slip Pembayaran Modal */}
      {showSlip && selectedPayment && (
        <SlipPembayaran payment={selectedPayment} onClose={() => setShowSlip(false)} />
      )}
    </div>
  );
}
