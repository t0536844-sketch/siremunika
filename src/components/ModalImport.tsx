import { useState, useRef, useCallback } from 'react';
import {
  X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle,
  XCircle, FileText, ChevronRight, Loader2, RefreshCw, Eye, EyeOff,
  Info, ArrowRight, Check, Trash2,
} from 'lucide-react';
import { parseFile, processRows, downloadTemplate } from '../utils/importer';
import type { ImportColumn, ImportResult, ImportError } from '../utils/importer';
import { formatNumber } from '../utils/helpers';

// ─── Props ─────────────────────────────────────────────────────
export interface ModalImportProps<T> {
  open: boolean;
  onClose: () => void;
  onImport: (rows: T[]) => void;

  title: string;
  description: string;
  accentColor: 'teal' | 'cyan';

  columns: ImportColumn[];
  templateFilename: string;
  templateSampleRows: any[][];

  /** Preview yang ditampilkan di tabel preview */
  previewColumns: { key: string; label: string; width?: string }[];
}

// ─── Step ──────────────────────────────────────────────────────
type Step = 1 | 2 | 3;   // 1=upload, 2=preview, 3=selesai

// ─── Ukuran file max: 5 MB ─────────────────────────────────────
const MAX_SIZE = 5 * 1024 * 1024;

const ACCENT = {
  teal: {
    gradient: 'from-teal-700 to-teal-800',
    ring: 'focus:ring-teal-500',
    btn: 'bg-teal-600 hover:bg-teal-700',
    badge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700',
    border: 'border-teal-400',
    text: 'text-teal-700 dark:text-teal-400',
    light: 'bg-teal-50 dark:bg-teal-900/20',
  },
  cyan: {
    gradient: 'from-cyan-700 to-cyan-800',
    ring: 'focus:ring-cyan-500',
    btn: 'bg-cyan-600 hover:bg-cyan-700',
    badge: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700',
    border: 'border-cyan-400',
    text: 'text-cyan-700 dark:text-cyan-400',
    light: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
};

export default function ModalImport<T extends Record<string, any>>({
  open, onClose, onImport,
  title, description, accentColor,
  columns, templateFilename, templateSampleRows,
  previewColumns,
}: ModalImportProps<T>) {
  const ac = ACCENT[accentColor];
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep]                         = useState<Step>(1);
  const [isDragging, setIsDragging]             = useState(false);
  const [file, setFile]                         = useState<File | null>(null);
  const [parseError, setParseError]             = useState('');
  const [loading, setLoading]                   = useState(false);
  const [result, setResult]                     = useState<ImportResult<T> | null>(null);
  const [showErrors, setShowErrors]             = useState(true);
  const [importedCount, setImportedCount]       = useState(0);
  const [previewPage, setPreviewPage]           = useState(1);
  const PREVIEW_SIZE = 8;

  const reset = () => {
    setStep(1); setFile(null); setParseError('');
    setResult(null); setLoading(false); setImportedCount(0);
    setPreviewPage(1); setShowErrors(true);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => { reset(); onClose(); };

  // ── File pick / drag drop ────────────────────────────────────
  const handleFile = useCallback(async (f: File) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      setParseError('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv');
      return;
    }
    if (f.size > MAX_SIZE) {
      setParseError(`Ukuran file terlalu besar (maks 5 MB). File Anda: ${(f.size / 1024 / 1024).toFixed(1)} MB`);
      return;
    }
    setParseError('');
    setFile(f);
    setLoading(true);
    try {
      const rawRows = await parseFile(f);
      const res = processRows<T>(rawRows, columns);
      setResult(res);
      setStep(2);
    } catch (err: any) {
      setParseError(err.message || 'Terjadi kesalahan saat memproses file.');
    } finally {
      setLoading(false);
    }
  }, [columns]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleConfirmImport = () => {
    if (!result) return;
    onImport(result.valid);
    setImportedCount(result.valid.length);
    setStep(3);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(templateFilename, columns, templateSampleRows);
  };

  // Pagination preview
  const previewRows = result?.valid ?? [];
  const totalPages  = Math.ceil(previewRows.length / PREVIEW_SIZE);
  const pageRows    = previewRows.slice((previewPage - 1) * PREVIEW_SIZE, previewPage * PREVIEW_SIZE);

  // ─────────────────────────────────────────────────────────────
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:shadow-black/50 w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-pop">

        {/* ── Header ── */}
        <div className={`bg-gradient-to-r ${ac.gradient} text-white px-6 py-5 flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-xs opacity-80">{description}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-white/70 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step Indicator ── */}
        <div className="flex items-center px-6 pt-4 pb-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          {[
            { num: 1, label: 'Upload File' },
            { num: 2, label: 'Preview & Validasi' },
            { num: 3, label: 'Selesai' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.num
                    ? 'bg-emerald-500 text-white'
                    : step === s.num
                      ? `${ac.btn} text-white shadow-md`
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${step === s.num ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
              {idx < 2 && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-3" />}
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ══ STEP 1: Upload ══ */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              {/* Panduan kolom */}
              <div className={`${ac.light} border ${ac.border.replace('border-', 'border-').replace('400', '200')} dark:border-opacity-30 rounded-2xl p-4`}>
                <div className="flex items-start gap-3">
                  <Info className={`w-5 h-5 ${ac.text} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${ac.text} mb-2`}>Format kolom yang diperlukan:</p>
                    <div className="flex flex-wrap gap-2">
                      {columns.map((col) => (
                        <span key={col.key} className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold ${ac.badge} ${col.required ? 'ring-1 ring-offset-1' : 'opacity-80'}`}>
                          {col.header}{col.required && ' *'}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">* = Kolom wajib diisi</p>
                  </div>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? `${ac.border} ${ac.light} scale-[1.01]`
                    : 'border-slate-300 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={onInputChange}
                />
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className={`w-12 h-12 ${ac.text} animate-spin`} />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Memproses file…</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileSpreadsheet className={`w-12 h-12 ${ac.text}`} />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(1)} KB · Klik untuk ganti file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-2xl ${ac.light} flex items-center justify-center`}>
                      <Upload className={`w-8 h-8 ${ac.text}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Seret file ke sini atau klik untuk pilih</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Mendukung .xlsx, .xls, .csv · Maks 5 MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error file */}
              {parseError && (
                <div className="flex items-start gap-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl px-4 py-3">
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700 dark:text-rose-300">{parseError}</p>
                </div>
              )}

              {/* Download template */}
              <div className="bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum punya template?</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Unduh template Excel lengkap beserta panduan pengisian</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 2: Preview & Validasi ══ */}
          {step === 2 && result && (
            <div className="p-6 space-y-5">
              {/* Summary result */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Baris Dibaca', value: result.totalRows, icon: FileSpreadsheet, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-700' },
                  { label: 'Data Valid', value: result.valid.length, icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
                  { label: 'Baris Error', value: result.errors.length, icon: XCircle, color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30' },
                  { label: 'Baris Dilewati', value: result.skipped, icon: AlertTriangle, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-slate-200 dark:border-slate-700`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${s.color}`} />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{s.label}</p>
                      </div>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Tabel preview data valid */}
              {result.valid.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Preview Data Valid ({formatNumber(result.valid.length)} baris)
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">Halaman {previewPage}/{totalPages}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700">
                          <th className="px-3 py-2.5 text-left text-slate-500 dark:text-slate-400 font-semibold w-10">#</th>
                          {previewColumns.map((col) => (
                            <th key={col.key} className={`px-3 py-2.5 text-left text-slate-600 dark:text-slate-400 font-semibold ${col.width ?? ''}`}>
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((row, i) => (
                          <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                            <td className="px-3 py-2 text-slate-400 dark:text-slate-500 font-mono">
                              {(previewPage - 1) * PREVIEW_SIZE + i + 1}
                            </td>
                            {previewColumns.map((col) => (
                              <td key={col.key} className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
                                {String(row[col.key] ?? '-')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination preview */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/40 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                        disabled={previewPage === 1}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                      >
                        ← Sebelumnya
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPreviewPage(i + 1)}
                            className={`w-7 h-7 text-xs rounded-lg font-medium transition ${previewPage === i + 1 ? `${ac.btn} text-white` : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                        disabled={previewPage === totalPages}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                      >
                        Berikutnya →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Daftar error */}
              {result.errors.length > 0 && (
                <div className="bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setShowErrors(!showErrors)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-rose-50 dark:bg-rose-900/30 border-b border-rose-100 dark:border-rose-800 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                        {result.errors.length} Error Ditemukan — Baris ini tidak akan diimport
                      </p>
                    </div>
                    {showErrors ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4 text-rose-400" />}
                  </button>
                  {showErrors && (
                    <div className="max-h-48 overflow-y-auto divide-y divide-rose-50 dark:divide-rose-900/30">
                      {result.errors.slice(0, 50).map((err: ImportError, i) => (
                        <div key={i} className="flex items-start gap-3 px-4 py-2.5 hover:bg-rose-50/50 dark:hover:bg-rose-900/20">
                          <span className="text-[10px] font-mono bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                            Baris {err.row}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{err.column}</p>
                            <p className="text-[10px] text-rose-600 dark:text-rose-400">{err.message}</p>
                            {err.value && <p className="text-[10px] text-slate-400 font-mono truncate">Nilai: "{err.value}"</p>}
                          </div>
                        </div>
                      ))}
                      {result.errors.length > 50 && (
                        <p className="px-4 py-2 text-xs text-rose-500 dark:text-rose-400 text-center">
                          + {result.errors.length - 50} error lainnya tidak ditampilkan
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Empty valid */}
              {result.valid.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-3 text-center">
                  <XCircle className="w-12 h-12 text-rose-300 dark:text-rose-700" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada data valid yang bisa diimport</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Perbaiki error di atas lalu upload ulang file.</p>
                  <button onClick={() => setStep(1)} className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition">
                    <RefreshCw className="w-4 h-4" /> Upload Ulang
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 3: Selesai ══ */}
          {step === 3 && (
            <div className="p-10 flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Import Berhasil!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">{formatNumber(importedCount)}</span> baris data berhasil diimport ke sistem.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={handleClose}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-md transition">
                  <Check className="w-4 h-4" /> Selesai
                </button>
                <button onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                  <Upload className="w-4 h-4" /> Import Lagi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step !== 3 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {step === 2 && file && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <button onClick={() => setStep(1)} className="text-rose-500 hover:text-rose-700 transition" title="Ganti file">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {step === 1 && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Format didukung: .xlsx, .xls, .csv · Maks 5 MB
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                Batal
              </button>
              {step === 2 && result && result.valid.length > 0 && (
                <button onClick={handleConfirmImport}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white ${ac.btn} rounded-xl shadow-sm transition`}>
                  <ArrowRight className="w-4 h-4" />
                  Import {formatNumber(result.valid.length)} Data
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
