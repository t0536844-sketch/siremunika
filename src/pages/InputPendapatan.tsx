import { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Search, Filter, FileSpreadsheet, FileText,
  CheckCircle, AlertCircle, Calendar, Printer, X, Upload,
} from 'lucide-react';
import { daftarUnit, dataPendapatan } from '../data/mockData';
import dataService from '../data/dataService';
import { formatRupiah, formatNumber, formatDateShort, statusColors, statusLabel } from '../utils/helpers';
import type { Pendapatan } from '../data/mockData';
import { exportToExcel, exportToPDF, printPage } from '../utils/exporters';
import { useApp } from '../context/AppContext';
import ModalImport from '../components/ModalImport';
import type { ImportColumn } from '../utils/importer';

const jenisPelayananList = ['Rawat Jalan', 'Rawat Inap', 'Gawat Darurat', 'Penunjang', 'Operasi'];

const ic = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 dark:placeholder:text-slate-500';

// ─── Definisi kolom import pendapatan ─────────────────────────
const importColumns: ImportColumn[] = [
  {
    header: 'Tanggal', key: 'tanggal', required: true, type: 'date',
    validate: (v) => !v ? 'Tanggal wajib diisi' : null,
  },
  {
    header: 'Unit', key: 'unit', required: true,
    validate: (v) => !v ? 'Nama unit wajib diisi' : null,
  },
  {
    header: 'Jenis Pelayanan', key: 'jenisPelayanan', required: true,
    validate: (v) => !v ? 'Jenis pelayanan wajib diisi' : null,
  },
  {
    header: 'Jumlah Pasien', key: 'jumlahPasien', required: true, type: 'number',
    validate: (v) => Number(v) <= 0 ? 'Jumlah pasien harus lebih dari 0' : null,
    transform: (v) => Math.round(Number(v)) as any,
  },
  {
    header: 'Nilai Pendapatan', key: 'nilaiPendapatan', required: true, type: 'number',
    validate: (v) => Number(v) <= 0 ? 'Nilai pendapatan harus lebih dari 0' : null,
    transform: (v) => Number(v) as any,
  },
  {
    header: 'Operator', key: 'operator', required: true,
    validate: (v) => !v ? 'Nama operator wajib diisi' : null,
  },
];

// Kolom preview tabel (subset dari importColumns)
const importPreviewColumns = [
  { key: 'tanggal', label: 'Tanggal', width: 'w-24' },
  { key: 'unit', label: 'Unit', width: 'w-36' },
  { key: 'jenisPelayanan', label: 'Jenis', width: 'w-28' },
  { key: 'jumlahPasien', label: 'Pasien', width: 'w-20' },
  { key: 'nilaiPendapatan', label: 'Nilai (Rp)', width: 'w-32' },
  { key: 'operator', label: 'Operator', width: 'w-32' },
];

// Data contoh untuk template
const templateSampleRows = [
  ['2026-01-15', 'Poli Umum', 'Rawat Jalan', 245, 125000000, 'dr. Andi Putra'],
  ['2026-01-15', 'IGD', 'Gawat Darurat', 89, 210000000, 'dr. Siti Nurhaliza'],
  ['2026-01-15', 'Farmasi', 'Penunjang', 892, 425000000, 'Apt. Sari Dewi'],
];

