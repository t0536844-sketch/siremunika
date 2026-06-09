import { X, Printer, Download, Building2, CheckCircle2 } from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/helpers';
import { exportToPDF } from '../utils/exporters';
import { useApp } from '../context/AppContext';
import type { Pembayaran } from '../data/mockData';

interface SlipPembayaranProps {
  payment: Pembayaran;
  onClose: () => void;
}

export default function SlipPembayaran({ payment, onClose }: SlipPembayaranProps) {
  const { showToast } = useApp();

  const handlePrint = () => {
    setTimeout(() => window.print(), 200);
  };

  const handleExportPDF = () => {
    const rows = [
      { komponen: 'Jasa Medis', nominal: payment.jasaMedis },
      { komponen: 'Jasa Paramedis', nominal: payment.jasaParamedis },
      { komponen: 'Jasa Penunjang', nominal: payment.jasaPenunjang },
      { komponen: 'Bonus Prestasi', nominal: payment.bonusPrestasi },
      { komponen: 'TOTAL JASA KOTOR', nominal: payment.totalJasaKotor },
      { komponen: '', nominal: 0 },
      { komponen: 'Pajak PPh 21', nominal: -payment.pajakPPh },
      { komponen: 'Iuran BPJS Kesehatan', nominal: -payment.iuranBPJS },
      { komponen: 'Potongan Lain', nominal: -payment.potonganLain },
      { komponen: 'TOTAL POTONGAN', nominal: -payment.totalPotongan },
      { komponen: '', nominal: 0 },
      { komponen: 'NETTO DIBAYAR', nominal: payment.nettoDibayar },
    ].filter((r) => r.nominal !== 0);

    exportToPDF(
      `Slip_Gaji_${payment.nakesNama.replace(/[^a-zA-Z0-9]/g, '_')}`,
      `SLIP PEMBAYARAN REMUNERASI - ${payment.periode.toUpperCase()}`,
      [
        { header: 'Komponen', key: 'komponen', width: 40 },
        { header: 'Nominal', key: 'nominal', format: 'currency' as const, width: 22 },
      ],
      rows,
      {
        subtitle: `${payment.nakesNama} · NIP: ${payment.nip} · ${payment.jabatan} · ${payment.unit}`,
        orientation: 'p',
      }
    );
    showToast('success', 'Slip Pembayaran Exported', 'Slip telah diekspor ke PDF');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header Actions - Print Hidden */}
        <div className="bg-gradient-to-r from-green-700 to-green-800 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div>
            <h3 className="font-bold text-lg">Slip Pembayaran Remunerasi</h3>
            <p className="text-xs text-green-100">Periode: {payment.periode}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              Cetak
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slip Content - Print Optimized */}
        <div className="overflow-y-auto flex-1 bg-white" id="slip-pembayaran">
          <div className="max-w-3xl mx-auto p-8">
            {/* Header with Logo */}
            <div className="border-b-4 border-green-700 pb-4 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">RSUD MIMIKA</h1>
                    <p className="text-xs text-slate-600 mt-0.5">Jl. Cenderawasih No. 1, Tembagapura</p>
                    <p className="text-xs text-slate-600">Kabupaten Mimika, Papua Tengah 99911</p>
                    <p className="text-xs text-slate-600">Telp: (0901) 331-1234 · Email: info@rsudmimika.go.id</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-green-700">SLIP PEMBAYARAN</h2>
                  <p className="text-xs text-slate-600 mt-1">Periode: <strong>{payment.periode}</strong></p>
                  {payment.noBukti && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      No. Bukti: <strong className="font-mono text-green-700">{payment.noBukti}</strong>
                    </p>
                  )}
                  {payment.tanggalPembayaran && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      Tanggal: <strong>{formatDate(payment.tanggalPembayaran)}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Employee Info */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Informasi Penerima</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Nama Lengkap</p>
                  <p className="font-bold text-slate-800">{payment.nakesNama}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">NIP</p>
                  <p className="font-bold text-slate-800 font-mono">{payment.nip}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Jabatan</p>
                  <p className="font-bold text-slate-800">{payment.jabatan}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Unit Kerja</p>
                  <p className="font-bold text-slate-800">{payment.unit}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">No. Rekening</p>
                  <p className="font-bold text-slate-800 font-mono">{payment.noRekening}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Bank</p>
                  <p className="font-bold text-slate-800">{payment.bank}</p>
                </div>
              </div>
            </div>

            {/* Rincian Pendapatan */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-green-600 rounded-full" />
                Rincian Pendapatan
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-green-800 uppercase">Komponen</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-green-800 uppercase">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payment.jasaMedis > 0 && (
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">Jasa Medis</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{formatRupiah(payment.jasaMedis)}</td>
                      </tr>
                    )}
                    {payment.jasaParamedis > 0 && (
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">Jasa Paramedis</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{formatRupiah(payment.jasaParamedis)}</td>
                      </tr>
                    )}
                    {payment.jasaPenunjang > 0 && (
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">Jasa Penunjang</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{formatRupiah(payment.jasaPenunjang)}</td>
                      </tr>
                    )}
                    {payment.bonusPrestasi > 0 && (
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">Bonus Prestasi</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{formatRupiah(payment.bonusPrestasi)}</td>
                      </tr>
                    )}
                    <tr className="bg-green-50 font-bold">
                      <td className="px-4 py-3 text-green-800">TOTAL JASA KOTOR</td>
                      <td className="px-4 py-3 text-right text-green-800">{formatRupiah(payment.totalJasaKotor)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Potongan */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-red-600 rounded-full" />
                Potongan
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-red-800 uppercase">Komponen</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-red-800 uppercase">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-700">Pajak PPh 21</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-red-700">- {formatRupiah(payment.pajakPPh)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-700">Iuran BPJS Kesehatan</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-red-700">- {formatRupiah(payment.iuranBPJS)}</td>
                    </tr>
                    {payment.potonganLain > 0 && (
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">Potongan Lain</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-red-700">- {formatRupiah(payment.potonganLain)}</td>
                      </tr>
                    )}
                    <tr className="bg-red-50 font-bold">
                      <td className="px-4 py-3 text-red-800">TOTAL POTONGAN</td>
                      <td className="px-4 py-3 text-right text-red-800">- {formatRupiah(payment.totalPotongan)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Netto Dibayar */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-6 mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs uppercase font-bold tracking-wider">Netto Dibayar</p>
                  <p className="text-3xl font-bold mt-2 tracking-tight">{formatRupiah(payment.nettoDibayar)}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-xs uppercase font-bold tracking-wider">Status Pembayaran</p>
                  <div className="mt-2 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-bold text-sm">
                      {payment.status === 'dibayar' ? 'TELAH DIBAYAR' : payment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Catatan */}
            {payment.catatan && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-amber-800">
                  <strong>Catatan:</strong> {payment.catatan}
                </p>
              </div>
            )}

            {/* Tanda Tangan */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-200">
              <div className="text-center">
                <p className="text-xs text-slate-600 mb-12">Dibuat oleh,</p>
                <div className="border-t border-slate-400 pt-1">
                  <p className="text-xs font-bold text-slate-800">Staff Keuangan</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-600 mb-12">Disetujui oleh,</p>
                <div className="border-t border-slate-400 pt-1">
                  <p className="text-xs font-bold text-slate-800">Kepala Keuangan</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-600 mb-12">Penerima,</p>
                <div className="border-t border-slate-400 pt-1">
                  <p className="text-xs font-bold text-slate-800">{payment.nakesNama}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center">
              <p className="text-[10px] text-slate-500">
                Dokumen ini dicetak secara otomatis oleh Sistem Informasi Manajemen Remunerasi RSUD Mimika.
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Slip ini sah tanpa tanda tangan dan stempel basah.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions - Print Hidden */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
          >
            Tutup
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Cetak Slip
          </button>
        </div>
      </div>
    </div>
  );
}
