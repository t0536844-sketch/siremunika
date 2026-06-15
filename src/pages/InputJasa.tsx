import { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Search, Filter, Stethoscope, Calculator,
  FileSpreadsheet, FileText, Printer, X, Upload,
} from 'lucide-react';
import { dataJasa, daftarUnit, daftarJabatan } from '../data/mockData';
import dataService from '../data/dataService';
import { formatRupiah, formatNumber, statusColors, statusLabel } from '../utils/helpers';
import type { JasaMedis } from '../data/mockData';
import { exportToExcel, exportToPDF, printPage } from '../utils/exporters';
import { useApp } from '../context/AppContext';
import ModalImport from '../components/ModalImport';
import type { ImportColumn } from '../utils/importer';

const statusList = ['pending', 'verified', 'paid'] as const;

const ic = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-400 dark:placeholder:text-slate-500';

// ─── Definisi kolom import jasa ────────────────────────────────
const importColumns: ImportColumn[] = [
  {
    header: 'Periode', key: 'periode', required: true,
    validate: (v) => !v ? 'Periode wajib diisi (cth: Januari 2026)' : null,
  },
  {
    header: 'Nama Nakes', key: 'nakes', required: true,
    validate: (v) => !v ? 'Nama nakes wajib diisi' : null,
  },
  {
    header: 'Jabatan', key: 'jabatan', required: true,
    validate: (v) => !v ? 'Jabatan wajib diisi' : null,
  },
  {
    header: 'Unit', key: 'unit', required: true,
    validate: (v) => !v ? 'Unit wajib diisi' : null,
  },
  {
    header: 'Tarif per Tindakan', key: 'tarifJasa', required: true, type: 'number',
    validate: (v) => Number(v) <= 0 ? 'Tarif jasa harus lebih dari 0' : null,
    transform: (v) => Number(v) as any,
  },
  {
    header: 'Jumlah Tindakan', key: 'jumlahTindakan', required: true, type: 'number',
    validate: (v) => Number(v) <= 0 ? 'Jumlah tindakan harus lebih dari 0' : null,
    transform: (v) => Math.round(Number(v)) as any,
  },
];

const importPreviewColumns = [
  { key: 'periode', label: 'Periode', width: 'w-28' },
  { key: 'nakes', label: 'Nama Nakes', width: 'w-36' },
  { key: 'jabatan', label: 'Jabatan', width: 'w-32' },
  { key: 'unit', label: 'Unit', width: 'w-28' },
  { key: 'tarifJasa', label: 'Tarif (Rp)', width: 'w-28' },
  { key: 'jumlahTindakan', label: 'Tindakan', width: 'w-20' },
];

const templateSampleRows = [
  ['Januari 2026', 'dr. Andi Putra, Sp.PD', 'Dokter Spesialis', 'Poli Penyakit Dalam', 450000, 340],
  ['Januari 2026', 'dr. Siti Nurhaliza, Sp.A', 'Dokter Spesialis', 'Poli Anak', 500000, 285],
  ['Januari 2026', 'Ns. Rina Marlina, S.Kep', 'Perawat Ahli Madya', 'Kamar Perawatan', 75000, 890],
  ['Januari 2026', 'Apt. Sari Dewi, S.Farm', 'Apoteker', 'Farmasi', 95000, 1245],
];

