// Format Rupiah
export const formatRupiah = (nilai: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(nilai);
};

export const formatNumber = (nilai: number): string => {
  return new Intl.NumberFormat('id-ID').format(nilai);
};

export const formatDate = (tanggal: string): string => {
  const d = new Date(tanggal);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateShort = (tanggal: string): string => {
  const d = new Date(tanggal);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Kalkulator jasa medis
export interface KalkulasiParams {
  totalPendapatan: number;
  persentaseBebanOperasional: number; // default 40%
  persentaseJasaMedis: number; // default 30%
  persentaseJasaParamedis: number; // default 15%
  persentaseJasaPenunjang: number; // default 9%
  persentaseBonus: number; // default 6%
  persentasePajak: number; // default 5%
}

export const hitungRemunerasi = (params: KalkulasiParams) => {
  const {
    totalPendapatan,
    persentaseBebanOperasional = 40,
    persentaseJasaMedis = 30,
    persentaseJasaParamedis = 15,
    persentaseJasaPenunjang = 9,
    persentaseBonus = 6,
    persentasePajak = 5,
  } = params;

  const totalBeban = (totalPendapatan * persentaseBebanOperasional) / 100;
  const totalJasaMedis = (totalPendapatan * persentaseJasaMedis) / 100;
  const totalJasaParamedis = (totalPendapatan * persentaseJasaParamedis) / 100;
  const totalJasaPenunjang = (totalPendapatan * persentaseJasaPenunjang) / 100;
  const bonusPrestasi = (totalPendapatan * persentaseBonus) / 100;
  const totalJasaKotor = totalJasaMedis + totalJasaParamedis + totalJasaPenunjang + bonusPrestasi;
  const pajak = (totalJasaKotor * persentasePajak) / 100;
  const netto = totalJasaKotor - pajak;

  return {
    totalPendapatan,
    totalBeban,
    totalJasaMedis,
    totalJasaParamedis,
    totalJasaPenunjang,
    bonusPrestasi,
    totalJasaKotor,
    pajak,
    netto,
  };
};

export const hitungJasaPerorangan = (
  totalJasaKategori: number,
  bobotIndex: number,
  totalBobotUnit: number,
  jumlahTindakan: number
) => {
  const bagianPerBobot = totalJasaKategori / totalBobotUnit;
  const jasaDasar = bagianPerBobot * bobotIndex;
  return jasaDasar * jumlahTindakan;
};

export const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  verified: 'bg-sky-100 text-sky-700 border-sky-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  final: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export const statusLabel = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  verified: 'Terverifikasi',
  paid: 'Sudah Dibayar',
  draft: 'Draf',
  final: 'Final',
};
