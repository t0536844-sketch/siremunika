import { useState, useEffect, useMemo } from 'react';
import { Search, X, ArrowRight, Wallet, Stethoscope, BarChart3, ClipboardCheck, FileBarChart2, Calculator, LayoutDashboard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataPendapatan, dataJasa, dataIndexing, dataHasil, dataApproval } from '../data/mockData';
import { formatRupiah } from '../utils/helpers';

interface SearchResult {
  id: string;
  type: string;
  page: string;
  title: string;
  subtitle: string;
  icon: any;
  meta?: string;
  color: string;
}

const pageMap = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-teal-600' },
  { id: 'pendapatan', label: 'Input Pendapatan', icon: Wallet, color: 'text-teal-600' },
  { id: 'jasa', label: 'Input Jasa Medis', icon: Stethoscope, color: 'text-cyan-600' },
  { id: 'indexing', label: 'Indexing', icon: BarChart3, color: 'text-indigo-600' },
  { id: 'kalkulasi', label: 'Kalkulator', icon: Calculator, color: 'text-amber-600' },
  { id: 'hasil', label: 'Hasil Kalkulasi', icon: FileBarChart2, color: 'text-emerald-600' },
  { id: 'approval', label: 'Persetujuan', icon: ClipboardCheck, color: 'text-rose-600' },
  { id: 'pembayaran', label: 'Output Pembayaran', icon: FileBarChart2, color: 'text-green-600' },
  { id: 'users', label: 'Manajemen User', icon: ClipboardCheck, color: 'text-violet-600' },
];

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setActivePage } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) {
      // Show pages as quick access
      return pageMap.map((p) => ({
        id: p.id,
        type: 'Halaman',
        page: p.id,
        title: p.label,
        subtitle: 'Buka halaman',
        icon: p.icon,
        color: p.color,
      }));
    }

    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    // Pages
    pageMap.forEach((p) => {
      if (p.label.toLowerCase().includes(q)) {
        out.push({ id: p.id, type: 'Halaman', page: p.id, title: p.label, subtitle: 'Navigasi', icon: p.icon, color: p.color });
      }
    });

    // Pendapatan
    dataPendapatan
      .filter((d) => d.unit.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.operator.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((d) => {
        out.push({
          id: d.id,
          type: 'Pendapatan',
          page: 'pendapatan',
          title: `${d.unit} - ${d.jenisPelayanan}`,
          subtitle: `${d.operator} · ${d.id}`,
          meta: formatRupiah(d.nilaiPendapatan),
          icon: Wallet,
          color: 'text-teal-600',
        });
      });

    // Jasa
    dataJasa
      .filter((d) => d.nakes.toLowerCase().includes(q) || d.unit.toLowerCase().includes(q) || d.jabatan.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((d) => {
        out.push({
          id: d.id,
          type: 'Jasa Medis',
          page: 'jasa',
          title: d.nakes,
          subtitle: `${d.jabatan} · ${d.unit}`,
          meta: formatRupiah(d.totalJasa),
          icon: Stethoscope,
          color: 'text-cyan-600',
        });
      });

    // Indexing
    dataIndexing
      .filter((d) => d.namaIndex.toLowerCase().includes(q) || d.kodeIndex.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((d) => {
        out.push({
          id: d.id,
          type: 'Index',
          page: 'indexing',
          title: d.namaIndex,
          subtitle: `${d.kategori} · ${d.kodeIndex}`,
          meta: `Bobot ${d.bobot.toFixed(2)}`,
          icon: BarChart3,
          color: 'text-indigo-600',
        });
      });

    // Hasil
    dataHasil
      .filter((d) => d.unit.toLowerCase().includes(q) || d.periode.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((d) => {
        out.push({
          id: d.id,
          type: 'Hasil',
          page: 'hasil',
          title: `${d.unit} - ${d.periode}`,
          subtitle: `Status: ${d.status}`,
          meta: formatRupiah(d.netto),
          icon: FileBarChart2,
          color: 'text-emerald-600',
        });
      });

    // Approval
    dataApproval
      .filter((d) => d.referensi.toLowerCase().includes(q) || d.pengaju.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((d) => {
        out.push({
          id: d.id,
          type: 'Approval',
          page: 'approval',
          title: d.referensi,
          subtitle: `${d.pengaju} · ${d.level}`,
          meta: formatRupiah(d.nilai),
          icon: ClipboardCheck,
          color: 'text-rose-600',
        });
      });

    return out;
  }, [query]);

  const handleSelect = (page: string) => {
    setActivePage(page);
    onClose();
  };

  if (!open) return null;

  // Group results by type
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-start justify-center z-[60] pt-[10vh] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-black/60 w-full max-w-2xl overflow-hidden">
        {/* Search Input */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pendapatan, jasa, nakes, unit, index..."
            className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-100"
          />
          <kbd className="hidden md:flex items-center px-2 py-0.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded font-mono">
            ESC
          </kbd>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada hasil untuk "{query}"</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Coba kata kunci lain</p>
            </div>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <p className="px-5 py-2 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 font-semibold sticky top-0">
                  {type} ({items.length})
                </p>
                {items.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => handleSelect(r.page)}
                      className="w-full px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 text-left group transition"
                    >
                      <div className={`w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 ${r.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{r.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.subtitle}</p>
                      </div>
                      {r.meta && (
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">{r.meta}</span>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex-shrink-0 transition" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono">↑↓</kbd>{' '}
            navigasi ·{' '}
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono">Enter</kbd>{' '}
            pilih
          </span>
          <span>Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono">Ctrl+K</kbd> untuk membuka</span>
        </div>
      </div>
    </div>
  );
}
