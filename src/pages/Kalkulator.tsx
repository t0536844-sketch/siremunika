import { useState, useMemo, useEffect } from 'react';
import { Calculator, RefreshCw, FileSpreadsheet, FileText, Info, TrendingUp, DollarSign, PieChart, Check, Save } from 'lucide-react';
import { hitungRemunerasi } from '../utils/helpers';
import { formatRupiah } from '../utils/helpers';
import { exportToExcel, exportToPDF } from '../utils/exporters';
import { useApp } from '../context/AppContext';

export default function KalkulatorPage() {
  const { settings, showToast, updateSettings } = useApp();
  const [pendapatan, setPendapatan] = useState(4850000000);
  const [bebanOp, setBebanOp] = useState(settings.bebanOperasional);
  const [jasaMedis, setJasaMedis] = useState(settings.jasaMedis);
  const [jasaParamedis, setJasaParamedis] = useState(settings.jasaParamedis);
  const [jasaPenunjang, setJasaPenunjang] = useState(settings.jasaPenunjang);
  const [bonus, setBonus] = useState(settings.bonusPrestasi);
  const [pajak, setPajak] = useState(settings.pajakPPh);

  // Sync with settings
  useEffect(() => {
    setBebanOp(settings.bebanOperasional);
    setJasaMedis(settings.jasaMedis);
    setJasaParamedis(settings.jasaParamedis);
    setJasaPenunjang(settings.jasaPenunjang);
    setBonus(settings.bonusPrestasi);
    setPajak(settings.pajakPPh);
  }, [settings]);

  const hasil = useMemo(
    () =>
      hitungRemunerasi({
        totalPendapatan: pendapatan,
        persentaseBebanOperasional: bebanOp,
        persentaseJasaMedis: jasaMedis,
        persentaseJasaParamedis: jasaParamedis,
        persentaseJasaPenunjang: jasaPenunjang,
        persentaseBonus: bonus,
        persentasePajak: pajak,
      }),
    [pendapatan, bebanOp, jasaMedis, jasaParamedis, jasaPenunjang, bonus, pajak]
  );

  const totalPersentase = bebanOp + jasaMedis + jasaParamedis + jasaPenunjang + bonus;
  const valid = totalPersentase === 100;

  const reset = () => {
    setPendapatan(4850000000);
    setBebanOp(settings.bebanOperasional);
    setJasaMedis(settings.jasaMedis);
    setJasaParamedis(settings.jasaParamedis);
    setJasaPenunjang(settings.jasaPenunjang);
    setBonus(settings.bonusPrestasi);
    setPajak(settings.pajakPPh);
    showToast('info', 'Kalkulator direset', 'Persentase dikembalikan ke pengaturan default');
  };

  const saveAsDefault = () => {
    if (!valid) {
      showToast('error', 'Total persentase harus 100%', `Saat ini: ${totalPersentase}%`);
      return;
    }
    updateSettings({
      bebanOperasional: bebanOp,
      jasaMedis,
      jasaParamedis,
      jasaPenunjang,
      bonusPrestasi: bonus,
      pajakPPh: pajak,
    });
    showToast('success', 'Konfigurasi disimpan', 'Persentase ini menjadi default sistem');
  };

  const exportData = [
    { komponen: 'Total Pendapatan', persen: '100%', nilai: hasil.totalPendapatan },
    { komponen: 'Beban Operasional', persen: `${bebanOp}%`, nilai: hasil.totalBeban },
    { komponen: 'Jasa Medis', persen: `${jasaMedis}%`, nilai: hasil.totalJasaMedis },
    { komponen: 'Jasa Paramedis', persen: `${jasaParamedis}%`, nilai: hasil.totalJasaParamedis },
    { komponen: 'Jasa Penunjang', persen: `${jasaPenunjang}%`, nilai: hasil.totalJasaPenunjang },
    { komponen: 'Bonus Prestasi', persen: `${bonus}%`, nilai: hasil.bonusPrestasi },
    { komponen: 'Total Jasa Kotor', persen: '-', nilai: hasil.totalJasaKotor },
    { komponen: `Pajak PPh (${pajak}%)`, persen: `${pajak}%`, nilai: hasil.pajak },
    { komponen: 'NETTO DIBAYARKAN', persen: '-', nilai: hasil.netto },
  ];

  const exportColumns = [
    { header: 'Komponen', key: 'komponen', width: 28 },
    { header: 'Persentase', key: 'persen', width: 14 },
    { header: 'Nilai', key: 'nilai', format: 'currency' as const, width: 22 },
  ];

  const handleExportExcel = () => {
    exportToExcel('Simulasi_Kalkulasi', 'Kalkulasi', exportColumns, exportData, {
      title: 'SIMULASI KALKULASI REMUNERASI',
      subtitle: `Periode: ${settings.periode} · Total Pendapatan: ${formatRupiah(pendapatan)}`,
    });
    showToast('success', 'Hasil kalkulasi diekspor ke Excel');
  };

  const handleExportPDF = () => {
    exportToPDF('Simulasi_Kalkulasi', 'Simulasi Kalkulasi Remunerasi', exportColumns, exportData, {
      subtitle: `Periode: ${settings.periode} · Total Pendapatan: ${formatRupiah(pendapatan)}`,
      orientation: 'p',
    });
    showToast('success', 'Hasil kalkulasi diekspor ke PDF');
  };

  const SliderInput = ({
    label,
    value,
    onChange,
    color,
    icon: Icon,
    description,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    color: string;
    icon: any;
    description: string;
  }) => (
    <div className="bg-white rounded-2xl p-4 border border-slate-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{label}</p>
            <p className="text-[10px] text-slate-500">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-16 text-right text-lg font-bold text-slate-800 bg-slate-50 px-1 rounded"
          />
          <span className="text-sm text-slate-500">%</span>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
      />
    </div>
  );

  return (
    <div className="p-6 space-y-5 bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Calculator className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Kalkulator Remunerasi</h2>
              <p className="text-amber-50 text-sm max-w-2xl">
                Mesin perhitungan otomatis untuk distribusi pendapatan rumah sakit.
                Sesuaikan persentase pembagian untuk simulasi hasil yang akurat.
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pendapatan */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Total Pendapatan Periode</p>
                <p className="text-xs text-slate-500">Masukkan nilai pendapatan bruto</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
              <input
                type="number"
                value={pendapatan}
                onChange={(e) => setPendapatan(Number(e.target.value))}
                className="w-full pl-14 pr-4 py-3 text-lg font-bold text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {[1000000000, 2500000000, 5000000000, 10000000000].map((val) => (
                <button
                  key={val}
                  onClick={() => setPendapatan(val)}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg transition"
                >
                  {val / 1000000000} Miliar
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-slate-800">Persentase Pembagian</h3>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  valid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {valid ? <Check className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                Total: {totalPersentase}%
              </div>
            </div>
            <SliderInput
              label="Beban Operasional"
              description="Pemeliharaan, obat, alat"
              value={bebanOp}
              onChange={setBebanOp}
              color="bg-slate-100 text-slate-700"
              icon={PieChart}
            />
            <SliderInput
              label="Jasa Medis"
              description="Dokter & dokter gigi"
              value={jasaMedis}
              onChange={setJasaMedis}
              color="bg-teal-100 text-teal-700"
              icon={TrendingUp}
            />
            <SliderInput
              label="Jasa Paramedis"
              description="Perawat & bidan"
              value={jasaParamedis}
              onChange={setJasaParamedis}
              color="bg-cyan-100 text-cyan-700"
              icon={TrendingUp}
            />
            <SliderInput
              label="Jasa Penunjang"
              description="Farmasi, lab, radiologi"
              value={jasaPenunjang}
              onChange={setJasaPenunjang}
              color="bg-amber-100 text-amber-700"
              icon={TrendingUp}
            />
            <SliderInput
              label="Bonus Prestasi"
              description="Reward kinerja unit"
              value={bonus}
              onChange={setBonus}
              color="bg-emerald-100 text-emerald-700"
              icon={TrendingUp}
            />
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-rose-800">Pajak PPh 21</p>
                  <p className="text-[10px] text-rose-600">Dipotong dari total jasa</p>
                </div>
                <div className="text-right">
                  <input
                    type="number"
                    value={pajak}
                    onChange={(e) => setPajak(Number(e.target.value))}
                    className="w-14 text-right text-lg font-bold text-rose-800 bg-white px-1 rounded border border-rose-200"
                  />
                  <span className="text-sm text-rose-600">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hasil */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white rounded-2xl p-6 shadow-xl">
            <p className="text-teal-100 text-xs mb-1">TOTAL PENDAPATAN</p>
            <h3 className="text-4xl font-bold mb-4">{formatRupiah(hasil.totalPendapatan)}</h3>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-teal-500/30">
              <div>
                <p className="text-xs text-teal-100">Total Jasa Kotor</p>
                <p className="text-xl font-bold">{formatRupiah(hasil.totalJasaKotor)}</p>
              </div>
              <div>
                <p className="text-xs text-teal-100">Pajak PPh</p>
                <p className="text-xl font-bold text-amber-200">- {formatRupiah(hasil.pajak)}</p>
              </div>
              <div>
                <p className="text-xs text-teal-100">Netto Dibayarkan</p>
                <p className="text-xl font-bold text-emerald-200">{formatRupiah(hasil.netto)}</p>
              </div>
            </div>
          </div>

          {/* Detail breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Rincian Distribusi</h3>
            <div className="space-y-3">
              {[
                { label: 'Beban Operasional', nilai: hasil.totalBeban, persen: bebanOp, color: 'bg-slate-500', textColor: 'text-slate-700' },
                { label: 'Jasa Medis (Dokter)', nilai: hasil.totalJasaMedis, persen: jasaMedis, color: 'bg-teal-500', textColor: 'text-teal-700' },
                { label: 'Jasa Paramedis (Perawat/Bidan)', nilai: hasil.totalJasaParamedis, persen: jasaParamedis, color: 'bg-cyan-500', textColor: 'text-cyan-700' },
                { label: 'Jasa Penunjang', nilai: hasil.totalJasaPenunjang, persen: jasaPenunjang, color: 'bg-amber-500', textColor: 'text-amber-700' },
                { label: 'Bonus Prestasi', nilai: hasil.bonusPrestasi, persen: bonus, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
              ].map((item) => (
                <div key={item.label} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{item.persen}%</span>
                      <span className={`text-sm font-bold ${item.textColor}`}>{formatRupiah(item.nilai)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.persen}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-3">Aksi & Ekspor Hasil</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 text-sm font-semibold transition"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Export Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl hover:bg-rose-100 text-sm font-semibold transition"
              >
                <FileText className="w-5 h-5" />
                Export PDF
              </button>
              <button
                onClick={saveAsDefault}
                disabled={!valid}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl hover:bg-teal-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition"
              >
                <Save className="w-5 h-5" />
                Jadikan Default
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              "Jadikan Default" akan menyimpan konfigurasi persentase ke pengaturan sistem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