export default function InputPendapatan() {
  const { showToast } = useApp();
  const [items, setItems] = useState<Pendapatan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.getPendapatan().then(data => {
      setItems(data);
    }).catch(() => {
      // fallback to mock data
      import('../data/mockData').then(m => setItems(m.dataPendapatan));
    }).finally(() => setLoading(false));
  }, []);

  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editing, setEditing] = useState<Pendapatan | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    unit: daftarUnit[0],
    jenisPelayanan: jenisPelayananList[0],
    jumlahPasien: 0,
    nilaiPendapatan: 0,
    operator: '',
  });

  const exportColumns = [
    { header: 'ID Transaksi', key: 'id', width: 18 },
    { header: 'Tanggal', key: 'tanggal', format: 'date' as const, width: 14 },
    { header: 'Unit', key: 'unit', width: 20 },
    { header: 'Jenis Pelayanan', key: 'jenisPelayanan', width: 18 },
    { header: 'Jumlah Pasien', key: 'jumlahPasien', format: 'number' as const, width: 14 },
    { header: 'Nilai Pendapatan', key: 'nilaiPendapatan', format: 'currency' as const, width: 22 },
    { header: 'Operator', key: 'operator', width: 22 },
    { header: 'Status', key: 'status', width: 14 },
  ];

  const filtered = items.filter(
    (item) =>
      (filterUnit === 'Semua' || item.unit === filterUnit) &&
      (item.unit.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.operator.toLowerCase().includes(search.toLowerCase()))
  );

  const totalNilai = filtered.reduce((sum, i) => sum + i.nilaiPendapatan, 0);
  const totalPasien = filtered.reduce((sum, i) => sum + i.jumlahPasien, 0);

  // ── Handlers CRUD ────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({ tanggal: new Date().toISOString().split('T')[0], unit: daftarUnit[0], jenisPelayanan: jenisPelayananList[0], jumlahPasien: 0, nilaiPendapatan: 0, operator: '' });
    setShowModal(true);
  };

  const openEdit = (item: Pendapatan) => {
    setEditing(item);
    setForm({ tanggal: item.tanggal, unit: item.unit, jenisPelayanan: item.jenisPelayanan, jumlahPasien: item.jumlahPasien, nilaiPendapatan: item.nilaiPendapatan, operator: item.operator });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (form.jumlahPasien <= 0 || form.nilaiPendapatan <= 0 || !form.operator) {
      showToast('error', 'Data belum lengkap', 'Pastikan jumlah pasien, nilai, dan operator terisi');
      return;
    }
    let savedItem: Pendapatan;
    if (editing) {
      savedItem = { ...editing, ...form, status: 'pending' as const };
      setItems(items.map((i) => (i.id === editing.id ? savedItem : i)));
    } else {
      savedItem = {
        id: `PEN-2026-${String(items.length + 1).padStart(4, '0')}`,
        ...form, status: 'pending',
      };
      setItems([savedItem, ...items]);
    }
    setShowModal(false);
    try {
      await dataService.savePendapatan(savedItem);
      showToast('success', editing ? 'Data berhasil diperbarui' : 'Pendapatan baru ditambahkan', `${savedItem.id} tersimpan ke database`);
    } catch (e) {
      showToast('warning', editing ? 'Data diperbarui lokal' : 'Data ditambahkan lokal', 'Gagal simpan ke database, data tetap tersimpan di aplikasi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data pendapatan ini?')) return;
    setItems(items.filter((i) => i.id !== id));
    try {
      await dataService.deletePendapatan(id);
      showToast('warning', 'Data dihapus', `Transaksi ${id} dihapus dari database`);
    } catch (e) {
      showToast('warning', 'Data dihapus lokal', `Transaksi ${id} dihapus dari aplikasi (gagal hapus dari database)`);
    }
  };

  // ── Handler Import ───────────────────────────────────────────
  const handleImport = (rows: Record<string, any>[]) => {
    const startNum = items.length;
    const newItems: Pendapatan[] = rows.map((row, i) => ({
      id: `PEN-2026-${String(startNum + i + 1).padStart(4, '0')}`,
      tanggal: String(row.tanggal ?? new Date().toISOString().split('T')[0]),
      unit: String(row.unit ?? ''),
      jenisPelayanan: String(row.jenisPelayanan ?? 'Rawat Jalan'),
      jumlahPasien: Number(row.jumlahPasien ?? 0),
      nilaiPendapatan: Number(row.nilaiPendapatan ?? 0),
      operator: String(row.operator ?? ''),
      status: 'pending',
    }));
    setItems((prev) => [...newItems, ...prev]);
    showToast('success', `${rows.length} data pendapatan berhasil diimport`, 'Status: menunggu persetujuan');
  };

  // ── Export handlers ──────────────────────────────────────────
  const handleExportExcel = () => {
    exportToExcel('Data_Pendapatan', 'Pendapatan', exportColumns, filtered, { title: 'LAPORAN PENDAPATAN RSUD MIMIKA', subtitle: `Filter Unit: ${filterUnit} · ${filtered.length} transaksi` });
    showToast('success', 'Excel berhasil diunduh', `${filtered.length} baris data telah diekspor`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    exportToPDF('Data_Pendapatan', 'Laporan Pendapatan', exportColumns, filtered, { subtitle: `Filter Unit: ${filterUnit} · ${filtered.length} transaksi · Total: ${formatRupiah(totalNilai)}` });
    showToast('success', 'PDF berhasil diunduh', `${filtered.length} baris data telah diekspor`);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    showToast('info', 'Membuka dialog cetak...');
    setTimeout(() => printPage(), 200);
    setShowExportMenu(false);
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5 bg-slate-50 dark:bg-slate-950">

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-teal-100 text-xs mb-1">Total Pendapatan</p>
          <p className="text-2xl font-bold">{formatRupiah(totalNilai)}</p>
          <p className="text-xs text-teal-100 mt-2">{filtered.length} transaksi</p>
        </div>
        {[
          { label: 'Total Pasien', value: formatNumber(totalPasien), sub: 'Di seluruh unit', color: 'text-slate-800 dark:text-slate-100' },
          { label: 'Rata-rata/Pasien', value: formatRupiah(totalPasien > 0 ? totalNilai / totalPasien : 0), sub: 'Nilai rata-rata', color: 'text-cyan-700 dark:text-cyan-400' },
          { label: 'Menunggu Approval', value: String(items.filter(i => i.status === 'pending').length), sub: 'Perlu persetujuan', color: 'text-amber-600 dark:text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filter & Toolbar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
        {/* Filter unit */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[140px] text-slate-700 dark:text-slate-300">
            <option>Semua</option>
            {daftarUnit.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari unit, ID, atau operator..."
            className="bg-transparent text-sm focus:outline-none w-full text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" /></button>}
        </div>

        {/* Export dropdown */}
        <div className="relative">
          <button onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
            <FileSpreadsheet className="w-4 h-4" /> Export
          </button>
          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-20 min-w-[180px]">
                <button onClick={handleExportExcel} className="w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
                </button>
                <button onClick={handleExportPDF} className="w-full px-4 py-2 text-left text-sm hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600" /> Export PDF
                </button>
                <button onClick={handlePrint} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700">
                  <Printer className="w-4 h-4 text-slate-500" /> Cetak
                </button>
              </div>
            </>
          )}
        </div>

        {/* Import button */}
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded-lg transition"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>

        {/* Tambah manual */}
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition">
          <Plus className="w-4 h-4" /> Tambah Pendapatan
        </button>
      </div>

      {/* ── Tabel Data ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-700">
                {['ID Transaksi','Tanggal','Unit','Jenis Pelayanan','Pasien','Nilai Pendapatan','Operator','Status','Aksi'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-teal-700 dark:text-teal-400 font-semibold">{item.id}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDateShort(item.tanggal)}</td>
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{item.unit}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.jenisPelayanan}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{formatNumber(item.jumlahPasien)}</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatRupiah(item.nilaiPendapatan)}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.operator}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${statusColors[item.status]}`}>
                      {statusLabel[item.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(item)} title="Edit"
                        className="p-1.5 text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} title="Hapus"
                        className="p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 dark:text-slate-600">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Tidak ada data pendapatan</p>
                    <button onClick={openAdd} className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg">+ Tambah Data</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Menampilkan <b className="text-slate-700 dark:text-slate-200">{filtered.length}</b> dari <b className="text-slate-700 dark:text-slate-200">{items.length}</b> transaksi</span>
          <span>Total: <b className="text-teal-700 dark:text-teal-400">{formatRupiah(totalNilai)}</b></span>
        </div>
      </div>

      {/* ══ Modal Tambah / Edit ══ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-pop">
            <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{editing ? 'Edit Data Pendapatan' : 'Tambah Pendapatan Baru'}</h3>
                <p className="text-xs text-teal-100">Masukkan data pendapatan unit dengan lengkap</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  <Calendar className="w-3 h-3 inline mr-1" />Tanggal
                </label>
                <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className={ic} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Unit Pelayanan</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={ic}>
                  {daftarUnit.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Jenis Pelayanan</label>
                <select value={form.jenisPelayanan} onChange={(e) => setForm({ ...form, jenisPelayanan: e.target.value })} className={ic}>
                  {jenisPelayananList.map((j) => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Jumlah Pasien</label>
                <input type="number" value={form.jumlahPasien || ''} onChange={(e) => setForm({ ...form, jumlahPasien: Number(e.target.value) })} placeholder="0" className={ic} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Nilai Pendapatan (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Rp</span>
                  <input type="number" value={form.nilaiPendapatan || ''} onChange={(e) => setForm({ ...form, nilaiPendapatan: Number(e.target.value) })} placeholder="0" className={`${ic} pl-10`} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Operator / Penanggung Jawab</label>
                <input type="text" value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })} placeholder="Nama operator / kepala unit" className={ic} />
              </div>
              {form.nilaiPendapatan > 0 && (
                <div className="md:col-span-2 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-600 dark:text-slate-300">Perkiraan distribusi jasa (30%)</p>
                    <p className="text-lg font-bold text-teal-800 dark:text-teal-300">{formatRupiah(form.nilaiPendapatan * 0.3)}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                Batal
              </button>
              <button onClick={handleSubmit}
                className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition">
                {editing ? 'Simpan Perubahan' : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal Import ══ */}
      <ModalImport
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        title="Import Data Pendapatan"
        description="Upload file Excel/CSV berisi data pendapatan unit layanan"
        accentColor="teal"
        columns={importColumns}
        templateFilename="Pendapatan"
        templateSampleRows={templateSampleRows}
        previewColumns={importPreviewColumns}
      />
    </div>
  );
}
