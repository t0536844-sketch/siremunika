import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Download, FileSpreadsheet, FileText, Eye, Filter, CheckCircle2, FileX, Clock, Printer, Banknote, Zap } from 'lucide-react';
import { dataHasil } from '../data/mockData';
import { formatRupiah, statusColors, statusLabel, hitungJasaPerorangan } from '../utils/helpers';
import type { HasilKalkulasi } from '../data/mockData';
import { exportToExcel, exportToPDF, printPage } from '../utils/exporters';
import { useApp } from '../context/AppContext';
import dataService from '../data/dataService';

const statusHasil = ['Semua', 'draft', 'final', 'approved'] as const;

export default function Hasil() {
  const { showToast, setActivePage } = useApp();
  const [items, setItems] = useState<HasilKalkulasi[]>([]);
  useEffect(() => {
    dataService.getHasilKalkulasi().then((data) => {
      if (data && data.length > 0) setItems(data);
    }).catch(() => { setItems(dataHasil); });
  }, []);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [selected, setSelected] = useState<HasilKalkulasi | null>(null);

  const exportColumns = [
    { header: 'Periode', key: 'periode', width: 16 },
    { header: 'Unit', key: 'unit', width: 22 },
    { header: 'Pendapatan', key: 'totalPendapatan', format: 'currency' as const, width: 22 },
    { header: 'Beban Operasional', key: 'totalBeban', format: 'currency' as const, width: 22 },
    { header: 'Jasa Medis', key: 'totalJasaMedis', format: 'currency' as const, width: 22 },
    { header: 'Jasa Paramedis', key: 'totalJasaParamedis', format: 'currency' as const, width: 22 },
    { header: 'Jasa Penunjang', key: 'totalJasaPenunjang', format: 'currency' as const, width: 22 },
    { header: 'Bonus', key: 'bonusPrestasi', format: 'currency' as const, width: 20 },
    { header: 'Pajak', key: 'pajak', format: 'currency' as const, width: 18 },
    { header: 'Netto', key: 'netto', format: 'currency' as const, width: 22 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  const handleExportExcel = (data: HasilKalkulasi[]) => {
    exportToExcel('Hasil_Kalkulasi', 'Hasil', exportColumns, data, {
      title: 'LAPORAN HASIL KALKULASI REMUNERASI',
      subtitle: `${data.length} unit · Filter: ${filterStatus}`,
    });
    showToast('success', 'Excel berhasil diunduh', `${data.length} unit telah diekspor`);
  };

  const handleExportPDF = (data: HasilKalkulasi[]) => {
    exportToPDF('Hasil_Kalkulasi', 'Laporan Hasil Kalkulasi', exportColumns, data);
    showToast('success', 'PDF berhasil diunduh');
  };

  const handleExportSingle = (item: HasilKalkulasi) => {
    handleExportExcel([item]);
  };

  const handleFinalize = async (id: string) => {
    if (!confirm('Finalisasi hasil ini? Setelah final, data tidak dapat diubah.')) return;
    setItems(items.map((i) => (i.id === id ? { ...i, status: 'final' as const } : i)));
    try {
      await dataService.updateHasilKalkulasi({ id, status: 'final' });
      showToast('success', 'Data difinalisasi', 'Status berubah menjadi final');
    } catch (e) {
      showToast('warning', 'Updated locally only', 'Failed to sync to database');
    }
  };

  const filtered = items.filter((item) => filterStatus === 'Semua' || item.status === filterStatus);

  const totalNetto = filtered.reduce((s, i) => s + (i.netto || 0), 0);
  const totalPendapatan = filtered.reduce((s, i) => s + (i.totalPendapatan || 0), 0);
  const totalJasa = filtered.reduce((s, i) => s + (i.totalJasaMedis || 0) + (i.totalJasaParamedis || 0) + (i.totalJasaPenunjang || 0), 0);

  const chartData = items.map((item) => ({
    unit: (item.unit || '').split(' ').slice(-1).join(' ') || item.unit,
    unitFull: item.unit,
    pendapatan: (item.totalPendapatan || 0) / 1000000,
    jasa: ((item.totalJasaMedis || 0) + (item.totalJasaParamedis || 0) + (item.totalJasaPenunjang || 0)) / 1000000,
    netto: (item.netto || 0) / 1000000,
  }));

  const statusIcon = {
    draft: FileX,
    final: Clock,
    approved: CheckCircle2,
  };

  return (
    <div className="p-6 space-y-5 bg-slate-50">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-emerald-100 text-xs mb-1">Total Netto Dibayarkan</p>
          <p className="text-2xl font-bold">{formatRupiah(totalNetto)}</p>
          <p className="text-xs text-emerald-100 mt-2">{filtered.length} unit</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-slate-500 text-xs mb-1">Total Pendapatan</p>
          <p className="text-2xl font-bold text-slate-800">{formatRupiah(totalPendapatan)}</p>
          <p className="text-xs text-slate-500 mt-2">semua unit</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-slate-500 text-xs mb-1">Total Jasa</p>
          <p className="text-2xl font-bold text-teal-700">{formatRupiah(totalJasa)}</p>
          <p className="text-xs text-slate-500 mt-2">medis + paramedis + penunjang</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <p className="text-slate-500 text-xs mb-1">Unit Terselesaikan</p>
          <p className="text-2xl font-bold text-amber-600">
            {items.filter((i) => i.status === 'approved').length}/{items.length}
          </p>
          <p className="text-xs text-slate-500 mt-2">sudah di-approve direksi</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-1">Komparasi per Unit (dalam juta Rupiah)</h3>
        <p className="text-xs text-slate-500 mb-4">Pendapatan vs distribusi jasa vs netto per unit</p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="unitFull" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              formatter={(value: any) => `${formatRupiah(Number(value) * 1000000)}`}
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="pendapatan" fill="#0f766e" name="Pendapatan" radius={[4, 4, 0, 0]} />
            <Bar dataKey="jasa" fill="#0891b2" name="Total Jasa" radius={[4, 4, 0, 0]} />
            <Bar dataKey="netto" fill="#10b981" name="Netto" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[120px]"
          >
            {statusHasil.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex-1"></div>
        <button
          onClick={() => { showToast('info', 'Menyiapkan halaman cetak...'); setTimeout(() => printPage(), 200); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Printer className="w-4 h-4" />
          Cetak
        </button>
        <button
          onClick={() => handleExportPDF(filtered)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100"
        >
          <FileText className="w-4 h-4" />
          PDF
        </button>
        <button
          onClick={() => handleExportExcel(filtered)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </button>
        <button
          onClick={async () => {
            const unitsToFinalize = filtered.filter((i) => i.status !== 'approved');
            if (unitsToFinalize.length === 0) {
              showToast('info', 'Tidak Ada Unit Baru', 'Semua unit sudah approved atau final.');
              return;
            }
            if (!confirm(`Generate pembayaran untuk ${unitsToFinalize.length} unit? Status akan berubah menjadi final, draft pembayaran akan dibuat, dan approval item akan diajukan.`)) return;

            // Optimistic UI: mark all non-approved units as final locally
            setItems(items.map((i) => (i.status !== 'approved' ? { ...i, status: 'final' as const } : i)));

            try {
              const ts = Date.now();
              let nApproval = 0;
              let nPembayaran = 0;

              // Load all nakes data
              const allNakes = await dataService.getNakes();

              // Step 1: Finalize hasil items & create approval + pembayaran records
              for (const hasil of unitsToFinalize) {
                // Finalize hasil status
                await dataService.updateHasilKalkulasi({ id: hasil.id, status: 'final' });

                // Create approval item for this unit
                const approvalItem = {
                  id: `APR-${ts}-${hasil.id}`,
                  tipe: 'hasil_kalkulasi',
                  referensi: hasil.id,
                  nilai: hasil.netto,
                  pengaju: 'System',
                  tanggalPengajuan: new Date().toISOString().slice(0, 10),
                  status: 'pending',
                  catatan: 'Auto-generated from hasil kalkulasi',
                  level: 'Unit',
                };
                await dataService.updateApproval(approvalItem);
                nApproval++;

                // Get nakes belonging to this unit
                const unitNakes = allNakes.filter((n) => n.unit === hasil.unit && n.statusAktif);

                // Calculate total jasa produksi for the unit
                // totalJasaProduksiUnit = sum of (jasaPerTindakan * totalTindakan) for all nakes in unit
                const totalJasaProduksiUnit = unitNakes.reduce(
                  (sum, n) => sum + (n.jasaPerTindakan || 0) * (n.totalTindakan || 0), 0
                );

                // If no nakes or zero production, skip pembayaran creation for this unit
                if (unitNakes.length === 0 || totalJasaProduksiUnit === 0) continue;

                // Create pembayaran record for each nakes
                for (const nakes of unitNakes) {
                  const nakesProduksi = (nakes.jasaPerTindakan || 0) * (nakes.totalTindakan || 0);
                  const nakesShare = nakesProduksi / totalJasaProduksiUnit;

                  const jasaMedis = Math.round(hitungJasaPerorangan(
                    hasil.totalJasaMedis, nakes.jasaPerTindakan, totalJasaProduksiUnit, nakes.totalTindakan
                  ));
                  const jasaParamedis = Math.round(hitungJasaPerorangan(
                    hasil.totalJasaParamedis, nakes.jasaPerTindakan, totalJasaProduksiUnit, nakes.totalTindakan
                  ));
                  const jasaPenunjang = Math.round(hitungJasaPerorangan(
                    hasil.totalJasaPenunjang, nakes.jasaPerTindakan, totalJasaProduksiUnit, nakes.totalTindakan
                  ));
                  const bonusPrestasi = 0;
                  const totalJasaKotor = jasaMedis + jasaParamedis + jasaPenunjang + bonusPrestasi;
                  const pajakPPh = Math.round(totalJasaKotor * 0.05);
                  const iuranBPJS = 0;
                  const potonganLain = 0;
                  const totalPotongan = pajakPPh + iuranBPJS + potonganLain;
                  const nettoDibayar = totalJasaKotor - totalPotongan;

                  const pembayaran = {
                    id: `BYR-${ts}-${nakes.id}`,
                    periode: hasil.periode,
                    nakesId: nakes.id,
                    nakesNama: nakes.nama,
                    nip: nakes.nip || '',
                    jabatan: nakes.jabatan,
                    unit: nakes.unit,
                    noRekening: '',
                    bank: '',
                    jasaMedis,
                    jasaParamedis,
                    jasaPenunjang,
                    bonusPrestasi,
                    totalJasaKotor,
                    pajakPPh,
                    iuranBPJS,
                    potonganLain,
                    totalPotongan,
                    nettoDibayar,
                    status: 'draft',
                    tanggalFinalisasi: null,
                    tanggalPersetujuan: null,
                    tanggalPembayaran: null,
                    noBukti: null,
                    catatan: '',
                  };
                  await dataService.savePembayaran(pembayaran);
                  nPembayaran++;
                }
              }

              showToast('success', 'Pembayaran & Approval Digenerate', `${nPembayaran} pembayaran draft dan ${nApproval} approval item telah dibuat. Lanjutkan ke halaman Output Pembayaran untuk finalisasi.`);
            } catch (e) {
              showToast('warning', 'Partial Sync Warning', 'Some records failed to sync to database. Check the Pembayaran and Approval pages for completeness.');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg shadow-md"
          title="Generate pembayaran dari hasil kalkulasi"
        >
          <Zap className="w-4 h-4" />
          Generate Pembayaran
        </button>
        <button
          onClick={() => setActivePage('pembayaran')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
          title="Buka halaman Output Pembayaran"
        >
          <Banknote className="w-4 h-4" />
          Lihat Pembayaran
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                <th className="px-5 py-3 text-left font-semibold">Periode</th>
                <th className="px-5 py-3 text-left font-semibold">Unit</th>
                <th className="px-5 py-3 text-right font-semibold">Pendapatan</th>
                <th className="px-5 py-3 text-right font-semibold">Jasa Medis</th>
                <th className="px-5 py-3 text-right font-semibold">Paramedis</th>
                <th className="px-5 py-3 text-right font-semibold">Penunjang</th>
                <th className="px-5 py-3 text-right font-semibold">Bonus</th>
                <th className="px-5 py-3 text-right font-semibold">Netto</th>
                <th className="px-5 py-3 text-center font-semibold">Status</th>
                <th className="px-5 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const Icon = statusIcon[item.status || 'draft'];
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-600 text-xs">{item.periode}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{item.unit}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{formatRupiah(item.totalPendapatan)}</td>
                    <td className="px-5 py-3 text-right text-teal-700 font-medium">{formatRupiah(item.totalJasaMedis)}</td>
                    <td className="px-5 py-3 text-right text-cyan-700 font-medium">{formatRupiah(item.totalJasaParamedis)}</td>
                    <td className="px-5 py-3 text-right text-amber-700 font-medium">{formatRupiah(item.totalJasaPenunjang)}</td>
                    <td className="px-5 py-3 text-right text-emerald-700 font-medium">{formatRupiah(item.bonusPrestasi)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">{formatRupiah(item.netto)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border font-semibold ${statusColors[item.status || 'draft']}`}>
                        <Icon className="w-3 h-3" />
                        {statusLabel[item.status || 'draft']}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelected(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detail
                        </button>
                        <button
                          onClick={() => handleExportSingle(item)}
                          className="p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg"
                          title="Export unit ini ke Excel"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        {item.status === 'draft' && (
                          <button
                            onClick={() => handleFinalize(item.id)}
                            className="p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                            title="Finalisasi"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Detail Kalkulasi {selected.unit}</h3>
                <p className="text-xs text-emerald-100">Periode: {selected.periode} · ID: {selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/80 hover:text-white text-2xl">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                  <p className="text-xs text-teal-700 mb-1">Total Pendapatan</p>
                  <p className="text-lg font-bold text-teal-800">{formatRupiah(selected.totalPendapatan)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Beban Operasional (40%)</p>
                  <p className="text-lg font-bold text-slate-700">{formatRupiah(selected.totalBeban)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <p className="text-xs text-emerald-700 mb-1">Netto Dibayarkan</p>
                  <p className="text-lg font-bold text-emerald-800">{formatRupiah(selected.netto)}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Komponen</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Persentase</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { k: 'Jasa Medis (Dokter)', p: '30%', v: selected.totalJasaMedis, color: 'text-teal-700' },
                      { k: 'Jasa Paramedis (Perawat/Bidan)', p: '15%', v: selected.totalJasaParamedis, color: 'text-cyan-700' },
                      { k: 'Jasa Penunjang', p: '9%', v: selected.totalJasaPenunjang, color: 'text-amber-700' },
                      { k: 'Bonus Prestasi', p: '6%', v: selected.bonusPrestasi, color: 'text-emerald-700' },
                    ].map((r) => (
                      <tr key={r.k} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">{r.k}</td>
                        <td className="px-4 py-2.5 text-right text-slate-500">{r.p}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${r.color}`}>{formatRupiah(r.v)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold">
                      <td className="px-4 py-3">Total Jasa Kotor</td>
                      <td className="px-4 py-3 text-right">60%</td>
                      <td className="px-4 py-3 text-right text-teal-800">
                        {formatRupiah(selected.totalJasaMedis + selected.totalJasaParamedis + selected.totalJasaPenunjang + selected.bonusPrestasi)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-rose-700">Pajak PPh 21 (5%)</td>
                      <td className="px-4 py-2.5 text-right text-rose-500">-5%</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-rose-700">-{formatRupiah(selected.pajak)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                onClick={() => handleExportSingle(selected)}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 inline mr-1" />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
