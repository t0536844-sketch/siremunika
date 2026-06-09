/**
 * laporanConfigs.ts
 * Konfigurasi tunggal yang dipakai bersama oleh:
 *  - PreviewLaporan (tampilan tabel + grafik di modal)
 *  - Laporan.tsx (tombol XLSX dan PDF di kartu laporan)
 *
 * Setiap konfigurasi mendefinisikan:
 *  - getData()  : fungsi yang mengambil data nyata dari mockData
 *  - columns    : definisi kolom (key, label, align, format)
 *  - excelCols  : kolom khusus untuk export Excel (width, format number/currency)
 *  - pdfCols    : kolom khusus untuk export PDF (width lebih ringkas)
 *  - sheetName  : nama sheet Excel (maks 31 karakter)
 *  - orientasi  : 'l' landscape | 'p' portrait untuk PDF
 */

import {
  dataPendapatan,
  dataJasa,
  dataNakes,
  dataIndexing,
  dataHasil,
  dataActivityLog,
  dataPembayaran,
} from '../data/mockData';
import { formatDateShort } from './helpers';
import type { ExportColumn } from './exporters';

// ─── Tipe kolom tampilan tabel (preview) ──────────────────────────────────────
export interface ColDef {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: 'currency' | 'number' | 'date' | 'badge' | 'text';
}

// ─── Konfigurasi per laporan ──────────────────────────────────────────────────
export interface LaporanConfig {
  sheetName: string;           // nama sheet Excel, maks 31 karakter
  orientasi: 'l' | 'p';       // landscape | portrait untuk PDF
  description: string;
  columns: ColDef[];           // kolom untuk tabel preview
  excelCols: ExportColumn[];   // kolom + lebar untuk ekspor Excel
  pdfCols: ExportColumn[];     // kolom + lebar (lebih ringkas) untuk PDF
  chartType?: 'bar' | 'area' | 'pie' | 'none';
  chartDataKey?: string;
  chartLabel?: string;
  getData: () => Record<string, any>[];
}