export default function InputJasa() {
  const { showToast } = useApp();
  const [items, setItems] = useState<JasaMedis[]>([]);

  useEffect(() => {
    dataService.getJasaMedis().then((data) => {
      if (data && data.length > 0) setItems(data);
    }).catch(() => {
      setItems(dataJasa);
    });
  }, []);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editing, setEditing] = useState<JasaMedis | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [form, setForm] = useState<{
    periode: string; nakes: string; jabatan: string; unit: string;
    tarifJasa: number; jumlahTindakan: number;
    status: 'pending' | 'verified' | 'paid';
  }>({
    periode: 'Januari 2026', nakes: '', jabatan: daftarJabatan[0],
    unit: daftarUnit[0], tarifJasa: 0, jumlahTindakan: 0, status: 'pending',
  });

  const exportColumns = [
    { header: 'ID', key: 'id', width: 18 },
    { header: 'Periode', key: 'periode', width: 16 },
    { header: 'Nakes', key: 'nakes', width: 22 },
    { header: 'Jabatan', key: 'jabatan', width: 22 },
    { header: 'Unit', key: 'unit', width: 18 },
    { header: 'Tarif/Jasa', key: 'tarifJasa', format: 'currency' as const, width: 16 },
    { header: 'Jumlah Tindakan', key: 'jumlahTindakan', format: 'number' as const, width: 14 },
    { header: 'Total Jasa', key: 'totalJasa', format: 'currency' as const, width: 20 },
    { header: 'Status', key: 'status', width: 14 },
  ];

  const hitungTotal = () => form.tarifJasa * form.jumlahTindakan;

  const filtered = items.filter(
    (item) =>
      (filterStatus === 'Semua' || item.status === filterStatus) &&
      ((item.nakes || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.unit || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.jabatan || '').toLowerCase().includes(search.toLowerCase()))
  );

  const totalJasa = filtered.reduce((sum, i) => sum + (i.totalJasa || 0), 0);
  const totalTindakan = filtered.reduce((sum, i) => sum + (i.jumlahTindakan || 0), 0);

  // ── CRUD ─────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({ periode: 'Januari 2026', nakes: '', jabatan: daftarJabatan[0], unit: daftarUnit[0], tarifJasa: 0, jumlahTindakan: 0, status: 'pending' });
    setShowModal(true);
  };

  const openEdit = (item: JasaMedis) => {
    setEditing(item);
    setForm({ periode: item.periode || '', nakes: item.nakes || '', jabatan: item.jabatan || daftarJabatan[0], unit: item.unit || daftarUnit[0], tarifJasa: item.tarifJasa || 0, jumlahTindakan: item.jumlahTindakan || 0, status: item.status || 'pending' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.nakes || form.tarifJasa <= 0 || form.jumlahTindakan <= 0) {
      showToast('error', 'Data belum lengkap', 'Nama Nakes, tarif, dan jumlah tindakan wajib diisi');
      return;
    }
    let savedItem: JasaMedis;
    if (editing) {
      savedItem = { ...editing, ...form, totalJasa: hitungTotal() };
      setItems(items.map((i) => i.id === editing.id ? savedItem : i));
    } else {
      savedItem = {
        id: `JASA-2026-${String(items.length + 1).padStart(4, '0')}`,
        ...form, totalJasa: hitungTotal(),
      };
      setItems([savedItem, ...items]);
    }
    setShowModal(false);
    try {
      await dataService.saveJasaMedis(savedItem);
      showToast('success', editing ? 'Jasa diperbarui' : 'Jasa medis ditambahkan', `${savedItem.id} tersimpan ke database`);
    } catch (e) {
      showToast('warning', editing ? 'Jasa diperbarui lokal' : 'Jasa medis ditambahkan lokal', 'Gagal simpan ke database, data tetap tersimpan di aplikasi');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus data jasa medis ini?')) {
      setItems(items.filter((i) => i.id !== id));
      try {
        await dataService.deleteJasaMedis(id);
        showToast('warning', 'Data jasa dihapus', `${id} dihapus dari database`);
      } catch (e) {
        showToast('warning', 'Data jasa dihapus lokal', `${id} dihapus lokal saja, gagal hapus dari database`);
      }
    }
  };

  // ── Import handler ───────────────────────────────────────────
  const handleImport = (rows: Record<string, any>[]) => {
    const startNum = items.length;
    const newItems: JasaMedis[] = rows.map((row, i) => {
      const tarif   = Number(row.tarifJasa ?? 0);
      const tindak  = Number(row.jumlahTindakan ?? 0);
      return {
        id: `JASA-2026-${String(startNum + i + 1).padStart(4, '0')}`,
        periode: String(row.periode ?? 'Januari 2026'),
        nakes: String(row.nakes ?? ''),
        jabatan: String(row.jabatan ?? ''),
        unit: String(row.unit ?? ''),
        tarifJasa: tarif,
        jumlahTindakan: tindak,
        totalJasa: tarif * tindak,
        status: 'pending',
      };
    });
    setItems((prev) => [...newItems, ...prev]);
    showToast(
      'success',
      `${rows.length} data jasa medis berhasil diimport`,
      `Total jasa: ${formatRupiah(newItems.reduce((s, n) => s + n.totalJasa, 0))}`
    );
  };

  // ── Export ───────────────────────────────────────────────────
  const handleExportExcel = () => {
    exportToExcel('Jasa_Medis', 'Jasa Medis', exportColumns, filtered, { title: 'LAPORAN JASA MEDIS RSUD MIMIKA', subtitle: `Filter Status: ${filterStatus} · ${filtered.length} entri` });
    showToast('success', 'Excel berhasil diunduh', `${filtered.length} baris data telah diekspor`);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    exportToPDF('Jasa_Medis', 'Laporan Jasa Medis', exportColumns, filtered, { subtitle: `Total Jasa: ${formatRupiah(totalJasa)} · ${filtered.length} entri` });
    showToast('success', 'PDF berhasil diunduh', `${filtered.length} baris data telah diekspor`);
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    setTimeout(() => printPage(), 200);
    setShowExportMenu(false);
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5 bg-slate-50 dark:bg-slate-950">

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 text-white rounded-2xl p-5 shadow-lg">
          <Stethoscope className="w-6 h-6 mb-2 text-cyan-100" />
          <p className="text-cyan-100 text-xs mb-1">Total Jasa Medis</p>
          <p className="text-2xl font-bold">{formatRupiah(totalJasa)}</p>
        </div>
        {[
          { label: 'Total Tindakan', value: formatNumber(totalTindakan), sub: 'tindakan dilaporkan', color: 'text-slate-800 dark:text-slate-100' },
          { label: 'Jumlah Nakes', value: formatNumber(items.length), sub: 'terdaftar periode ini', color: 'text-teal-700 dark:text-teal-400' },
          { label: 'Rata-rata Jasa/Nakes', value: formatRupiah(items.length > 0 ? totalJasa / items.length : 0), sub: 'per tenaga medis', color: 'text-amber-600 dark:text-amber-400' },
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
        {/* Filter status */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[120px] text-slate-700 dark:text-slate-300">
            <option>Semua</option>
            {statusList.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama nakes, unit, atau jabatan..."
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
                  <Printer className="w-4 h-4 text-slate-500" /> Cetak Halaman
                </button>
              </div>
            </>
          )}
        </div>

        {/* Import button */}
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-700 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 rounded-lg transition"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>

        {/* Tambah manual */}
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition">
          <Plus className="w-4 h-4" /> Tambah Jasa Medis
        </button>
      </div>

      {/* ── Tabel Data ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-700">
                {['ID','Nakes','Jabatan','Unit','Tarif/Jasa','Tindakan','Total Jasa','Status','Aksi'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-cyan-700 dark:text-cyan-400 font-semibold">{item.id}</td>
                  <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100 whitespace-nowrap">{item.nakes}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-xs">{item.jabatan}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-xs">{item.unit}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{formatRupiah(item.tarifJasa)}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{formatNumber(item.jumlahTindakan)}</td>
                  <td className="px-5 py-3 text-right font-bold text-cyan-700 dark:text-cyan-400">{formatRupiah(item.totalJasa)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${statusColors[item.status || 'pending']}`}>
                      {statusLabel[item.status || 'pending']}
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
                    <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Tidak ada data jasa medis</p>
                    <button onClick={openAdd} className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 rounded-lg">+ Tambah Data</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Menampilkan <b className="text-slate-700 dark:text-slate-200">{filtered.length}</b> dari <b className="text-slate-700 dark:text-slate-200">{items.length}</b> nakes</span>
          <span>Total Jasa: <b className="text-cyan-700 dark:text-cyan-400">{formatRupiah(totalJasa)}</b></span>
        </div>
      </div>

      {/* ══ Modal Tambah / Edit ══ */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-pop">
            <div className="bg-gradient-to-r from-cyan-700 to-cyan-800 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{editing ? 'Edit Data Jasa Medis' : 'Tambah Jasa Medis'}</h3>
                <p className="text-xs text-cyan-100">Input data tindakan medis per nakes</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Periode</label>
                <input value={form.periode || ''} onChange={(e) => setForm({ ...form, periode: e.target.value })} className={ic} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Nama Nakes</label>
                <input value={form.nakes || ''} onChange={(e) => setForm({ ...form, nakes: e.target.value })} placeholder="Contoh: dr. Andi Putra" className={ic} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Jabatan</label>
                <select value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} className={ic}>
                  {daftarJabatan.map((j) => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Unit</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className={ic}>
                  {daftarUnit.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Tarif per Tindakan (Rp)</label>
                <input type="number" value={form.tarifJasa || ''} onChange={(e) => setForm({ ...form, tarifJasa: Number(e.target.value) })} placeholder="250000" className={ic} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Jumlah Tindakan</label>
                <input type="number" value={form.jumlahTindakan || ''} onChange={(e) => setForm({ ...form, jumlahTindakan: Number(e.target.value) })} placeholder="100" className={ic} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className={ic}>
                  {statusList.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />
                  <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-300">Perhitungan Otomatis</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Tarif × Tindakan</p>
                    <p className="text-lg font-bold text-cyan-800 dark:text-cyan-300">{formatRupiah(hitungTotal())}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Pajak PPh (5%)</p>
                    <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatRupiah(hitungTotal() * 0.05)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Netto Diterima</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatRupiah(hitungTotal() * 0.95)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                Batal
              </button>
              <button onClick={handleSubmit}
                className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-sm transition">
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
        title="Import Data Jasa Medis"
        description="Upload file Excel/CSV berisi data jasa medis per tenaga kesehatan"
        accentColor="cyan"
        columns={importColumns}
        templateFilename="Jasa_Medis"
        templateSampleRows={templateSampleRows}
        previewColumns={importPreviewColumns}
      />
    </div>
  );
}
