import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Tag, Search, Scale, FileSpreadsheet, FileText } from 'lucide-react';
import { dataIndexing } from '../data/mockData';
import dataService from '../data/dataService';
import { formatNumber } from '../utils/helpers';
import type { Indexing } from '../data/mockData';
import { exportToExcel, exportToPDF } from '../utils/exporters';
import { useApp } from '../context/AppContext';

const kategoriList = ['Jabatan', 'Perawat', 'Penunjang', 'Tindakan', 'Bonus', 'Potongan'];
const warnaKategori: Record<string, string> = {
  Jabatan: 'bg-teal-100 text-teal-700 border-teal-200',
  Perawat: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Penunjang: 'bg-amber-100 text-amber-700 border-amber-200',
  Tindakan: 'bg-rose-100 text-rose-700 border-rose-200',
  Bonus: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Potongan: 'bg-slate-200 text-slate-700 border-slate-300',
};

export default function Indexing() {
  const { showToast } = useApp();
  const [items, setItems] = useState<Indexing[]>([]);
  useEffect(() => {
    dataService.getIndexing().then((data) => {
      if (data && data.length > 0) setItems(data);
    }).catch(() => { setItems(dataIndexing); });
  }, []);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Indexing | null>(null);

  const exportColumns = [
    { header: 'Kode Index', key: 'kodeIndex', width: 14 },
    { header: 'Nama Index', key: 'namaIndex', width: 30 },
    { header: 'Kategori', key: 'kategori', width: 14 },
    { header: 'Bobot', key: 'bobot', format: 'number' as const, width: 10 },
    { header: 'Keterangan', key: 'keterangan', width: 40 },
    { header: 'Aktif', key: 'aktif', width: 8 },
  ];

  const handleExportExcel = () => {
    exportToExcel('Master_Indexing', 'Indexing', exportColumns, items, {
      title: 'MASTER INDEXING & BOBOT REMUNERASI',
      subtitle: `${items.length} index · ${items.filter(i => i.aktif).length} aktif`,
    });
    showToast('success', 'Data index diekspor ke Excel');
  };

  const handleExportPDF = () => {
    exportToPDF('Master_Indexing', 'Master Indexing & Bobot', exportColumns, items);
    showToast('success', 'Data index diekspor ke PDF');
  };

  const [form, setForm] = useState({
    kodeIndex: '',
    namaIndex: '',
    bobot: 0,
    kategori: kategoriList[0],
    keterangan: '',
    aktif: true,
  });

  const filtered = items.filter(
    (item) =>
      (filterKategori === 'Semua' || item.kategori === filterKategori) &&
      ((item.namaIndex || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.kodeIndex || '').toLowerCase().includes(search.toLowerCase()))
  );

  const totalBobot = filtered.reduce((s, i) => s + (i.bobot || 0), 0);
  const totalAktif = items.filter((i) => i.aktif).length;

  const openAdd = () => {
    setEditing(null);
    setForm({
      kodeIndex: `IDX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      namaIndex: '',
      bobot: 1.0,
      kategori: kategoriList[0],
      keterangan: '',
      aktif: true,
    });
    setShowModal(true);
  };

  const openEdit = (item: Indexing) => {
    setEditing(item);
    setForm({
      kodeIndex: item.kodeIndex || '',
      namaIndex: item.namaIndex || '',
      bobot: item.bobot || 1.0,
      kategori: item.kategori || kategoriList[0],
      keterangan: item.keterangan || '',
      aktif: item.aktif ?? true,
    });
    setShowModal(true);
  };

  const toggleAktif = async (id: string) => {
    const item = items.find((i) => i.id === id);
    const updated = items.map((i) => (i.id === id ? { ...i, aktif: !i.aktif } : i));
    setItems(updated);
    if (item) {
      const toggledItem = updated.find((i) => i.id === id)!;
      try {
        await dataService.saveIndexing(toggledItem);
        showToast('info', item.aktif ? 'Index dinonaktifkan' : 'Index diaktifkan', item.namaIndex);
      } catch {
        showToast('warning', 'saved locally, failed to save to database');
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.namaIndex) {
      showToast('error', 'Nama index wajib diisi');
      return;
    }
    let savedItem: Indexing;
    if (editing) {
      savedItem = { ...editing, ...form };
      setItems(items.map((i) => (i.id === editing.id ? savedItem : i)));
    } else {
      savedItem = {
        id: `IDX-${String(items.length + 1).padStart(3, '0')}`,
        ...form,
      };
      setItems([...items, savedItem]);
    }
    setShowModal(false);
    try {
      await dataService.saveIndexing(savedItem);
      showToast('success', editing ? 'Index diperbarui' : 'Index baru ditambahkan', savedItem.namaIndex);
    } catch {
      showToast('warning', 'saved locally, failed to save to database');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus index ini?')) {
      setItems(items.filter((i) => i.id !== id));
      try {
        await dataService.deleteIndexing(id);
        showToast('warning', 'deleted from database');
      } catch {
        showToast('warning', 'deleted locally only');
      }
    }
  };

  return (
    <div className="p-6 space-y-5 bg-slate-50">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-teal-50 border border-teal-200 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-teal-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 mb-1">Sistem Indexing & Bobot Remunerasi</h3>
            <p className="text-sm text-slate-600 max-w-3xl">
              Index digunakan sebagai dasar perhitungan pembagian jasa medis. Setiap jabatan, tingkat kesulitan
              tindakan, dan bonus prestasi memiliki bobot nilai yang berbeda sesuai kebijakan RSUD Mimika.
              Total bobot aktif saat ini: <b>{totalBobot.toFixed(2)}</b>
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Total Index</p>
          <p className="text-2xl font-bold text-slate-800">{formatNumber(items.length)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Index Aktif</p>
          <p className="text-2xl font-bold text-emerald-700">{formatNumber(totalAktif)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Total Kategori</p>
          <p className="text-2xl font-bold text-teal-700">{kategoriList.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">Total Bobot</p>
          <p className="text-2xl font-bold text-cyan-700">{totalBobot.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Tag className="w-4 h-4 text-slate-500" />
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[130px]"
          >
            <option>Semua</option>
            {kategoriList.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau kode index..."
            className="bg-transparent text-sm focus:outline-none w-full"
          />
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
          title="Export ke Excel"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Excel
        </button>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-3 py-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100"
          title="Export ke PDF"
        >
          <FileText className="w-4 h-4" />
          PDF
        </button>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Index
        </button>
      </div>

      {/* Kategori Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {kategoriList.map((kat) => {
          const itemsKat = items.filter((i) => i.kategori === kat);
          if (itemsKat.length === 0) return null;
          return (
            <div key={kat} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className={`px-5 py-3 border-b border-slate-200 ${warnaKategori[kat]}`}>
                <h3 className="font-bold text-sm">{kat}</h3>
                <p className="text-xs opacity-80">{itemsKat.length} index · Total bobot: {itemsKat.reduce((s, i) => s + (i.bobot || 0), 0).toFixed(2)}</p>
              </div>
              <div className="divide-y divide-slate-100">
                {itemsKat.map((item) => (
                  <div key={item.id} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-slate-800 truncate">{item.namaIndex}</p>
                        <button onClick={() => toggleAktif(item.id)} title="Toggle aktif">
                          {item.aktif ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-300" />
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500">{item.kodeIndex}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.keterangan}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-lg font-bold text-teal-700">{(item.bobot ?? 0).toFixed(2)}</span>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1 text-slate-400 hover:bg-sky-50 hover:text-sky-600 rounded"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{editing ? 'Edit Index' : 'Tambah Index Baru'}</h3>
                <p className="text-xs text-indigo-100">Kelola master data bobot remunerasi</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white text-2xl">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Kode Index</label>
                  <input
                    value={form.kodeIndex}
                    onChange={(e) => setForm({ ...form, kodeIndex: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">Bobot Nilai</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.bobot}
                    onChange={(e) => setForm({ ...form, bobot: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Nama Index</label>
                <input
                  value={form.namaIndex}
                  onChange={(e) => setForm({ ...form, namaIndex: e.target.value })}
                  placeholder="Contoh: Dokter Spesialis Anak"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Kategori</label>
                <select
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {kategoriList.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">Keterangan</label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  rows={3}
                  placeholder="Penjelasan singkat mengenai index ini"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.aktif}
                  onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Index aktif dan dapat digunakan</span>
              </label>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
