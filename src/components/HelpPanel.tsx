import {
  X,
  HelpCircle,
  Keyboard,
  FileText,
  Lightbulb,
  Mail,
  ExternalLink,
  ChevronRight,
  Search,
  Calculator,
  CheckCircle2,
  Database,
} from 'lucide-react';

interface HelpPanelProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['Ctrl', 'K'], action: 'Buka pencarian global', icon: Search },
  { keys: ['F1'], action: 'Buka panel bantuan ini', icon: HelpCircle },
  { keys: ['Esc'], action: 'Tutup modal / panel', icon: X },
  { keys: ['Ctrl', 'P'], action: 'Cetak halaman', icon: FileText },
];

const panduanModul = [
  {
    id: 'transaksi',
    title: 'Transaksi',
    icon: Database,
    items: [
      'Input Pendapatan: Catat semua pendapatan per unit layanan',
      'Input Jasa Medis: Catat jasa per tenaga kesehatan',
      'Indexing: Atur bobot nilai untuk setiap jabatan/tindakan',
    ],
  },
  {
    id: 'proses',
    title: 'Proses',
    icon: Calculator,
    items: [
      'Kalkulator: Simulasi distribusi jasa dengan slider interaktif',
      'Hasil Kalkulasi: Laporan hasil perhitungan per unit',
      'Persetujuan: Workflow approval 3 level (Unit → Keuangan → Direksi)',
    ],
  },
  {
    id: 'master',
    title: 'Master Data',
    icon: CheckCircle2,
    items: [
      'Profil Nakes: Data lengkap tenaga kesehatan termasuk STR & SIP',
      'Pengaturan: Konfigurasi nama RS, periode, dan persentase default',
      'Activity Log: Audit trail semua aktivitas pengguna',
    ],
  },
];

const tipsBestPractice = [
  'Input data pendapatan harian setiap sore sebelum jam operasional berakhir',
  'Verifikasi jasa medis dilakukan maksimal H+1 setelah periode tutup',
  'Gunakan Kalkulator untuk simulasi sebelum finalisasi hasil',
  'Pastikan approval level Direksi dilakukan sebelum pencairan',
  'Export laporan bulanan sebagai arsip (Excel + PDF)',
];

export default function HelpPanel({ open, onClose }: HelpPanelProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] bg-white shadow-2xl z-[60] overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 text-white px-6 py-6 sticky top-0 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Pusat Bantuan</h2>
                <p className="text-sky-100 text-sm mt-1">Panduan penggunaan SIM Remunerasi</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contact card */}
          <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs text-sky-50">
              Butuh bantuan langsung? Hubungi:{' '}
              <a href="mailto:support@rsudmimika.go.id" className="underline font-semibold hover:text-white">
                support@rsudmimika.go.id
              </a>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Keyboard Shortcuts */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Keyboard className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-slate-800">Shortcut Keyboard</h3>
            </div>
            <div className="space-y-2">
              {shortcuts.map((sc, idx) => {
                const Icon = sc.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-sky-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700">{sc.action}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-slate-400 text-xs">+</span>}
                          <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-[10px] font-mono text-slate-700 shadow-sm">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Modul Overview */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-800">Overview Modul</h3>
            </div>
            <div className="space-y-3">
              {panduanModul.map((modul) => {
                const Icon = modul.icon;
                return (
                  <details
                    key={modul.id}
                    className="group bg-white border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <summary className="flex items-center gap-3 p-3 cursor-pointer list-none hover:bg-slate-50 transition">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm flex-1">{modul.title}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-3 pb-3 pt-1 ml-12">
                      <ul className="space-y-1.5">
                        {modul.items.map((item, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                            <span className="text-teal-500 mt-0.5">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>

          {/* Best Practice */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800">Best Practice</h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2.5">
              {tipsBestPractice.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-900">
                  <span className="flex-shrink-0 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Resources */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800">Dokumentasi</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'README.md - Panduan Instalasi', desc: 'Cara setup & konfigurasi' },
                { label: 'API_DOCUMENTATION.md', desc: 'Dokumentasi endpoint API' },
                { label: 'DEPLOYMENT_GUIDE.md', desc: 'Panduan deploy ke server' },
              ].map((doc, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition group"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700">{doc.label}</p>
                    <p className="text-[10px] text-slate-500">{doc.desc}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
                </a>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center sticky bottom-0">
          <p className="text-[10px] text-slate-500">
            © 2026 RSUD Mimika · SIM Remunerasi v1.0.0 · Dikembangkan dengan ❤️
          </p>
        </div>
      </div>
    </>
  );
}
