import { useState, useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Building2,
  Users,
  DollarSign,
  Hash,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  dataPendapatan,
  dataJasa,
  dataNakes,
  dataIndexing,
  dataHasil,
  dataActivityLog,
  dataPembayaran,
} from '../data/mockData';
import { formatRupiah, formatNumber, formatDateShort } from '../utils/helpers';
import { exportToExcel, exportToPDF, printPage } from '../utils/exporters';
import { getLaporanConfig } from '../utils/laporanConfigs';
import { useApp } from '../context/AppContext';
import type { LaporanItem } from '../data/mockData';

// ─── Konfigurasi setiap laporan ───────────────────────────────────────────────
interface LaporanConfig {
  getData: () => any[];
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center'; format?: 'currency' | 'number' | 'date' | 'badge' | 'text' }[];
  chartType?: 'bar' | 'area' | 'pie' | 'none';
  chartDataKey?: string;
  chartLabel?: string;
  summaryCards?: (data: any[]) => { label: string; value: string; icon: any; color: string }[];
  description?: string;
}

const COLORS = ['#0f766e', '#0891b2', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

function buildConfigs(): Record<string, LaporanConfig> {
  return {
    'LAP-001': {
      description: 'Rekap pendapatan per unit layanan harian periode Januari 2026.',
      getData: () => dataPendapatan.map((d, i) => ({
        no: i + 1, id: d.id, tanggal: d.tanggal, unit: d.unit,
        jenis: d.jenisPelayanan, pasien: d.jumlahPasien,
        pendapatan: d.nilaiPendapatan, operator: d.operator, status: d.status,
      })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'id', label: 'ID Transaksi', align: 'left' },
        { key: 'tanggal', label: 'Tanggal', format: 'date' },
        { key: 'unit', label: 'Unit', align: 'left' },
        { key: 'jenis', label: 'Jenis Layanan', align: 'left' },
        { key: 'pasien', label: 'Pasien', align: 'right', format: 'number' },
        { key: 'pendapatan', label: 'Pendapatan', align: 'right', format: 'currency' },
        { key: 'operator', label: 'Operator', align: 'left' },
        { key: 'status', label: 'Status', align: 'center', format: 'badge' },
      ],
      chartType: 'bar',
      chartDataKey: 'pendapatan',
      chartLabel: 'unit',
      summaryCards: (data) => [
        { label: 'Total Pendapatan', value: formatRupiah(data.reduce((s: number, d: any) => s + d.pendapatan, 0)), icon: DollarSign, color: 'text-teal-700 bg-teal-50 border-teal-200' },
        { label: 'Total Transaksi', value: formatNumber(data.length), icon: Hash, color: 'text-blue-700 bg-blue-50 border-blue-200' },
        { label: 'Total Pasien', value: formatNumber(data.reduce((s: number, d: any) => s + d.pasien, 0)), icon: Users, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        { label: 'Sudah Disetujui', value: formatNumber(data.filter((d: any) => d.status === 'approved').length), icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      ],
    },
    'LAP-002': {
      description: 'Distribusi jasa medis, paramedis, dan penunjang per tenaga kesehatan periode Januari 2026.',
      getData: () => dataJasa.map((d, i) => ({
        no: i + 1, id: d.id, periode: d.periode, nakes: d.nakes,
        jabatan: d.jabatan, unit: d.unit, tarif: d.tarifJasa,
        tindakan: d.jumlahTindakan, total: d.totalJasa, status: d.status,
      })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'id', label: 'ID', align: 'left' },
        { key: 'nakes', label: 'Nama Nakes', align: 'left' },
        { key: 'jabatan', label: 'Jabatan', align: 'left' },
        { key: 'unit', label: 'Unit', align: 'left' },
        { key: 'tarif', label: 'Tarif/Tindakan', align: 'right', format: 'currency' },
        { key: 'tindakan', label: 'Tindakan', align: 'right', format: 'number' },
        { key: 'total', label: 'Total Jasa', align: 'right', format: 'currency' },
        { key: 'status', label: 'Status', align: 'center', format: 'badge' },
      ],
      chartType: 'bar',
      chartDataKey: 'total',
      chartLabel: 'nakes',
      summaryCards: (data) => [
        { label: 'Total Jasa', value: formatRupiah(data.reduce((s: number, d: any) => s + d.total, 0)), icon: DollarSign, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
        { label: 'Jumlah Nakes', value: formatNumber(data.length), icon: Users, color: 'text-teal-700 bg-teal-50 border-teal-200' },
        { label: 'Total Tindakan', value: formatNumber(data.reduce((s: number, d: any) => s + d.tindakan, 0)), icon: Hash, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        { label: 'Sudah Dibayar', value: formatNumber(data.filter((d: any) => d.status === 'paid').length), icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      ],
    },
    'LAP-003': {
      description: 'Daftar tenaga kesehatan aktif, kualifikasi, dan kinerja remunerasi periode Januari 2026.',
      getData: () => dataNakes.map((d, i) => ({
        no: i + 1, id: d.id, nama: d.nama, jabatan: d.jabatan,
        unit: d.unit, noStr: d.noStr, pendidikan: d.pendidikan,
        jasa: d.jasaPerTindakan, tindakan: d.totalTindakan,
        total: d.totalJasa, rating: d.rating,
        status: d.statusAktif ? 'aktif' : 'nonaktif',
      })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'id', label: 'ID', align: 'left' },
        { key: 'nama', label: 'Nama', align: 'left' },
        { key: 'jabatan', label: 'Jabatan', align: 'left' },
        { key: 'unit', label: 'Unit', align: 'left' },
        { key: 'pendidikan', label: 'Pendidikan', align: 'left' },
        { key: 'tindakan', label: 'Tindakan', align: 'right', format: 'number' },
        { key: 'total', label: 'Total Jasa', align: 'right', format: 'currency' },
        { key: 'rating', label: 'Rating', align: 'center' },
      ],
      chartType: 'bar',
      chartDataKey: 'total',
      chartLabel: 'nama',
      summaryCards: (data) => [
        { label: 'Total Nakes', value: formatNumber(data.length), icon: Users, color: 'text-rose-700 bg-rose-50 border-rose-200' },
        { label: 'Aktif', value: formatNumber(data.filter((d: any) => d.status === 'aktif').length), icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Total Jasa', value: formatRupiah(data.reduce((s: number, d: any) => s + d.total, 0)), icon: DollarSign, color: 'text-teal-700 bg-teal-50 border-teal-200' },
        { label: 'Rata-rata Rating', value: (data.reduce((s: number, d: any) => s + d.rating, 0) / data.length).toFixed(1), icon: TrendingUp, color: 'text-amber-700 bg-amber-50 border-amber-200' },
      ],
    },
    'LAP-004': {
      description: 'Analisis profitabilitas pendapatan vs total beban dan distribusi jasa per unit layanan.',
      getData: () => dataHasil.map((d, i) => ({
        no: i + 1, id: d.id, periode: d.periode, unit: d.unit,
        pendapatan: d.totalPendapatan, beban: d.totalBeban,
        jasaMedis: d.totalJasaMedis, paramedis: d.totalJasaParamedis,
        penunjang: d.totalJasaPenunjang, bonus: d.bonusPrestasi,
        pajak: d.pajak, netto: d.netto, status: d.status,
        profitability: Math.round((d.netto / d.totalPendapatan) * 100),
      })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'unit', label: 'Unit', align: 'left' },
        { key: 'pendapatan', label: 'Pendapatan', align: 'right', format: 'currency' },
        { key: 'beban', label: 'Beban', align: 'right', format: 'currency' },
        { key: 'jasaMedis', label: 'Jasa Medis', align: 'right', format: 'currency' },
        { key: 'paramedis', label: 'Paramedis', align: 'right', format: 'currency' },
        { key: 'netto', label: 'Netto', align: 'right', format: 'currency' },
        { key: 'profitability', label: 'Profitability %', align: 'center' },
        { key: 'status', label: 'Status', align: 'center', format: 'badge' },
      ],
      chartType: 'bar',
      chartDataKey: 'netto',
      chartLabel: 'unit',
      summaryCards: (data) => [
        { label: 'Total Pendapatan', value: formatRupiah(data.reduce((s: number, d: any) => s + d.pendapatan, 0)), icon: TrendingUp, color: 'text-teal-700 bg-teal-50 border-teal-200' },
        { label: 'Total Netto', value: formatRupiah(data.reduce((s: number, d: any) => s + d.netto, 0)), icon: DollarSign, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Total Beban', value: formatRupiah(data.reduce((s: number, d: any) => s + d.beban, 0)), icon: TrendingDown, color: 'text-rose-700 bg-rose-50 border-rose-200' },
        { label: 'Jumlah Unit', value: formatNumber(data.length), icon: Building2, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
      ],
    },
    'LAP-005': {
      description: 'Rekap jumlah kunjungan pasien dan nilai transaksi per unit layanan.',
      getData: () => dataPendapatan.map((d, i) => ({
        no: i + 1, unit: d.unit, jenis: d.jenisPelayanan,
        pasien: d.jumlahPasien, pendapatan: d.nilaiPendapatan,
        avgPerPasien: Math.round(d.nilaiPendapatan / d.jumlahPasien),
        operator: d.operator, tanggal: d.tanggal, status: d.status,
      })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'unit', label: 'Unit', align: 'left' },
        { key: 'jenis', label: 'Jenis Layanan', align: 'left' },
        { key: 'pasien', label: 'Jml Pasien', align: 'right', format: 'number' },
        { key: 'pendapatan', label: 'Total Pendapatan', align: 'right', format: 'currency' },
        { key: 'avgPerPasien', label: 'Avg/Pasien', align: 'right', format: 'currency' },
        { key: 'operator', label: 'Operator', align: 'left' },
        { key: 'status', label: 'Status', align: 'center', format: 'badge' },
      ],
      chartType: 'bar',
      chartDataKey: 'pasien',
      chartLabel: 'unit',
      summaryCards: (data) => [
        { label: 'Total Pasien', value: formatNumber(data.reduce((s: number, d: any) => s + d.pasien, 0)), icon: Users, color: 'text-sky-700 bg-sky-50 border-sky-200' },
        { label: 'Total Transaksi', value: formatNumber(data.length), icon: Hash, color: 'text-teal-700 bg-teal-50 border-teal-200' },
        { label: 'Total Pendapatan', value: formatRupiah(data.reduce((s: number, d: any) => s + d.pendapatan, 0)), icon: DollarSign, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Rata-rata/Pasien', value: formatRupiah(Math.round(data.reduce((s: number, d: any) => s + d.pendapatan, 0) / data.reduce((s: number, d: any) => s + d.pasien, 0))), icon: BarChart3, color: 'text-amber-700 bg-amber-50 border-amber-200' },
      ],
    },
    'LAP-006': {
      description: 'Master data bobot dan skala indexing remunerasi yang digunakan sebagai dasar perhitungan jasa.',
      getData: () => dataIndexing.map((d, i) => ({
        no: i + 1, kode: d.kodeIndex, nama: d.namaIndex,
        kategori: d.kategori, bobot: d.bobot, keterangan: d.keterangan,
        status: d.aktif ? 'active' : 'inactive',
      })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'kode', label: 'Kode', align: 'left' },
        { key: 'nama', label: 'Nama Index', align: 'left' },
        { key: 'kategori', label: 'Kategori', align: 'left' },
        { key: 'bobot', label: 'Bobot', align: 'center' },
        { key: 'keterangan', label: 'Keterangan', align: 'left' },
      ],
      chartType: 'bar',
      chartDataKey: 'bobot',
      chartLabel: 'nama',
      summaryCards: (data) => [
        { label: 'Total Index', value: formatNumber(data.length), icon: Hash, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
        { label: 'Index Aktif', value: formatNumber(data.filter((d: any) => d.status === 'active').length), icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Total Bobot', value: data.reduce((s: number, d: any) => s + d.bobot, 0).toFixed(2), icon: BarChart3, color: 'text-teal-700 bg-teal-50 border-teal-200' },
        { label: 'Jumlah Kategori', value: formatNumber(new Set(data.map((d: any) => d.kategori)).size), icon: Building2, color: 'text-amber-700 bg-amber-50 border-amber-200' },
      ],
    },
    'LAP-007': {
      description: 'Catatan lengkap aktivitas seluruh pengguna sistem SIM Remunerasi.',
      getData: () => dataActivityLog.map((d, i) => ({
        no: i + 1, id: d.id, waktu: d.timestamp,
        user: d.user, aksi: d.action, target: d.target,
        detail: d.detail, modul: d.module,
      })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'waktu', label: 'Waktu', align: 'left' },
        { key: 'user', label: 'Pengguna', align: 'left' },
        { key: 'aksi', label: 'Aksi', align: 'left' },
        { key: 'modul', label: 'Modul', align: 'center' },
        { key: 'target', label: 'Target', align: 'left' },
        { key: 'detail', label: 'Detail', align: 'left' },
      ],
      chartType: 'none',
      summaryCards: (data) => [
        { label: 'Total Aktivitas', value: formatNumber(data.length), icon: Hash, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
        { label: 'Pengguna Unik', value: formatNumber(new Set(data.map((d: any) => d.user)).size), icon: Users, color: 'text-teal-700 bg-teal-50 border-teal-200' },
        { label: 'Modul Diakses', value: formatNumber(new Set(data.map((d: any) => d.modul)).size), icon: Building2, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        { label: 'Aktivitas Hari Ini', value: formatNumber(data.filter((d: any) => d.waktu.startsWith('2026-01-15')).length), icon: Clock, color: 'text-rose-700 bg-rose-50 border-rose-200' },
      ],
    },
    'LAP-008': {
      description: 'Rekap potongan Pajak Penghasilan (PPh 21) setiap tenaga kesehatan periode Januari 2026.',
      getData: () => dataPembayaran.map((d, i) => ({
        no: i + 1, id: d.id, nama: d.nakesNama, nip: d.nip,
        jabatan: d.jabatan, unit: d.unit, totalKotor: d.totalJasaKotor,
        pajakPPh: d.pajakPPh, bpjs: d.iuranBPJS,
        totalPotongan: d.totalPotongan, netto: d.nettoDibayar, status: d.status,
      })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'nama', label: 'Nama Nakes', align: 'left' },
        { key: 'jabatan', label: 'Jabatan', align: 'left' },
        { key: 'unit', label: 'Unit', align: 'left' },
        { key: 'totalKotor', label: 'Total Kotor', align: 'right', format: 'currency' },
        { key: 'pajakPPh', label: 'PPh 21', align: 'right', format: 'currency' },
        { key: 'bpjs', label: 'BPJS', align: 'right', format: 'currency' },
        { key: 'totalPotongan', label: 'Total Potongan', align: 'right', format: 'currency' },
        { key: 'netto', label: 'Netto', align: 'right', format: 'currency' },
      ],
      chartType: 'bar',
      chartDataKey: 'pajakPPh',
      chartLabel: 'nama',
      summaryCards: (data) => [
        { label: 'Total PPh 21', value: formatRupiah(data.reduce((s: number, d: any) => s + d.pajakPPh, 0)), icon: AlertCircle, color: 'text-rose-700 bg-rose-50 border-rose-200' },
        { label: 'Total BPJS', value: formatRupiah(data.reduce((s: number, d: any) => s + d.bpjs, 0)), icon: DollarSign, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        { label: 'Total Potongan', value: formatRupiah(data.reduce((s: number, d: any) => s + d.totalPotongan, 0)), icon: TrendingDown, color: 'text-red-700 bg-red-50 border-red-200' },
        { label: 'Total Netto', value: formatRupiah(data.reduce((s: number, d: any) => s + d.netto, 0)), icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      ],
    },
    'LAP-009': {
      description: 'Detail slip pembayaran remunerasi setiap tenaga kesehatan periode Januari 2026.',
      getData: () => dataPembayaran.map((d, i) => ({
        no: i + 1, id: d.id, nama: d.nakesNama, jabatan: d.jabatan,
        unit: d.unit, noRek: d.noRekening, bank: d.bank,
        jasaMedis: d.jasaMedis, jasaParamedis: d.jasaParamedis,
        jasaPenunjang: d.jasaPenunjang, bonus: d.bonusPrestasi,
        totalKotor: d.totalJasaKotor, totalPotongan: d.totalPotongan,
        netto: d.nettoDibayar, status: d.status, noBukti: d.noBukti || '-',
      })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'nama', label: 'Nama Nakes', align: 'left' },
        { key: 'jabatan', label: 'Jabatan', align: 'left' },
        { key: 'bank', label: 'Bank', align: 'center' },
        { key: 'totalKotor', label: 'Total Kotor', align: 'right', format: 'currency' },
        { key: 'totalPotongan', label: 'Potongan', align: 'right', format: 'currency' },
        { key: 'netto', label: 'Netto', align: 'right', format: 'currency' },
        { key: 'status', label: 'Status', align: 'center', format: 'badge' },
        { key: 'noBukti', label: 'No. Bukti', align: 'left' },
      ],
      chartType: 'bar',
      chartDataKey: 'netto',
      chartLabel: 'nama',
      summaryCards: (data) => [
        { label: 'Total Netto Dibayar', value: formatRupiah(data.reduce((s: number, d: any) => s + d.netto, 0)), icon: DollarSign, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Sudah Dibayar', value: formatNumber(data.filter((d: any) => d.status === 'dibayar').length), icon: CheckCircle2, color: 'text-green-700 bg-green-50 border-green-200' },
        { label: 'Menunggu', value: formatNumber(data.filter((d: any) => ['draft', 'final', 'disetujui'].includes(d.status)).length), icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        { label: 'Dibatalkan', value: formatNumber(data.filter((d: any) => d.status === 'dibatalkan').length), icon: AlertCircle, color: 'text-rose-700 bg-rose-50 border-rose-200' },
      ],
    },
    'LAP-010': {
      description: 'Rekap total pembayaran remunerasi dikelompokkan per unit dan jabatan.',
      getData: () => {
        const byUnit: Record<string, { unit: string; totalNakes: number; totalKotor: number; totalPotongan: number; totalNetto: number }> = {};
        dataPembayaran.forEach((d) => {
          if (!byUnit[d.unit]) byUnit[d.unit] = { unit: d.unit, totalNakes: 0, totalKotor: 0, totalPotongan: 0, totalNetto: 0 };
          byUnit[d.unit].totalNakes++;
          byUnit[d.unit].totalKotor += d.totalJasaKotor;
          byUnit[d.unit].totalPotongan += d.totalPotongan;
          byUnit[d.unit].totalNetto += d.nettoDibayar;
        });
        return Object.values(byUnit).map((d, i) => ({ no: i + 1, ...d }));
      },
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'unit', label: 'Unit', align: 'left' },
        { key: 'totalNakes', label: 'Jml Nakes', align: 'center', format: 'number' },
        { key: 'totalKotor', label: 'Total Kotor', align: 'right', format: 'currency' },
        { key: 'totalPotongan', label: 'Total Potongan', align: 'right', format: 'currency' },
        { key: 'totalNetto', label: 'Total Netto', align: 'right', format: 'currency' },
      ],
      chartType: 'bar',
      chartDataKey: 'totalNetto',
      chartLabel: 'unit',
      summaryCards: (data) => [
        { label: 'Jumlah Unit', value: formatNumber(data.length), icon: Building2, color: 'text-teal-700 bg-teal-50 border-teal-200' },
        { label: 'Total Nakes', value: formatNumber(data.reduce((s: number, d: any) => s + d.totalNakes, 0)), icon: Users, color: 'text-blue-700 bg-blue-50 border-blue-200' },
        { label: 'Total Kotor', value: formatRupiah(data.reduce((s: number, d: any) => s + d.totalKotor, 0)), icon: TrendingUp, color: 'text-amber-700 bg-amber-50 border-amber-200' },
        { label: 'Total Netto', value: formatRupiah(data.reduce((s: number, d: any) => s + d.totalNetto, 0)), icon: DollarSign, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
      ],
    },
    'LAP-011': {
      description: 'File batch transfer bank untuk pembayaran remunerasi yang telah disetujui.',
      getData: () => dataPembayaran.filter((d) => d.status !== 'dibatalkan').map((d, i) => ({
        no: i + 1, noRekening: d.noRekening, nama: d.nakesNama,
        nominal: d.nettoDibayar, bank: d.bank, referensi: d.id,
        keterangan: `Remunerasi ${d.periode}`, status: d.status,
      })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'noRekening', label: 'No. Rekening', align: 'left' },
        { key: 'nama', label: 'Nama Penerima', align: 'left' },
        { key: 'bank', label: 'Bank', align: 'center' },
        { key: 'nominal', label: 'Nominal', align: 'right', format: 'currency' },
        { key: 'referensi', label: 'Referensi', align: 'left' },
        { key: 'keterangan', label: 'Keterangan', align: 'left' },
        { key: 'status', label: 'Status', align: 'center', format: 'badge' },
      ],
      chartType: 'none',
      summaryCards: (data) => [
        { label: 'Total Transfer', value: formatRupiah(data.reduce((s: number, d: any) => s + d.nominal, 0)), icon: DollarSign, color: 'text-green-700 bg-green-50 border-green-200' },
        { label: 'Jumlah Penerima', value: formatNumber(data.length), icon: Users, color: 'text-teal-700 bg-teal-50 border-teal-200' },
        { label: 'Sudah Ditransfer', value: formatNumber(data.filter((d: any) => d.status === 'dibayar').length), icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
        { label: 'Menunggu Transfer', value: formatNumber(data.filter((d: any) => d.status === 'disetujui').length), icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
      ],
    },
  };
}

// ─── Badge renderer ───────────────────────────────────────────────────────────
function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-700 border-rose-200',
    verified: 'bg-sky-100 text-sky-700 border-sky-200',
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    final: 'bg-blue-100 text-blue-700 border-blue-200',
    disetujui: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dibayar: 'bg-green-100 text-green-700 border-green-200',
    dibatalkan: 'bg-red-100 text-red-700 border-red-200',
    aktif: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    nonaktif: 'bg-slate-100 text-slate-600 border-slate-200',
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  const labelMap: Record<string, string> = {
    pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak',
    verified: 'Terverifikasi', paid: 'Dibayar', draft: 'Draft',
    final: 'Final', disetujui: 'Disetujui', dibayar: 'Dibayar',
    dibatalkan: 'Dibatalkan', aktif: 'Aktif', nonaktif: 'Nonaktif',
    active: 'Aktif', inactive: 'Nonaktif',
  };
  const cls = map[value] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {labelMap[value] || value}
    </span>
  );
}

// ─── Format cell ──────────────────────────────────────────────────────────────
function CellValue({ value, format }: { value: any; format?: string }) {
  if (format === 'currency') return <span className="font-semibold">{formatRupiah(Number(value))}</span>;
  if (format === 'number') return <span>{formatNumber(Number(value))}</span>;
  if (format === 'date') return <span>{formatDateShort(String(value))}</span>;
  if (format === 'badge') return <StatusBadge value={String(value)} />;
  return <span>{String(value ?? '-')}</span>;
}

// ─── Komponen utama ───────────────────────────────────────────────────────────
interface PreviewLaporanProps {
  item: LaporanItem;
  onClose: () => void;
}

const PAGE_SIZE = 10;

export default function PreviewLaporan({ item, onClose }: PreviewLaporanProps) {
  const { showToast } = useApp();
  const configs = useMemo(() => buildConfigs(), []);
  const config = configs[item.id];

  const rawData = useMemo(() => (config ? config.getData() : []), [config]);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState<'tabel' | 'grafik'>('tabel');

  // Filter, sort, paginate
  const filtered = useMemo(() => {
    let d = rawData;
    if (search) {
      const q = search.toLowerCase();
      d = d.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(q)));
    }
    if (sortKey) {
      d = [...d].sort((a, b) => {
        const av = a[sortKey]; const bv = b[sortKey];
        const diff = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? diff : -diff;
      });
    }
    return d;
  }, [rawData, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  // Chart data (take top 8 for readability)
  const chartData = useMemo(() => {
    if (!config?.chartDataKey || !config?.chartLabel) return [];
    return filtered.slice(0, 8).map((d) => ({
      label: String(d[config.chartLabel!] ?? '').substring(0, 20),
      nilai: Number(d[config.chartDataKey!] ?? 0),
    }));
  }, [filtered, config]);

  // Export — pakai excelCols / pdfCols dari laporanConfigs (data nyata, lebar tepat)
  const handleExportExcel = () => {
    if (!config) return;
    const sharedCfg = getLaporanConfig(item.id);
    const cols = sharedCfg?.excelCols ?? config.columns.map((c) => ({
      header: c.label,
      key: c.key,
      format: (c.format === 'currency' || c.format === 'number' ? c.format : 'text') as any,
      width: c.format === 'currency' ? 20 : c.key === 'no' ? 6 : 18,
    }));
    exportToExcel(
      item.nama.replace(/\s+/g, '_'),
      (sharedCfg?.sheetName ?? item.nama).substring(0, 31),
      cols,
      filtered,
      {
        title: item.nama.toUpperCase(),
        subtitle: `${item.deskripsi} | ${formatNumber(filtered.length)} baris | ${formatDateShort(item.terakhir_dibuat)}`,
      }
    );
    showToast('success', 'Export Excel berhasil', `${formatNumber(filtered.length)} baris diekspor`);
  };

  const handleExportPDF = () => {
    if (!config) return;
    const sharedCfg = getLaporanConfig(item.id);
    const cols = sharedCfg?.pdfCols ?? config.columns.map((c) => ({
      header: c.label,
      key: c.key,
      format: (c.format === 'currency' || c.format === 'number' ? c.format : 'text') as any,
      width: c.format === 'currency' ? 20 : c.key === 'no' ? 6 : 16,
    }));
    exportToPDF(
      item.nama.replace(/\s+/g, '_'),
      item.nama,
      cols,
      filtered,
      {
        subtitle: `${item.deskripsi} | ${formatNumber(filtered.length)} baris | ${formatDateShort(item.terakhir_dibuat)}`,
        orientation: sharedCfg?.orientasi ?? 'l',
      }
    );
    showToast('success', 'Export PDF berhasil', `${formatNumber(filtered.length)} baris diekspor`);
  };

  const handlePrint = () => {
    showToast('info', 'Menyiapkan cetak laporan...');
    setTimeout(printPage, 300);
  };

  if (!config) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Konfigurasi laporan tidak ditemukan</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">Tutup</button>
        </div>
      </div>
    );
  }

  const summaryCards = config.summaryCards?.(filtered) ?? [];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden animate-pop">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white px-6 py-5 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-xl leading-tight">{item.nama}</h2>
                <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-semibold">{item.id}</span>
                <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-semibold">{item.kategori}</span>
                <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-semibold">{item.frekuensi}</span>
              </div>
              <p className="text-emerald-100 text-xs mt-1 line-clamp-1">{config.description || item.deskripsi}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-emerald-100">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Terakhir: {formatDateShort(item.terakhir_dibuat)}</span>
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {formatNumber(filtered.length)} baris</span>
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {item.ukuran}</span>
              </div>
            </div>
          </div>
          {/* Toolbar aksi */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold transition" title="Export Excel">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold transition" title="Export PDF">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-semibold transition" title="Cetak">
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">

            {/* Summary cards */}
            {summaryCards.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className={`border rounded-2xl p-4 ${card.color} flex items-center gap-3`}>
                      <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] opacity-80 font-medium">{card.label}</p>
                        <p className="text-lg font-bold leading-tight truncate">{card.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                {(['tabel', ...(config.chartType !== 'none' ? ['grafik'] : [])] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition capitalize ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {tab === 'tabel' ? '📋 Tabel Data' : '📊 Grafik'}
                  </button>
                ))}
              </div>
              {/* Search & refresh */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Cari dalam laporan..."
                    className="bg-transparent focus:outline-none w-52 text-slate-700 placeholder:text-slate-400"
                  />
                  {search && (
                    <button onClick={() => { setSearch(''); setPage(1); }} className="text-slate-400 hover:text-slate-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => { setSearch(''); setPage(1); setSortKey(''); showToast('success', 'Tampilan direset'); }}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
                  title="Reset filter"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Tab: Tabel ── */}
            {activeTab === 'tabel' && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {config.columns.map((col) => (
                          <th
                            key={col.key}
                            className={`px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide cursor-pointer hover:bg-slate-100 select-none whitespace-nowrap ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                            onClick={() => handleSort(col.key)}
                          >
                            <span className="flex items-center gap-1 justify-inherit">
                              {col.label}
                              {sortKey === col.key && (
                                <span className="text-teal-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.map((row, ri) => (
                        <tr key={ri} className="border-b border-slate-100 hover:bg-emerald-50/40 transition-colors">
                          {config.columns.map((col) => (
                            <td
                              key={col.key}
                              className={`px-4 py-2.5 text-slate-700 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.key === 'no' ? 'text-slate-400 text-xs w-10' : ''}`}
                            >
                              <CellValue value={row[col.key]} format={col.format} />
                            </td>
                          ))}
                        </tr>
                      ))}
                      {pageData.length === 0 && (
                        <tr>
                          <td colSpan={config.columns.length} className="py-12 text-center text-slate-400">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>Tidak ada data yang cocok</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Menampilkan <b>{((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</b> dari <b>{formatNumber(filtered.length)}</b> baris
                    {search && <span className="text-teal-600 ml-1">(difilter dari {formatNumber(rawData.length)})</span>}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                      return (
                        <button
                          key={pg}
                          onClick={() => setPage(pg)}
                          className={`w-8 h-8 text-xs rounded-lg font-medium transition ${pg === page ? 'bg-teal-600 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'}`}
                        >
                          {pg}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab: Grafik ── */}
            {activeTab === 'grafik' && config.chartType !== 'none' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">Visualisasi Data</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Menampilkan {Math.min(chartData.length, 8)} data teratas berdasarkan kolom aktif
                    </p>
                  </div>
                </div>

                {config.chartType === 'bar' && (
                  <ResponsiveContainer width="100%" height={360}>
                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                        height={80}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) =>
                          v >= 1_000_000_000 ? `${(v / 1_000_000_000).toFixed(1)}M`
                          : v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)} Jt`
                          : formatNumber(v)
                        }
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v: any) => {
                          const num = Number(v);
                          return num > 100_000 ? formatRupiah(num) : formatNumber(num);
                        }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Bar dataKey="nilai" name={config.chartDataKey} radius={[6, 6, 0, 0]} barSize={40}>
                        {chartData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {config.chartType === 'area' && (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
                      <Area type="monotone" dataKey="nilai" stroke="#0f766e" strokeWidth={3} fill="url(#grad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {config.chartType === 'pie' && (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={chartData} dataKey="nilai" nameKey="label" cx="50%" cy="50%" outerRadius={120} paddingAngle={3}>
                        {chartData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {/* Legend manual */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                  {chartData.map((d, idx) => (
                    <div key={d.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {d.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-slate-500">
            Data terakhir diperbarui: <b>{formatDateShort(item.terakhir_dibuat)}</b> · {item.ukuran}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition">
              Tutup
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition">
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