// ─── Fungsi builder ────────────────────────────────────────────────────────────
export function getLaporanConfig(id: string): LaporanConfig | null {
  const configs: Record<string, LaporanConfig> = {

    /* ── LAP-001: Laporan Pendapatan Harian ── */
    'LAP-001': {
      sheetName: 'Pendapatan Harian',
      orientasi: 'l',
      description: 'Rekap pendapatan per unit layanan harian periode Januari 2026.',
      getData: () =>
        dataPendapatan.map((d, i) => ({
          no: i + 1,
          id: d.id,
          tanggal: formatDateShort(d.tanggal),
          unit: d.unit,
          jenis: d.jenisPelayanan,
          pasien: d.jumlahPasien,
          pendapatan: d.nilaiPendapatan,
          operator: d.operator,
          status: d.status,
        })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'id', label: 'ID Transaksi', align: 'left' },
        { key: 'tanggal', label: 'Tanggal', align: 'left' },
        { key: 'unit', label: 'Unit', align: 'left' },
        { key: 'jenis', label: 'Jenis Layanan', align: 'left' },
        { key: 'pasien', label: 'Pasien', align: 'right', format: 'number' },
        { key: 'pendapatan', label: 'Pendapatan (Rp)', align: 'right', format: 'currency' },
        { key: 'operator', label: 'Operator', align: 'left' },
        { key: 'status', label: 'Status', align: 'center', format: 'badge' },
      ],
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'ID Transaksi', key: 'id', width: 18 },
        { header: 'Tanggal', key: 'tanggal', width: 16 },
        { header: 'Unit', key: 'unit', width: 22 },
        { header: 'Jenis Layanan', key: 'jenis', width: 18 },
        { header: 'Jml Pasien', key: 'pasien', format: 'number', width: 12 },
        { header: 'Pendapatan (Rp)', key: 'pendapatan', format: 'currency', width: 22 },
        { header: 'Operator', key: 'operator', width: 24 },
        { header: 'Status', key: 'status', width: 14 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 6 },
        { header: 'ID', key: 'id', width: 16 },
        { header: 'Tanggal', key: 'tanggal', width: 14 },
        { header: 'Unit', key: 'unit', width: 22 },
        { header: 'Jenis', key: 'jenis', width: 18 },
        { header: 'Pasien', key: 'pasien', format: 'number', width: 10 },
        { header: 'Pendapatan', key: 'pendapatan', format: 'currency', width: 22 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      chartType: 'bar', chartDataKey: 'pendapatan', chartLabel: 'unit',
    },

    /* ── LAP-002: Laporan Jasa Medis Bulanan ── */
    'LAP-002': {
      sheetName: 'Jasa Medis Bulanan',
      orientasi: 'l',
      description: 'Distribusi jasa medis, paramedis, dan penunjang per tenaga kesehatan periode Januari 2026.',
      getData: () =>
        dataJasa.map((d, i) => ({
          no: i + 1,
          id: d.id,
          periode: d.periode,
          nakes: d.nakes,
          jabatan: d.jabatan,
          unit: d.unit,
          tarif: d.tarifJasa,
          tindakan: d.jumlahTindakan,
          total: d.totalJasa,
          status: d.status,
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
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'ID', key: 'id', width: 18 },
        { header: 'Periode', key: 'periode', width: 16 },
        { header: 'Nama Nakes', key: 'nakes', width: 28 },
        { header: 'Jabatan', key: 'jabatan', width: 24 },
        { header: 'Unit', key: 'unit', width: 22 },
        { header: 'Tarif/Tindakan', key: 'tarif', format: 'currency', width: 18 },
        { header: 'Jml Tindakan', key: 'tindakan', format: 'number', width: 14 },
        { header: 'Total Jasa', key: 'total', format: 'currency', width: 22 },
        { header: 'Status', key: 'status', width: 14 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Nama Nakes', key: 'nakes', width: 24 },
        { header: 'Jabatan', key: 'jabatan', width: 22 },
        { header: 'Unit', key: 'unit', width: 18 },
        { header: 'Tindakan', key: 'tindakan', format: 'number', width: 12 },
        { header: 'Total Jasa', key: 'total', format: 'currency', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      chartType: 'bar', chartDataKey: 'total', chartLabel: 'nakes',
    },

    /* ── LAP-003: Rekapitulasi Nakes ── */
    'LAP-003': {
      sheetName: 'Rekapitulasi Nakes',
      orientasi: 'l',
      description: 'Daftar tenaga kesehatan aktif, kualifikasi, dan kinerja remunerasi periode Januari 2026.',
      getData: () =>
        dataNakes.map((d, i) => ({
          no: i + 1,
          id: d.id,
          nip: d.nip,
          nama: d.nama,
          jabatan: d.jabatan,
          unit: d.unit,
          noStr: d.noStr,
          noSip: d.noSip,
          pendidikan: d.pendidikan,
          tglLahir: formatDateShort(d.tanggalLahir),
          tglMasuk: formatDateShort(d.tanggalMasuk),
          jasa: d.jasaPerTindakan,
          tindakan: d.totalTindakan,
          total: d.totalJasa,
          rating: d.rating,
          status: d.statusAktif ? 'Aktif' : 'Nonaktif',
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
        { key: 'status', label: 'Status', align: 'center', format: 'badge' },
      ],
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'ID', key: 'id', width: 10 },
        { header: 'NIP', key: 'nip', width: 22 },
        { header: 'Nama', key: 'nama', width: 30 },
        { header: 'Jabatan', key: 'jabatan', width: 24 },
        { header: 'Unit', key: 'unit', width: 22 },
        { header: 'No. STR', key: 'noStr', width: 18 },
        { header: 'No. SIP', key: 'noSip', width: 18 },
        { header: 'Pendidikan', key: 'pendidikan', width: 24 },
        { header: 'Tgl Lahir', key: 'tglLahir', width: 14 },
        { header: 'Tgl Masuk', key: 'tglMasuk', width: 14 },
        { header: 'Jasa/Tindakan', key: 'jasa', format: 'currency', width: 18 },
        { header: 'Jml Tindakan', key: 'tindakan', format: 'number', width: 14 },
        { header: 'Total Jasa', key: 'total', format: 'currency', width: 22 },
        { header: 'Rating', key: 'rating', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Nama', key: 'nama', width: 24 },
        { header: 'Jabatan', key: 'jabatan', width: 22 },
        { header: 'Unit', key: 'unit', width: 18 },
        { header: 'Tindakan', key: 'tindakan', format: 'number', width: 12 },
        { header: 'Total Jasa', key: 'total', format: 'currency', width: 20 },
        { header: 'Rating', key: 'rating', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      chartType: 'bar', chartDataKey: 'total', chartLabel: 'nama',
    },

    /* ── LAP-004: Analisis Profitabilitas Unit ── */
    'LAP-004': {
      sheetName: 'Profitabilitas Unit',
      orientasi: 'l',
      description: 'Analisis profitabilitas pendapatan vs total beban dan distribusi jasa per unit layanan.',
      getData: () =>
        dataHasil.map((d, i) => ({
          no: i + 1,
          id: d.id,
          periode: d.periode,
          unit: d.unit,
          pendapatan: d.totalPendapatan,
          beban: d.totalBeban,
          jasaMedis: d.totalJasaMedis,
          paramedis: d.totalJasaParamedis,
          penunjang: d.totalJasaPenunjang,
          bonus: d.bonusPrestasi,
          pajak: d.pajak,
          netto: d.netto,
          profitability: `${Math.round((d.netto / d.totalPendapatan) * 100)}%`,
          status: d.status,
        })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'unit', label: 'Unit', align: 'left' },
        { key: 'pendapatan', label: 'Pendapatan', align: 'right', format: 'currency' },
        { key: 'beban', label: 'Beban', align: 'right', format: 'currency' },
        { key: 'jasaMedis', label: 'Jasa Medis', align: 'right', format: 'currency' },
        { key: 'paramedis', label: 'Paramedis', align: 'right', format: 'currency' },
        { key: 'netto', label: 'Netto', align: 'right', format: 'currency' },
        { key: 'profitability', label: 'Profitability', align: 'center' },
        { key: 'status', label: 'Status', align: 'center', format: 'badge' },
      ],
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'ID', key: 'id', width: 14 },
        { header: 'Periode', key: 'periode', width: 16 },
        { header: 'Unit', key: 'unit', width: 22 },
        { header: 'Total Pendapatan', key: 'pendapatan', format: 'currency', width: 22 },
        { header: 'Beban Operasional', key: 'beban', format: 'currency', width: 22 },
        { header: 'Jasa Medis', key: 'jasaMedis', format: 'currency', width: 20 },
        { header: 'Jasa Paramedis', key: 'paramedis', format: 'currency', width: 20 },
        { header: 'Jasa Penunjang', key: 'penunjang', format: 'currency', width: 20 },
        { header: 'Bonus Prestasi', key: 'bonus', format: 'currency', width: 18 },
        { header: 'Pajak PPh', key: 'pajak', format: 'currency', width: 16 },
        { header: 'Netto', key: 'netto', format: 'currency', width: 22 },
        { header: 'Profitability', key: 'profitability', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Unit', key: 'unit', width: 20 },
        { header: 'Pendapatan', key: 'pendapatan', format: 'currency', width: 22 },
        { header: 'Beban', key: 'beban', format: 'currency', width: 20 },
        { header: 'Netto', key: 'netto', format: 'currency', width: 20 },
        { header: 'Profitability', key: 'profitability', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      chartType: 'bar', chartDataKey: 'netto', chartLabel: 'unit',
    },

    /* ── LAP-005: Laporan Transaksi Pasien ── */
    'LAP-005': {
      sheetName: 'Transaksi Pasien',
      orientasi: 'l',
      description: 'Rekap jumlah kunjungan pasien dan nilai transaksi per unit layanan.',
      getData: () =>
        dataPendapatan.map((d, i) => ({
          no: i + 1,
          unit: d.unit,
          jenis: d.jenisPelayanan,
          pasien: d.jumlahPasien,
          pendapatan: d.nilaiPendapatan,
          avgPerPasien: Math.round(d.nilaiPendapatan / d.jumlahPasien),
          operator: d.operator,
          tanggal: formatDateShort(d.tanggal),
          status: d.status,
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
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Unit', key: 'unit', width: 22 },
        { header: 'Jenis Layanan', key: 'jenis', width: 18 },
        { header: 'Jml Pasien', key: 'pasien', format: 'number', width: 12 },
        { header: 'Total Pendapatan', key: 'pendapatan', format: 'currency', width: 22 },
        { header: 'Avg/Pasien', key: 'avgPerPasien', format: 'currency', width: 18 },
        { header: 'Operator', key: 'operator', width: 24 },
        { header: 'Tanggal', key: 'tanggal', width: 14 },
        { header: 'Status', key: 'status', width: 14 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Unit', key: 'unit', width: 22 },
        { header: 'Jenis', key: 'jenis', width: 18 },
        { header: 'Pasien', key: 'pasien', format: 'number', width: 12 },
        { header: 'Pendapatan', key: 'pendapatan', format: 'currency', width: 22 },
        { header: 'Avg/Pasien', key: 'avgPerPasien', format: 'currency', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      chartType: 'bar', chartDataKey: 'pasien', chartLabel: 'unit',
    },

    /* ── LAP-006: Indexing & Bobot ── */
    'LAP-006': {
      sheetName: 'Indexing & Bobot',
      orientasi: 'p',
      description: 'Master data bobot dan skala indexing remunerasi.',
      getData: () =>
        dataIndexing.map((d, i) => ({
          no: i + 1,
          kode: d.kodeIndex,
          nama: d.namaIndex,
          kategori: d.kategori,
          bobot: d.bobot,
          keterangan: d.keterangan,
          status: d.aktif ? 'Aktif' : 'Nonaktif',
        })),
      columns: [
        { key: 'no', label: 'No', align: 'center' },
        { key: 'kode', label: 'Kode', align: 'left' },
        { key: 'nama', label: 'Nama Index', align: 'left' },
        { key: 'kategori', label: 'Kategori', align: 'left' },
        { key: 'bobot', label: 'Bobot', align: 'center' },
        { key: 'keterangan', label: 'Keterangan', align: 'left' },
        { key: 'status', label: 'Status', align: 'center' },
      ],
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Kode Index', key: 'kode', width: 16 },
        { header: 'Nama Index', key: 'nama', width: 30 },
        { header: 'Kategori', key: 'kategori', width: 14 },
        { header: 'Bobot', key: 'bobot', width: 10 },
        { header: 'Keterangan', key: 'keterangan', width: 40 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 8 },
        { header: 'Kode', key: 'kode', width: 16 },
        { header: 'Nama Index', key: 'nama', width: 32 },
        { header: 'Kategori', key: 'kategori', width: 16 },
        { header: 'Bobot', key: 'bobot', width: 12 },
        { header: 'Status', key: 'status', width: 14 },
      ],
      chartType: 'bar', chartDataKey: 'bobot', chartLabel: 'nama',
    },

    /* ── LAP-007: Log Aktivitas Sistem ── */
    'LAP-007': {
      sheetName: 'Log Aktivitas',
      orientasi: 'l',
      description: 'Catatan lengkap aktivitas seluruh pengguna sistem SIM Remunerasi.',
      getData: () =>
        dataActivityLog.map((d, i) => ({
          no: i + 1,
          id: d.id,
          waktu: d.timestamp,
          user: d.user,
          aksi: d.action,
          modul: d.module,
          target: d.target,
          detail: d.detail,
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
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'ID Log', key: 'id', width: 12 },
        { header: 'Waktu', key: 'waktu', width: 22 },
        { header: 'Pengguna', key: 'user', width: 24 },
        { header: 'Aksi', key: 'aksi', width: 18 },
        { header: 'Modul', key: 'modul', width: 16 },
        { header: 'Target', key: 'target', width: 20 },
        { header: 'Detail', key: 'detail', width: 44 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Waktu', key: 'waktu', width: 22 },
        { header: 'Pengguna', key: 'user', width: 22 },
        { header: 'Aksi', key: 'aksi', width: 18 },
        { header: 'Modul', key: 'modul', width: 16 },
        { header: 'Detail', key: 'detail', width: 36 },
      ],
      chartType: 'none',
    },

    /* ── LAP-008: Laporan Pajak PPh 21 ── */
    'LAP-008': {
      sheetName: 'Pajak PPh 21',
      orientasi: 'l',
      description: 'Rekap potongan Pajak Penghasilan (PPh 21) setiap tenaga kesehatan periode Januari 2026.',
      getData: () =>
        dataPembayaran.map((d, i) => ({
          no: i + 1,
          id: d.id,
          nama: d.nakesNama,
          nip: d.nip,
          jabatan: d.jabatan,
          unit: d.unit,
          totalKotor: d.totalJasaKotor,
          pajakPPh: d.pajakPPh,
          bpjs: d.iuranBPJS,
          potonganLain: d.potonganLain,
          totalPotongan: d.totalPotongan,
          netto: d.nettoDibayar,
          status: d.status,
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
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'ID Pembayaran', key: 'id', width: 18 },
        { header: 'Nama Nakes', key: 'nama', width: 28 },
        { header: 'NIP', key: 'nip', width: 22 },
        { header: 'Jabatan', key: 'jabatan', width: 24 },
        { header: 'Unit', key: 'unit', width: 22 },
        { header: 'Total Kotor', key: 'totalKotor', format: 'currency', width: 20 },
        { header: 'Pajak PPh 21', key: 'pajakPPh', format: 'currency', width: 18 },
        { header: 'Iuran BPJS', key: 'bpjs', format: 'currency', width: 16 },
        { header: 'Potongan Lain', key: 'potonganLain', format: 'currency', width: 16 },
        { header: 'Total Potongan', key: 'totalPotongan', format: 'currency', width: 18 },
        { header: 'Netto Dibayar', key: 'netto', format: 'currency', width: 20 },
        { header: 'Status', key: 'status', width: 14 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Nama', key: 'nama', width: 24 },
        { header: 'Unit', key: 'unit', width: 18 },
        { header: 'Total Kotor', key: 'totalKotor', format: 'currency', width: 20 },
        { header: 'PPh 21', key: 'pajakPPh', format: 'currency', width: 18 },
        { header: 'BPJS', key: 'bpjs', format: 'currency', width: 14 },
        { header: 'Total Potongan', key: 'totalPotongan', format: 'currency', width: 18 },
        { header: 'Netto', key: 'netto', format: 'currency', width: 20 },
      ],
      chartType: 'bar', chartDataKey: 'pajakPPh', chartLabel: 'nama',
    },

    /* ── LAP-009: Slip Pembayaran Gaji ── */
    'LAP-009': {
      sheetName: 'Slip Pembayaran',
      orientasi: 'l',
      description: 'Detail slip pembayaran remunerasi setiap tenaga kesehatan periode Januari 2026.',
      getData: () =>
        dataPembayaran.map((d, i) => ({
          no: i + 1,
          id: d.id,
          nama: d.nakesNama,
          nip: d.nip,
          jabatan: d.jabatan,
          unit: d.unit,
          noRekening: d.noRekening,
          bank: d.bank,
          jasaMedis: d.jasaMedis,
          jasaParamedis: d.jasaParamedis,
          jasaPenunjang: d.jasaPenunjang,
          bonus: d.bonusPrestasi,
          totalKotor: d.totalJasaKotor,
          totalPotongan: d.totalPotongan,
          netto: d.nettoDibayar,
          status: d.status,
          noBukti: d.noBukti || '-',
          tglBayar: d.tanggalPembayaran ? formatDateShort(d.tanggalPembayaran) : '-',
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
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'ID', key: 'id', width: 16 },
        { header: 'Nama Nakes', key: 'nama', width: 28 },
        { header: 'NIP', key: 'nip', width: 22 },
        { header: 'Jabatan', key: 'jabatan', width: 24 },
        { header: 'Unit', key: 'unit', width: 22 },
        { header: 'No. Rekening', key: 'noRekening', width: 16 },
        { header: 'Bank', key: 'bank', width: 12 },
        { header: 'Jasa Medis', key: 'jasaMedis', format: 'currency', width: 18 },
        { header: 'Jasa Paramedis', key: 'jasaParamedis', format: 'currency', width: 18 },
        { header: 'Jasa Penunjang', key: 'jasaPenunjang', format: 'currency', width: 18 },
        { header: 'Bonus Prestasi', key: 'bonus', format: 'currency', width: 16 },
        { header: 'Total Kotor', key: 'totalKotor', format: 'currency', width: 20 },
        { header: 'Total Potongan', key: 'totalPotongan', format: 'currency', width: 18 },
        { header: 'Netto Dibayar', key: 'netto', format: 'currency', width: 20 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'No. Bukti', key: 'noBukti', width: 18 },
        { header: 'Tgl Pembayaran', key: 'tglBayar', width: 16 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Nama', key: 'nama', width: 24 },
        { header: 'Bank', key: 'bank', width: 12 },
        { header: 'Total Kotor', key: 'totalKotor', format: 'currency', width: 20 },
        { header: 'Potongan', key: 'totalPotongan', format: 'currency', width: 18 },
        { header: 'Netto', key: 'netto', format: 'currency', width: 20 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'No. Bukti', key: 'noBukti', width: 18 },
      ],
      chartType: 'bar', chartDataKey: 'netto', chartLabel: 'nama',
    },

    /* ── LAP-010: Rekap Pembayaran Remunerasi ── */
    'LAP-010': {
      sheetName: 'Rekap Pembayaran',
      orientasi: 'l',
      description: 'Rekap total pembayaran remunerasi dikelompokkan per unit dan jabatan.',
      getData: () => {
        const byUnit: Record<string, any> = {};
        dataPembayaran.forEach((d) => {
          if (!byUnit[d.unit]) {
            byUnit[d.unit] = {
              unit: d.unit, totalNakes: 0,
              totalKotor: 0, totalPajak: 0, totalBPJS: 0,
              totalPotongan: 0, totalNetto: 0,
            };
          }
          byUnit[d.unit].totalNakes++;
          byUnit[d.unit].totalKotor += d.totalJasaKotor;
          byUnit[d.unit].totalPajak += d.pajakPPh;
          byUnit[d.unit].totalBPJS += d.iuranBPJS;
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
        { key: 'totalPajak', label: 'Total PPh', align: 'right', format: 'currency' },
        { key: 'totalBPJS', label: 'Total BPJS', align: 'right', format: 'currency' },
        { key: 'totalPotongan', label: 'Total Potongan', align: 'right', format: 'currency' },
        { key: 'totalNetto', label: 'Total Netto', align: 'right', format: 'currency' },
      ],
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Unit', key: 'unit', width: 26 },
        { header: 'Jml Nakes', key: 'totalNakes', format: 'number', width: 12 },
        { header: 'Total Kotor', key: 'totalKotor', format: 'currency', width: 22 },
        { header: 'Total PPh 21', key: 'totalPajak', format: 'currency', width: 20 },
        { header: 'Total BPJS', key: 'totalBPJS', format: 'currency', width: 18 },
        { header: 'Total Potongan', key: 'totalPotongan', format: 'currency', width: 20 },
        { header: 'Total Netto', key: 'totalNetto', format: 'currency', width: 22 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 6 },
        { header: 'Unit', key: 'unit', width: 24 },
        { header: 'Nakes', key: 'totalNakes', format: 'number', width: 10 },
        { header: 'Total Kotor', key: 'totalKotor', format: 'currency', width: 22 },
        { header: 'Total Potongan', key: 'totalPotongan', format: 'currency', width: 20 },
        { header: 'Total Netto', key: 'totalNetto', format: 'currency', width: 22 },
      ],
      chartType: 'bar', chartDataKey: 'totalNetto', chartLabel: 'unit',
    },

    /* ── LAP-011: File Batch Transfer Bank ── */
    'LAP-011': {
      sheetName: 'Batch Transfer Bank',
      orientasi: 'l',
      description: 'File batch transfer bank untuk pembayaran remunerasi yang telah disetujui.',
      getData: () =>
        dataPembayaran
          .filter((d) => d.status !== 'dibatalkan')
          .map((d, i) => ({
            no: i + 1,
            noRekening: d.noRekening,
            nama: d.nakesNama,
            nominal: d.nettoDibayar,
            bank: d.bank,
            referensi: d.id,
            keterangan: `Remunerasi ${d.periode}`,
            status: d.status,
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
      excelCols: [
        { header: 'No', key: 'no', width: 5 },
        { header: 'No. Rekening', key: 'noRekening', width: 18 },
        { header: 'Nama Penerima', key: 'nama', width: 28 },
        { header: 'Bank', key: 'bank', width: 14 },
        { header: 'Nominal', key: 'nominal', format: 'currency', width: 22 },
        { header: 'Referensi', key: 'referensi', width: 18 },
        { header: 'Keterangan', key: 'keterangan', width: 28 },
        { header: 'Status', key: 'status', width: 14 },
      ],
      pdfCols: [
        { header: 'No', key: 'no', width: 6 },
        { header: 'No. Rekening', key: 'noRekening', width: 18 },
        { header: 'Nama Penerima', key: 'nama', width: 26 },
        { header: 'Bank', key: 'bank', width: 12 },
        { header: 'Nominal', key: 'nominal', format: 'currency', width: 22 },
        { header: 'Referensi', key: 'referensi', width: 18 },
        { header: 'Status', key: 'status', width: 14 },
      ],
      chartType: 'none',
    },
  };

  return configs[id] ?? null;
}
