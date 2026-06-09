import { useState } from 'react';
import {
  Search,
  FileText,
  FileSpreadsheet,
  Download,
  Clock,
  Calendar,
  Filter,
  TrendingUp,
  BarChart3,
  Users,
  Activity,
  FileJson,
  Printer,
  Eye,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { dataLaporan } from '../data/mockData';
import { formatNumber, formatDateShort } from '../utils/helpers';
import { useApp } from '../context/AppContext';
import { exportToExcel, exportToPDF, printPage } from '../utils/exporters';
import { getLaporanConfig } from '../utils/laporanConfigs';
import PreviewLaporan from '../components/PreviewLaporan';
import type { LaporanItem } from '../data/mockData';

// ─── Konfigurasi tampilan per kategori ────────────────────────────────────────
const warnaKategori: Record<string, string> = {
  Keuangan:   'bg-teal-100 text-teal-700 border-teal-200',
  SDM:        'bg-cyan-100 text-cyan-700 border-cyan-200',
  Operasional:'bg-amber-100 text-amber-700 border-amber-200',
  Analitik:   'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const iconKategori: Record<string, any> = {
  Keuangan:   TrendingUp,
  SDM:        Users,
  Operasional:Activity,
  Analitik:   BarChart3,
};

const accentKategori: Record<string, string> = {
  Keuangan:   'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200',
  SDM:        'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200',
  Operasional:'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
  Analitik:   'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
};

// ─── Tipe state loading per tombol ────────────────────────────────────────────
type LoadingKey = `${string}-${'excel' | 'pdf' | 'print'}`;

// ─── Komponen utama ───────────────────────────────────────────────────────────
export default function Laporan() {
  const { showToast } = useApp();
  const [items]            = useState<LaporanItem[]>(dataLaporan);
  const [search, setSearch]                       = useState('');
  const [filterKategori, setFilterKategori]       = useState('Semua');
  const [filterFrekuensi, setFilterFrekuensi]     = useState('Semua');
  const [previewItem, setPreviewItem]             = useState<LaporanItem | null>(null);
  const [loadingKeys, setLoadingKeys]             = useState<Set<LoadingKey>>(new Set());
  const [doneKeys, setDoneKeys]                   = useState<Set<LoadingKey>>(new Set());

  const kategoris  = Object.keys(warnaKategori);
  const frekuensis = Array.from(new Set(items.map((i) => i.frekuensi)));

  const filtered = items.filter(
    (i) =>
      (filterKategori  === 'Semua' || i.kategori  === filterKategori)  &&
      (filterFrekuensi === 'Semua' || i.frekuensi === filterFrekuensi) &&
      i.nama.toLowerCase().includes(search.toLowerCase())
  );

  // ── Helpers: loading state ──────────────────────────────────────────────────
  const setLoading = (key: LoadingKey, on: boolean) =>
    setLoadingKeys((prev) => {
      const s = new Set(prev);
      on ? s.add(key) : s.delete(key);
      return s;
    });

  const setDone = (key: LoadingKey) => {
    setDoneKeys((prev) => new Set(prev).add(key));
    setTimeout(() =>
      setDoneKeys((prev) => {
        const s = new Set(prev); s.delete(key); return s;
      }), 2000
    );
  };

  // ── Handler XLSX – data nyata ───────────────────────────────────────────────
  const handleExcel = (item: LaporanItem) => {
    const key: LoadingKey = `${item.id}-excel`;
    const cfg = getLaporanConfig(item.id);
    if (!cfg) { showToast('error', 'Konfigurasi tidak ditemukan', item.id); return; }

    setLoading(key, true);
    setTimeout(() => {
      try {
        const data = cfg.getData();
        exportToExcel(
          item.nama.replace(/\s+/g, '_'),
          cfg.sheetName,
          cfg.excelCols,
          data,
          {
            title: item.nama.toUpperCase(),
            subtitle: `${cfg.description} | ${formatNumber(data.length)} baris | ${formatDateShort(item.terakhir_dibuat)}`,
          }
        );
        showToast('success', `✅ ${item.nama}`, `${formatNumber(data.length)} baris diekspor ke Excel`);
        setDone(key);
      } catch {
        showToast('error', 'Gagal export Excel', item.nama);
      } finally {
        setLoading(key, false);
      }
    }, 350);                       // delay kecil supaya loading spinner terlihat
  };

  // ── Handler PDF – data nyata ────────────────────────────────────────────────
  const handlePDF = (item: LaporanItem) => {
    const key: LoadingKey = `${item.id}-pdf`;
    const cfg = getLaporanConfig(item.id);
    if (!cfg) { showToast('error', 'Konfigurasi tidak ditemukan', item.id); return; }

    setLoading(key, true);
    setTimeout(() => {
      try {
        const data = cfg.getData();
        exportToPDF(
          item.nama.replace(/\s+/g, '_'),
          item.nama,
          cfg.pdfCols,
          data,
          {
            subtitle: `${cfg.description}  |  ${formatNumber(data.length)} baris  |  ${formatDateShort(item.terakhir_dibuat)}`,
            orientation: cfg.orientasi,
          }
        );
        showToast('success', `✅ ${item.nama}`, `${formatNumber(data.length)} baris diekspor ke PDF`);
        setDone(key);
      } catch {
        showToast('error', 'Gagal export PDF', item.nama);
      } finally {
        setLoading(key, false);
      }
    }, 350);
  };

  // ── Handler Print ───────────────────────────────────────────────────────────
  const handlePrint = (item: LaporanItem) => {
    const key: LoadingKey = `${item.id}-print`;
    setLoading(key, true);
    showToast('info', 'Menyiapkan laporan untuk cetak…', item.nama);
    setTimeout(() => {
      printPage();
      setLoading(key, false);
      setDone(key);
    }, 400);
  };

  // ── Render tombol aksi dengan loading ──────────────────────────────────────
  const ActionBtn = ({
    lKey,
    onClick,
    icon: Icon,
    label,
    cls,
  }: {
    lKey: LoadingKey;
    onClick: () => void;
    icon: any;
    label: string;
    cls: string;
  }) => {
    const isLoading = loadingKeys.has(lKey);
    const isDone    = doneKeys.has(lKey);
    return (
      <button
        onClick={onClick}
        disabled={isLoading}
        title={label}
        className={`relative flex flex-col items-center gap-0.5 p-2 rounded-xl border transition
          text-[10px] font-semibold select-none
          hover:scale-105 active:scale-95
          disabled:opacity-60 disabled:cursor-wait disabled:scale-100
          ${cls}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isDone ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        {isDone ? 'Selesai' : label}
      </button>
    );
  };

  // ─── Ringkasan stats ──────────────────────────────────────────────────────
  const totalBaris = items.reduce((s, i) => s + i.total_baris, 0);

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 space-y-5 bg-slate-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Pusat Laporan</h2>
              <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
                Preview, ekspor Excel, ekspor PDF, dan cetak laporan keuangan, SDM, operasional, dan analitik
                menggunakan <span className="font-semibold text-white">data nyata</span> dari sistem.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <FileSpreadsheet className="w-4 h-4" />
              {items.length} Template
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <FileJson className="w-4 h-4" />
              {kategoris.length} Kategori
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <BarChart3 className="w-4 h-4" />
              {formatNumber(totalBaris)} Total Baris
            </div>
          </div>
        </div>
      </div>

      {/* ── Kartu ringkasan per kategori ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kategoris.map((kat) => {
          const Icon    = iconKategori[kat];
          const count   = items.filter((i) => i.kategori === kat).length;
          const isActive = filterKategori === kat;
          return (
            <button
              key={kat}
              onClick={() => setFilterKategori(isActive ? 'Semua' : kat)}
              className={`p-4 rounded-2xl border-2 transition-all hover:shadow-md text-left ${
                isActive
                  ? 'border-teal-500 bg-teal-50 shadow-md scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-teal-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${warnaKategori[kat]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{kat}</p>
                  <p className="text-xl font-bold text-slate-800">{count}</p>
                </div>
                {isActive && (
                  <span className="ml-auto text-[9px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold">Aktif</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center gap-3">
        {/* Kategori */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[130px]"
          >
            <option>Semua</option>
            {kategoris.map((k) => <option key={k}>{k}</option>)}
          </select>
        </div>
        {/* Frekuensi */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={filterFrekuensi}
            onChange={(e) => setFilterFrekuensi(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[120px]"
          >
            <option>Semua</option>
            {frekuensis.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama laporan…"
            className="bg-transparent text-sm focus:outline-none w-full placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-700 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className="text-xs text-slate-500 tabular-nums">
          {filtered.length} / {items.length} laporan
        </span>
        {/* Reset semua filter */}
        {(search || filterKategori !== 'Semua' || filterFrekuensi !== 'Semua') && (
          <button
            onClick={() => { setSearch(''); setFilterKategori('Semua'); setFilterFrekuensi('Semua'); }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* ── Grid kartu laporan ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const Icon    = iconKategori[item.kategori] || FileText;
          const accent  = accentKategori[item.kategori] || 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200';
          const cfg     = getLaporanConfig(item.id);
          const hasData = !!cfg;

          // Hitung total nilai dari data nyata untuk display
          const data = hasData ? cfg.getData() : [];
          const totalBarisCfg = data.length;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-teal-200 transition-all flex flex-col group"
            >
              {/* ── Header kartu ── */}
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${warnaKategori[item.kategori]} shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${warnaKategori[item.kategori]}`}>
                    {item.kategori}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                    {item.frekuensi}
                  </span>
                  {/* Indikator data nyata */}
                  {hasData && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold">
                      ● Live
                    </span>
                  )}
                </div>
              </div>

              {/* ── Judul & deskripsi ── */}
              <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-teal-800 transition-colors">
                {item.nama}
              </h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2 flex-grow leading-relaxed">
                {cfg?.description || item.deskripsi}
              </p>

              {/* ── Meta info ── */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Ukuran</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{item.ukuran}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100 text-center">
                  <p className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide">Data</p>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                    {hasData ? formatNumber(totalBarisCfg) : formatNumber(item.total_baris)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center">
                  <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Sumber</p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{hasData ? 'Sistem' : 'Simulasi'}</p>
                </div>
              </div>

              {/* ── Timestamp ── */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-4 pb-3 border-b border-slate-100">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Terakhir: {formatDateShort(item.terakhir_dibuat)}
                </span>
                <span className="font-mono text-teal-600 font-semibold">{item.id}</span>
              </div>

              {/* ── Tombol aksi (4 tombol) ── */}
              <div className="grid grid-cols-4 gap-1.5 mt-auto">
                {/* LIHAT */}
                <button
                  onClick={() => setPreviewItem(item)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border transition text-[10px] font-semibold hover:scale-105 active:scale-95 ${accent}`}
                  title={`Preview ${item.nama}`}
                >
                  <Eye className="w-4 h-4" />
                  Lihat
                </button>

                {/* XLSX */}
                <ActionBtn
                  lKey={`${item.id}-excel`}
                  onClick={() => handleExcel(item)}
                  icon={FileSpreadsheet}
                  label="XLSX"
                  cls="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                />

                {/* PDF */}
                <ActionBtn
                  lKey={`${item.id}-pdf`}
                  onClick={() => handlePDF(item)}
                  icon={FileText}
                  label="PDF"
                  cls="text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                />

                {/* CETAK */}
                <ActionBtn
                  lKey={`${item.id}-print`}
                  onClick={() => handlePrint(item)}
                  icon={Printer}
                  label="Cetak"
                  cls="text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                />
              </div>
            </div>
          );
        })}

        {/* ── Empty state ── */}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Download className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-semibold text-slate-600">Tidak ada laporan ditemukan</p>
            <p className="text-xs mt-1">Coba ubah kata kunci atau filter kategori</p>
            <button
              onClick={() => { setSearch(''); setFilterKategori('Semua'); setFilterFrekuensi('Semua'); }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Preview Laporan ── */}
      {previewItem && (
        <PreviewLaporan
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
}
