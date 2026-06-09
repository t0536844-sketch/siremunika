import { useState, useEffect } from 'react';
import {
  X, Settings as SettingsIcon, Save, Building2, Percent,
  Mail, RefreshCw, Calculator, Sun, Moon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsPanel() {
  const { settings, updateSettings, showSettings, setShowSettings, showToast, isDark, toggleTheme } = useApp();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    if (showSettings) setForm(settings);
  }, [showSettings, settings]);

  if (!showSettings) return null;

  const totalPersentase =
    form.bebanOperasional + form.jasaMedis + form.jasaParamedis + form.jasaPenunjang + form.bonusPrestasi;

  const handleSave = () => {
    if (totalPersentase !== 100) {
      showToast('error', 'Total persentase harus 100%', `Saat ini: ${totalPersentase}%`);
      return;
    }
    if (!form.namaRS || !form.emailNotifikasi) {
      showToast('error', 'Data wajib belum lengkap', 'Nama RS dan email harus diisi');
      return;
    }
    updateSettings(form);
    showToast('success', 'Pengaturan disimpan', 'Perubahan telah diterapkan ke seluruh sistem');
    setShowSettings(false);
  };

  const handleReset = () => {
    if (confirm('Reset semua pengaturan ke default?')) {
      const defaults = {
        namaRS: 'RSUD Mimika',
        periode: 'Januari 2026',
        bebanOperasional: 40,
        jasaMedis: 30,
        jasaParamedis: 15,
        jasaPenunjang: 9,
        bonusPrestasi: 6,
        pajakPPh: 5,
        approvalAutoLevel: true,
        emailNotifikasi: 'admin.rsud@mimika.go.id',
        theme: 'light' as const,
      };
      setForm(defaults);
      showToast('info', 'Pengaturan direset', 'Klik Simpan untuk menerapkan');
    }
  };

  // Kelas input konsisten (light + dark)
  const inputCls = 'w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-400 dark:placeholder:text-slate-500';
  const labelCls = 'text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block';
  const sectionTitleCls = 'text-sm font-bold text-slate-800 dark:text-slate-100';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Pengaturan Sistem</h3>
              <p className="text-xs text-slate-300">Konfigurasi global SIM Remunerasi</p>
            </div>
          </div>
          <button onClick={() => setShowSettings(false)} className="text-white/70 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-7 bg-white dark:bg-slate-800">

          {/* — Informasi RS — */}
          <section>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
              <Building2 className="w-4 h-4 text-teal-600" />
              <h4 className={sectionTitleCls}>Informasi Rumah Sakit</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nama Rumah Sakit</label>
                <input
                  value={form.namaRS}
                  onChange={(e) => setForm({ ...form, namaRS: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Periode Aktif</label>
                <input
                  value={form.periode}
                  onChange={(e) => setForm({ ...form, periode: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
          </section>

          {/* — Persentase Distribusi — */}
          <section>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-teal-600" />
                <h4 className={sectionTitleCls}>Persentase Distribusi Default</h4>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                totalPersentase === 100
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400'
              }`}>
                Total: {totalPersentase}%
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'bebanOperasional', label: 'Beban Operasional', color: 'border-slate-300 dark:border-slate-500' },
                { key: 'jasaMedis',        label: 'Jasa Medis',        color: 'border-teal-300 dark:border-teal-600' },
                { key: 'jasaParamedis',    label: 'Jasa Paramedis',    color: 'border-cyan-300 dark:border-cyan-600' },
                { key: 'jasaPenunjang',    label: 'Jasa Penunjang',    color: 'border-amber-300 dark:border-amber-600' },
                { key: 'bonusPrestasi',    label: 'Bonus Prestasi',    color: 'border-emerald-300 dark:border-emerald-600' },
                { key: 'pajakPPh',         label: 'Pajak PPh 21',      color: 'border-rose-300 dark:border-rose-600' },
              ].map((item) => (
                <div key={item.key}>
                  <label className={labelCls}>{item.label}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={(form as any)[item.key]}
                      onChange={(e) => setForm({ ...form, [item.key]: Number(e.target.value) } as any)}
                      className={`w-full pl-3 pr-8 py-2 border-2 ${item.color} rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                    <Percent className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* — Notifikasi & Approval — */}
          <section>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
              <Mail className="w-4 h-4 text-teal-600" />
              <h4 className={sectionTitleCls}>Notifikasi & Approval</h4>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Email Notifikasi</label>
                <input
                  type="email"
                  value={form.emailNotifikasi}
                  onChange={(e) => setForm({ ...form, emailNotifikasi: e.target.value })}
                  className={inputCls}
                />
              </div>
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <input
                  type="checkbox"
                  checked={form.approvalAutoLevel}
                  onChange={(e) => setForm({ ...form, approvalAutoLevel: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Auto-naik level approval</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Otomatis lanjut ke level berikutnya setelah disetujui</p>
                </div>
              </label>
            </div>
          </section>

          {/* — Tampilan / Dark Mode — */}
          <section>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
              {isDark ? <Moon className="w-4 h-4 text-violet-500" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <h4 className={sectionTitleCls}>Tampilan</h4>
            </div>

            {/* Toggle besar */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/60 rounded-2xl border border-slate-200 dark:border-slate-600 mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Mode {isDark ? 'Gelap' : 'Terang'} Aktif
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isDark ? 'Tampilan saat ini: Mode Gelap' : 'Tampilan saat ini: Mode Terang'}
                  </p>
                </div>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => {
                  toggleTheme();
                  setForm((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
                  showToast('info',
                    isDark ? '☀️ Mode Terang Aktif' : '🌙 Mode Gelap Aktif',
                    isDark ? 'Tampilan beralih ke mode terang' : 'Tampilan beralih ke mode gelap'
                  );
                }}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                  isDark ? 'bg-violet-600' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isDark ? 'translate-x-7' : 'translate-x-1'
                }`}>
                  {isDark ? <Moon className="w-3.5 h-3.5 text-violet-600" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                </span>
              </button>
            </div>

            {/* Card pilihan mode */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setForm({ ...form, theme: 'light' });
                  if (isDark) { toggleTheme(); showToast('info', '☀️ Mode Terang Aktif'); }
                }}
                className={`p-4 border-2 rounded-2xl flex items-center gap-3 text-left transition-all ${
                  !isDark
                    ? 'border-amber-400 bg-amber-50 shadow-md scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-600 hover:border-amber-300 bg-white dark:bg-slate-700'
                }`}
              >
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sun className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${!isDark ? 'text-amber-700' : 'text-slate-800 dark:text-slate-100'}`}>
                    Mode Terang
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Latar putih, teks gelap</p>
                  {!isDark && <span className="text-[9px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block">✓ Aktif</span>}
                </div>
              </button>

              <button
                onClick={() => {
                  setForm({ ...form, theme: 'dark' });
                  if (!isDark) { toggleTheme(); showToast('info', '🌙 Mode Gelap Aktif'); }
                }}
                className={`p-4 border-2 rounded-2xl flex items-center gap-3 text-left transition-all ${
                  isDark
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 shadow-md scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-600 hover:border-violet-300 bg-white dark:bg-slate-700'
                }`}
              >
                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Moon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-violet-700 dark:text-violet-300' : 'text-slate-800 dark:text-slate-100'}`}>
                    Mode Gelap
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Latar gelap, ramah mata</p>
                  {isDark && <span className="text-[9px] bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block">✓ Aktif</span>}
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Default
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
