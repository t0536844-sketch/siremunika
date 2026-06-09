// Mock data untuk SIM Remunerasi RSUD Mimika

export interface Pendapatan {
  id: string;
  tanggal: string;
  unit: string;
  jenisPelayanan: string;
  jumlahPasien: number;
  nilaiPendapatan: number;
  status: 'pending' | 'approved' | 'rejected';
  operator: string;
}

export interface JasaMedis {
  id: string;
  periode: string;
  nakes: string;
  jabatan: string;
  unit: string;
  tarifJasa: number;
  jumlahTindakan: number;
  totalJasa: number;
  status: 'pending' | 'verified' | 'paid';
}

export interface Indexing {
  id: string;
  kodeIndex: string;
  namaIndex: string;
  bobot: number;
  kategori: string;
  keterangan: string;
  aktif: boolean;
}

export interface HasilKalkulasi {
  id: string;
  periode: string;
  unit: string;
  totalPendapatan: number;
  totalBeban: number;
  totalJasaMedis: number;
  totalJasaParamedis: number;
  totalJasaPenunjang: number;
  bonusPrestasi: number;
  pajak: number;
  netto: number;
  status: 'draft' | 'final' | 'approved';
}

export interface ApprovalItem {
  id: string;
  tipe: 'pendapatan' | 'jasa' | 'hasil';
  referensi: string;
  nilai: number;
  pengaju: string;
  tanggalPengajuan: string;
  status: 'pending' | 'approved' | 'rejected';
  catatan: string;
  level: 'Unit' | 'Keuangan' | 'Direksi';
}

export const dashboardStats = {
  totalPendapatanBulanIni: 4850000000,
  totalJasaDibayarkan: 1680000000,
  jumlahNakesAktif: 342,
  persentaseApproval: 87,
  pertumbuhanPendapatan: 12.5,
  jumlahTransaksi: 15847,
};

export const dataPendapatan: Pendapatan[] = [
  { id: 'PEN-2026-0001', tanggal: '2026-01-15', unit: 'Poli Umum', jenisPelayanan: 'Rawat Jalan', jumlahPasien: 245, nilaiPendapatan: 125000000, status: 'approved', operator: 'dr. Andi Putra' },
  { id: 'PEN-2026-0002', tanggal: '2026-01-15', unit: 'IGD', jenisPelayanan: 'Gawat Darurat', jumlahPasien: 89, nilaiPendapatan: 210000000, status: 'approved', operator: 'dr. Siti Nurhaliza' },
  { id: 'PEN-2026-0003', tanggal: '2026-01-15', unit: 'Poli Bedah', jenisPelayanan: 'Rawat Jalan', jumlahPasien: 67, nilaiPendapatan: 185000000, status: 'pending', operator: 'dr. Budiono' },
  { id: 'PEN-2026-0004', tanggal: '2026-01-15', unit: 'Poli Gigi', jenisPelayanan: 'Rawat Jalan', jumlahPasien: 78, nilaiPendapatan: 95000000, status: 'pending', operator: 'drg. Maya' },
  { id: 'PEN-2026-0005', tanggal: '2026-01-15', unit: 'Kamar Bersalin', jenisPelayanan: 'Rawat Inap', jumlahPasien: 23, nilaiPendapatan: 310000000, status: 'approved', operator: 'dr. Devi' },
  { id: 'PEN-2026-0006', tanggal: '2026-01-15', unit: 'Laboratorium', jenisPelayanan: 'Penunjang', jumlahPasien: 412, nilaiPendapatan: 178000000, status: 'approved', operator: 'Dewi Sartika' },
  { id: 'PEN-2026-0007', tanggal: '2026-01-15', unit: 'Radiologi', jenisPelayanan: 'Penunjang', jumlahPasien: 156, nilaiPendapatan: 245000000, status: 'pending', operator: 'Rudi Hartono' },
  { id: 'PEN-2026-0008', tanggal: '2026-01-15', unit: 'Farmasi', jenisPelayanan: 'Penunjang', jumlahPasien: 892, nilaiPendapatan: 425000000, status: 'approved', operator: 'Apt. Sari Dewi' },
];

export const dataJasa: JasaMedis[] = [
  { id: 'JASA-2026-0001', periode: 'Januari 2026', nakes: 'dr. Andi Putra', jabatan: 'Dokter Umum', unit: 'Poli Umum', tarifJasa: 250000, jumlahTindakan: 245, totalJasa: 61250000, status: 'verified' },
  { id: 'JASA-2026-0002', periode: 'Januari 2026', nakes: 'dr. Siti Nurhaliza', jabatan: 'Dokter Spesialis', unit: 'IGD', tarifJasa: 450000, jumlahTindakan: 89, totalJasa: 40050000, status: 'verified' },
  { id: 'JASA-2026-0003', periode: 'Januari 2026', nakes: 'Ns. Rina Marlina', jabatan: 'Perawat', unit: 'Kamar Perawatan', tarifJasa: 75000, jumlahTindakan: 560, totalJasa: 42000000, status: 'pending' },
  { id: 'JASA-2026-0004', periode: 'Januari 2026', nakes: 'dr. Budiono', jabatan: 'Dokter Spesialis Bedah', unit: 'Poli Bedah', tarifJasa: 850000, jumlahTindakan: 45, totalJasa: 38250000, status: 'paid' },
  { id: 'JASA-2026-0005', periode: 'Januari 2026', nakes: 'drg. Maya', jabatan: 'Dokter Gigi', unit: 'Poli Gigi', tarifJasa: 350000, jumlahTindakan: 78, totalJasa: 27300000, status: 'pending' },
  { id: 'JASA-2026-0006', periode: 'Januari 2026', nakes: 'Apt. Sari Dewi', jabatan: 'Apoteker', unit: 'Farmasi', tarifJasa: 95000, jumlahTindakan: 892, totalJasa: 84740000, status: 'verified' },
  { id: 'JASA-2026-0007', periode: 'Januari 2026', nakes: 'Dewi Sartika', jabatan: 'Analis Lab', unit: 'Laboratorium', tarifJasa: 55000, jumlahTindakan: 412, totalJasa: 22660000, status: 'paid' },
  { id: 'JASA-2026-0008', periode: 'Januari 2026', nakes: 'Rudi Hartono', jabatan: 'Radiografer', unit: 'Radiologi', tarifJasa: 65000, jumlahTindakan: 156, totalJasa: 10140000, status: 'verified' },
];

export const dataIndexing: Indexing[] = [
  { id: 'IDX-001', kodeIndex: 'IDX-A-001', namaIndex: 'Dokter Spesialis Konsultan', bobot: 1.75, kategori: 'Jabatan', keterangan: 'Dokter dengan gelar konsultan spesialis', aktif: true },
  { id: 'IDX-002', kodeIndex: 'IDX-A-002', namaIndex: 'Dokter Spesialis', bobot: 1.50, kategori: 'Jabatan', keterangan: 'Dokter spesialis umum', aktif: true },
  { id: 'IDX-003', kodeIndex: 'IDX-A-003', namaIndex: 'Dokter Umum', bobot: 1.25, kategori: 'Jabatan', keterangan: 'Dokter umum praktek', aktif: true },
  { id: 'IDX-004', kodeIndex: 'IDX-A-004', namaIndex: 'Dokter Gigi', bobot: 1.20, kategori: 'Jabatan', keterangan: 'Dokter gigi spesialis', aktif: true },
  { id: 'IDX-005', kodeIndex: 'IDX-B-001', namaIndex: 'Perawat Ahli Madya', bobot: 1.00, kategori: 'Perawat', keterangan: 'Ners dengan STR aktif', aktif: true },
  { id: 'IDX-006', kodeIndex: 'IDX-B-002', namaIndex: 'Perawat Pratama', bobot: 0.85, kategori: 'Perawat', keterangan: 'Perawat D3', aktif: true },
  { id: 'IDX-007', kodeIndex: 'IDX-C-001', namaIndex: 'Apoteker', bobot: 1.10, kategori: 'Penunjang', keterangan: 'S1 Farmasi + STR Apoteker', aktif: true },
  { id: 'IDX-008', kodeIndex: 'IDX-C-002', namaIndex: 'Analis Kesehatan', bobot: 0.90, kategori: 'Penunjang', keterangan: 'D3 Analis Kesehatan', aktif: true },
  { id: 'IDX-009', kodeIndex: 'IDX-D-001', namaIndex: 'Tingkat Kesulitan Tinggi', bobot: 1.50, kategori: 'Tindakan', keterangan: 'Tindakan bedah besar', aktif: true },
  { id: 'IDX-010', kodeIndex: 'IDX-D-002', namaIndex: 'Tingkat Kesulitan Sedang', bobot: 1.20, kategori: 'Tindakan', keterangan: 'Tindakan menengah', aktif: true },
  { id: 'IDX-011', kodeIndex: 'IDX-E-001', namaIndex: 'Bonus Prestasi Unit', bobot: 0.15, kategori: 'Bonus', keterangan: 'Bonus 15% dari target unit', aktif: true },
  { id: 'IDX-012', kodeIndex: 'IDX-F-001', namaIndex: 'Pajak PPh 21', bobot: 0.05, kategori: 'Potongan', keterangan: 'Pajak penghasilan 5%', aktif: true },
];

export const dataHasil: HasilKalkulasi[] = [
  { id: 'HSL-2026-001', periode: 'Januari 2026', unit: 'Poli Umum', totalPendapatan: 2450000000, totalBeban: 980000000, totalJasaMedis: 735000000, totalJasaParamedis: 367500000, totalJasaPenunjang: 220500000, bonusPrestasi: 147000000, pajak: 73500000, netto: 1396500000, status: 'approved' },
  { id: 'HSL-2026-002', periode: 'Januari 2026', unit: 'IGD', totalPendapatan: 3120000000, totalBeban: 1248000000, totalJasaMedis: 936000000, totalJasaParamedis: 468000000, totalJasaPenunjang: 280800000, bonusPrestasi: 187200000, pajak: 93600000, netto: 1778400000, status: 'final' },
  { id: 'HSL-2026-003', periode: 'Januari 2026', unit: 'Poli Bedah', totalPendapatan: 2890000000, totalBeban: 1156000000, totalJasaMedis: 867000000, totalJasaParamedis: 433500000, totalJasaPenunjang: 260100000, bonusPrestasi: 173400000, pajak: 86700000, netto: 1647300000, status: 'final' },
  { id: 'HSL-2026-004', periode: 'Januari 2026', unit: 'Kebidanan', totalPendapatan: 1980000000, totalBeban: 792000000, totalJasaMedis: 594000000, totalJasaParamedis: 297000000, totalJasaPenunjang: 178200000, bonusPrestasi: 118800000, pajak: 59400000, netto: 1128600000, status: 'approved' },
  { id: 'HSL-2026-005', periode: 'Januari 2026', unit: 'Penunjang Medis', totalPendapatan: 4500000000, totalBeban: 1800000000, totalJasaMedis: 1350000000, totalJasaParamedis: 675000000, totalJasaPenunjang: 405000000, bonusPrestasi: 270000000, pajak: 135000000, netto: 2565000000, status: 'draft' },
];

export const dataApproval: ApprovalItem[] = [
  { id: 'APR-2026-0001', tipe: 'pendapatan', referensi: 'PEN-2026-0003', nilai: 185000000, pengaju: 'dr. Budiono', tanggalPengajuan: '2026-01-15', status: 'pending', catatan: 'Menunggu verifikasi data pasien', level: 'Unit' },
  { id: 'APR-2026-0002', tipe: 'pendapatan', referensi: 'PEN-2026-0004', nilai: 95000000, pengaju: 'drg. Maya', tanggalPengajuan: '2026-01-15', status: 'pending', catatan: 'Data input lengkap, siap diverifikasi', level: 'Unit' },
  { id: 'APR-2026-0003', tipe: 'jasa', referensi: 'JASA-2026-0003', nilai: 42000000, pengaju: 'Ns. Rina Marlina', tanggalPengajuan: '2026-01-14', status: 'pending', catatan: 'Menunggu approval keuangan', level: 'Keuangan' },
  { id: 'APR-2026-0004', tipe: 'jasa', referensi: 'JASA-2026-0005', nilai: 27300000, pengaju: 'drg. Maya', tanggalPengajuan: '2026-01-14', status: 'pending', catatan: 'Perlu dicek ulang jumlah tindakan', level: 'Keuangan' },
  { id: 'APR-2026-0005', tipe: 'hasil', referensi: 'HSL-2026-005', nilai: 2565000000, pengaju: 'Kepala Bagian Penunjang', tanggalPengajuan: '2026-01-13', status: 'pending', catatan: 'Finalisasi laporan periode Januari', level: 'Direksi' },
  { id: 'APR-2026-0006', tipe: 'hasil', referensi: 'HSL-2026-003', nilai: 1647300000, pengaju: 'Kepala Poli Bedah', tanggalPengajuan: '2026-01-12', status: 'pending', catatan: 'Menunggu tanda tangan direktur', level: 'Direksi' },
];

export const chartTrend = [
  { bulan: 'Jul', pendapatan: 3200000000, jasa: 1120000000 },
  { bulan: 'Agt', pendapatan: 3650000000, jasa: 1280000000 },
  { bulan: 'Sep', pendapatan: 3980000000, jasa: 1390000000 },
  { bulan: 'Okt', pendapatan: 4120000000, jasa: 1440000000 },
  { bulan: 'Nov', pendapatan: 4480000000, jasa: 1570000000 },
  { bulan: 'Des', pendapatan: 4750000000, jasa: 1660000000 },
  { bulan: 'Jan', pendapatan: 4850000000, jasa: 1680000000 },
];

export const chartUnit = [
  { unit: 'Poli Umum', nilai: 2450 },
  { unit: 'IGD', nilai: 3120 },
  { unit: 'Poli Bedah', nilai: 2890 },
  { unit: 'Kebidanan', nilai: 1980 },
  { unit: 'Penunjang', nilai: 4500 },
];

export const chartKomposisi = [
  { name: 'Jasa Medis', value: 30 },
  { name: 'Jasa Paramedis', value: 15 },
  { name: 'Jasa Penunjang', value: 9 },
  { name: 'Bonus Prestasi', value: 6 },
  { name: 'Beban Operasional', value: 40 },
];

export const daftarUnit = [
  'Poli Umum', 'IGD', 'Poli Bedah', 'Poli Gigi', 'Poli Anak',
  'Poli Penyakit Dalam', 'Kamar Bersalin', 'Kamar Perawatan',
  'Laboratorium', 'Radiologi', 'Farmasi', 'Rehabilitasi Medis'
];

export const daftarJabatan = [
  'Dokter Spesialis Konsultan', 'Dokter Spesialis', 'Dokter Umum',
  'Dokter Gigi', 'Perawat Ahli Madya', 'Perawat Pratama',
  'Bidan', 'Apoteker', 'Analis Kesehatan', 'Radiografer',
  'Fisioterapis', 'Administrasi Medis'
];

// ========== DATA NAKES LENGKAP ==========
export interface Nakes {
  id: string;
  nip: string;
  nama: string;
  jabatan: string;
  unit: string;
  noStr: string;
  noSip: string;
  tanggalLahir: string;
  tanggalMasuk: string;
  pendidikan: string;
  noHp: string;
  email: string;
  statusAktif: boolean;
  jasaPerTindakan: number;
  totalTindakan: number;
  totalJasa: number;
  rating: number;
}

export const dataNakes: Nakes[] = [
  { id: 'NKS-001', nip: '198501012010011001', nama: 'dr. Andi Putra, Sp.PD', jabatan: 'Dokter Spesialis', unit: 'Poli Penyakit Dalam', noStr: 'STR-001/2024', noSip: 'SIP-001/2024/RSUD', tanggalLahir: '1985-01-15', tanggalMasuk: '2010-01-01', pendidikan: 'Spesialis Penyakit Dalam', noHp: '0812-3456-7890', email: 'andi.putra@rsudmimika.go.id', statusAktif: true, jasaPerTindakan: 450000, totalTindakan: 340, totalJasa: 153000000, rating: 4.8 },
  { id: 'NKS-002', nip: '198203122008041002', nama: 'dr. Siti Nurhaliza, Sp.A', jabatan: 'Dokter Spesialis', unit: 'Poli Anak', noStr: 'STR-002/2024', noSip: 'SIP-002/2024/RSUD', tanggalLahir: '1982-03-12', tanggalMasuk: '2008-04-01', pendidikan: 'Spesialis Anak', noHp: '0813-9876-5432', email: 'siti.nurhaliza@rsudmimika.go.id', statusAktif: true, jasaPerTindakan: 500000, totalTindakan: 285, totalJasa: 142500000, rating: 4.9 },
  { id: 'NKS-003', nip: '199005052015031003', nama: 'Ns. Rina Marlina, S.Kep', jabatan: 'Perawat Ahli Madya', unit: 'Kamar Perawatan', noStr: 'STR-003/2024', noSip: '-', tanggalLahir: '1990-05-05', tanggalMasuk: '2015-03-01', pendidikan: 'S1 Keperawatan', noHp: '0852-1111-2222', email: 'rina.marlina@rsudmimika.go.id', statusAktif: true, jasaPerTindakan: 75000, totalTindakan: 890, totalJasa: 66750000, rating: 4.7 },
  { id: 'NKS-004', nip: '198811202012071004', nama: 'dr. Budiono, Sp.B', jabatan: 'Dokter Spesialis Bedah', unit: 'Poli Bedah', noStr: 'STR-004/2024', noSip: 'SIP-004/2024/RSUD', tanggalLahir: '1988-11-20', tanggalMasuk: '2012-07-01', pendidikan: 'Spesialis Bedah Umum', noHp: '0811-2222-3333', email: 'budiono@rsudmimika.go.id', statusAktif: true, jasaPerTindakan: 850000, totalTindakan: 145, totalJasa: 123250000, rating: 4.6 },
  { id: 'NKS-005', nip: '199207152018012005', nama: 'drg. Maya Safitri', jabatan: 'Dokter Gigi', unit: 'Poli Gigi', noStr: 'STR-005/2024', noSip: 'SIP-005/2024/RSUD', tanggalLahir: '1992-07-15', tanggalMasuk: '2018-01-01', pendidikan: 'Dokter Gigi Umum', noHp: '0812-5555-6666', email: 'maya.safitri@rsudmimika.go.id', statusAktif: true, jasaPerTindakan: 350000, totalTindakan: 210, totalJasa: 73500000, rating: 4.8 },
  { id: 'NKS-006', nip: '198509252011052006', nama: 'Apt. Sari Dewi, S.Farm', jabatan: 'Apoteker', unit: 'Farmasi', noStr: 'STR-006/2024', noSip: 'SIPA-006/2024', tanggalLahir: '1985-09-25', tanggalMasuk: '2011-05-01', pendidikan: 'S1 Farmasi', noHp: '0856-7777-8888', email: 'sari.dewi@rsudmimika.go.id', statusAktif: true, jasaPerTindakan: 95000, totalTindakan: 1245, totalJasa: 118275000, rating: 4.5 },
  { id: 'NKS-007', nip: '199503082020052007', nama: 'Dewi Sartika, A.Md.Analis', jabatan: 'Analis Kesehatan', unit: 'Laboratorium', noStr: 'STR-007/2024', noSip: '-', tanggalLahir: '1995-03-08', tanggalMasuk: '2020-05-01', pendidikan: 'D3 Analis Kesehatan', noHp: '0898-1111-2222', email: 'dewi.sartika@rsudmimika.go.id', statusAktif: true, jasaPerTindakan: 55000, totalTindakan: 950, totalJasa: 52250000, rating: 4.4 },
  { id: 'NKS-008', nip: '198912172014081008', nama: 'Rudi Hartono, A.Md.Rad', jabatan: 'Radiografer', unit: 'Radiologi', noStr: 'STR-008/2024', noSip: '-', tanggalLahir: '1989-12-17', tanggalMasuk: '2014-08-01', pendidikan: 'D3 Radiodiagnostik', noHp: '0821-3333-4444', email: 'rudi.hartono@rsudmimika.go.id', statusAktif: true, jasaPerTindakan: 65000, totalTindakan: 480, totalJasa: 31200000, rating: 4.3 },
  { id: 'NKS-009', nip: '197504182002031009', nama: 'dr. Bambang Wijaya, Sp.KJ', jabatan: 'Dokter Spesialis Konsultan', unit: 'Poli Umum', noStr: 'STR-009/2024', noSip: 'SIP-009/2024/RSUD', tanggalLahir: '1975-04-18', tanggalMasuk: '2002-03-01', pendidikan: 'Konsultan Jiwa', noHp: '0815-9999-0000', email: 'bambang.wijaya@rsudmimika.go.id', statusAktif: true, jasaPerTindakan: 1200000, totalTindakan: 95, totalJasa: 114000000, rating: 5.0 },
  { id: 'NKS-010', nip: '199101222019102010', nama: 'Bidan Yulianti, A.Md.Keb', jabatan: 'Bidan', unit: 'Kamar Bersalin', noStr: 'STR-010/2024', noSip: '-', tanggalLahir: '1991-01-22', tanggalMasuk: '2019-10-01', pendidikan: 'D3 Kebidanan', noHp: '0831-2222-0000', email: 'yulianti@rsudmimika.go.id', statusAktif: false, jasaPerTindakan: 85000, totalTindakan: 320, totalJasa: 27200000, rating: 4.6 },
];

// ========== ACTIVITY LOG ==========
export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  detail: string;
  module: string;
  icon: string;
}

export const dataActivityLog: ActivityLog[] = [
  { id: 'LOG-001', timestamp: '2026-01-15 14:32:15', user: 'Admin Keuangan', action: 'Menyetujui', target: 'PEN-2026-0001', detail: 'Pendapatan Poli Umum disetujui', module: 'Pendapatan', icon: 'check' },
  { id: 'LOG-002', timestamp: '2026-01-15 14:15:08', user: 'dr. Budiono', action: 'Menambahkan', target: 'PEN-2026-0003', detail: 'Input pendapatan Poli Bedah Rp 185.000.000', module: 'Pendapatan', icon: 'plus' },
  { id: 'LOG-003', timestamp: '2026-01-15 13:58:41', user: 'Admin Keuangan', action: 'Mengekspor', target: 'Jasa_Medis.xlsx', detail: 'Export data jasa medis periode Januari', module: 'Jasa Medis', icon: 'download' },
  { id: 'LOG-004', timestamp: '2026-01-15 12:30:22', user: 'drg. Maya', action: 'Mengedit', target: 'JASA-2026-0005', detail: 'Update jumlah tindakan dari 75 menjadi 78', module: 'Jasa Medis', icon: 'edit' },
  { id: 'LOG-005', timestamp: '2026-01-15 11:45:10', user: 'Kepala Keuangan', action: 'Menyetujui', target: 'HSL-2026-001', detail: 'Hasil kalkulasi Poli Umum disetujui', module: 'Hasil', icon: 'check' },
  { id: 'LOG-006', timestamp: '2026-01-15 10:20:55', user: 'Admin Sistem', action: 'Memperbarui', target: 'IDX-A-003', detail: 'Update bobot Dokter Umum dari 1.20 menjadi 1.25', module: 'Indexing', icon: 'edit' },
  { id: 'LOG-007', timestamp: '2026-01-15 09:45:33', user: 'Direktur RSUD', action: 'Login', target: '-', detail: 'Direktur masuk ke sistem', module: 'Sistem', icon: 'login' },
  { id: 'LOG-008', timestamp: '2026-01-14 17:12:44', user: 'Admin Keuangan', action: 'Menghapus', target: 'JASA-2026-0010', detail: 'Menghapus data jasa medis duplikat', module: 'Jasa Medis', icon: 'trash' },
  { id: 'LOG-009', timestamp: '2026-01-14 16:05:18', user: 'Kepala Unit IGD', action: 'Mengajukan', target: 'APR-2026-0002', detail: 'Pengajuan approval pendapatan IGD', module: 'Approval', icon: 'clock' },
  { id: 'LOG-010', timestamp: '2026-01-14 14:30:02', user: 'Admin Sistem', action: 'Mengubah', target: 'Pengaturan', detail: 'Update persentase pajak PPh dari 5% menjadi 5.5%', module: 'Sistem', icon: 'settings' },
];

// ========== LAPORAN ==========
export interface LaporanItem {
  id: string;
  nama: string;
  deskripsi: string;
  kategori: 'Keuangan' | 'SDM' | 'Operasional' | 'Analitik';
  frekuensi: 'Harian' | 'Bulanan' | 'Triwulan' | 'Tahunan';
  ukuran: string;
  terakhir_dibuat: string;
  total_baris: number;
}

// ========== DATA PEMBAYARAN ==========
export interface Pembayaran {
  id: string;
  periode: string;
  nakesId: string;
  nakesNama: string;
  nip: string;
  jabatan: string;
  unit: string;
  noRekening: string;
  bank: string;
  jasaMedis: number;
  jasaParamedis: number;
  jasaPenunjang: number;
  bonusPrestasi: number;
  totalJasaKotor: number;
  pajakPPh: number;
  iuranBPJS: number;
  potonganLain: number;
  totalPotongan: number;
  nettoDibayar: number;
  status: 'draft' | 'final' | 'disetujui' | 'dibayar' | 'dibatalkan';
  tanggalFinalisasi?: string;
  tanggalPersetujuan?: string;
  tanggalPembayaran?: string;
  noBukti?: string;
  catatan?: string;
}

export const dataPembayaran: Pembayaran[] = [
  { id: 'BAY-2026-0001', periode: 'Januari 2026', nakesId: 'NKS-001', nakesNama: 'dr. Andi Putra, Sp.PD', nip: '198501012010011001', jabatan: 'Dokter Spesialis', unit: 'Poli Penyakit Dalam', noRekening: '1234567890', bank: 'BRI', jasaMedis: 135000000, jasaParamedis: 0, jasaPenunjang: 0, bonusPrestasi: 13500000, totalJasaKotor: 148500000, pajakPPh: 7425000, iuranBPJS: 1500000, potonganLain: 0, totalPotongan: 8925000, nettoDibayar: 139575000, status: 'dibayar', tanggalFinalisasi: '2026-01-25', tanggalPersetujuan: '2026-01-27', tanggalPembayaran: '2026-01-30', noBukti: 'TRF/2026/01/001', catatan: 'Pembayaran periode Januari 2026' },
  { id: 'BAY-2026-0002', periode: 'Januari 2026', nakesId: 'NKS-002', nakesNama: 'dr. Siti Nurhaliza, Sp.A', nip: '198203122008041002', jabatan: 'Dokter Spesialis', unit: 'Poli Anak', noRekening: '2345678901', bank: 'Mandiri', jasaMedis: 127500000, jasaParamedis: 0, jasaPenunjang: 0, bonusPrestasi: 12750000, totalJasaKotor: 140250000, pajakPPh: 7012500, iuranBPJS: 1500000, potonganLain: 0, totalPotongan: 8512500, nettoDibayar: 131737500, status: 'dibayar', tanggalFinalisasi: '2026-01-25', tanggalPersetujuan: '2026-01-27', tanggalPembayaran: '2026-01-30', noBukti: 'TRF/2026/01/002' },
  { id: 'BAY-2026-0003', periode: 'Januari 2026', nakesId: 'NKS-003', nakesNama: 'Ns. Rina Marlina, S.Kep', nip: '199005052015031003', jabatan: 'Perawat Ahli Madya', unit: 'Kamar Perawatan', noRekening: '3456789012', bank: 'BRI', jasaMedis: 0, jasaParamedis: 60000000, jasaPenunjang: 0, bonusPrestasi: 6000000, totalJasaKotor: 66000000, pajakPPh: 3300000, iuranBPJS: 750000, potonganLain: 0, totalPotongan: 4050000, nettoDibayar: 61950000, status: 'dibayar', tanggalFinalisasi: '2026-01-25', tanggalPersetujuan: '2026-01-27', tanggalPembayaran: '2026-01-30', noBukti: 'TRF/2026/01/003' },
  { id: 'BAY-2026-0004', periode: 'Januari 2026', nakesId: 'NKS-004', nakesNama: 'dr. Budiono, Sp.B', nip: '198811202012071004', jabatan: 'Dokter Spesialis Bedah', unit: 'Poli Bedah', noRekening: '4567890123', bank: 'BNI', jasaMedis: 110000000, jasaParamedis: 0, jasaPenunjang: 0, bonusPrestasi: 11000000, totalJasaKotor: 121000000, pajakPPh: 6050000, iuranBPJS: 1500000, potonganLain: 0, totalPotongan: 7550000, nettoDibayar: 113450000, status: 'disetujui', tanggalFinalisasi: '2026-01-25', tanggalPersetujuan: '2026-01-28' },
  { id: 'BAY-2026-0005', periode: 'Januari 2026', nakesId: 'NKS-005', nakesNama: 'drg. Maya Safitri', nip: '199207152018012005', jabatan: 'Dokter Gigi', unit: 'Poli Gigi', noRekening: '5678901234', bank: 'BRI', jasaMedis: 65000000, jasaParamedis: 0, jasaPenunjang: 0, bonusPrestasi: 6500000, totalJasaKotor: 71500000, pajakPPh: 3575000, iuranBPJS: 1500000, potonganLain: 0, totalPotongan: 5075000, nettoDibayar: 66425000, status: 'final', tanggalFinalisasi: '2026-01-26' },
  { id: 'BAY-2026-0006', periode: 'Januari 2026', nakesId: 'NKS-006', nakesNama: 'Apt. Sari Dewi, S.Farm', nip: '198509252011052006', jabatan: 'Apoteker', unit: 'Farmasi', noRekening: '6789012345', bank: 'Mandiri', jasaMedis: 0, jasaParamedis: 0, jasaPenunjang: 105000000, bonusPrestasi: 10500000, totalJasaKotor: 115500000, pajakPPh: 5775000, iuranBPJS: 1500000, potonganLain: 0, totalPotongan: 7275000, nettoDibayar: 108225000, status: 'final', tanggalFinalisasi: '2026-01-26' },
  { id: 'BAY-2026-0007', periode: 'Januari 2026', nakesId: 'NKS-007', nakesNama: 'Dewi Sartika, A.Md.Analis', nip: '199503082020052007', jabatan: 'Analis Kesehatan', unit: 'Laboratorium', noRekening: '7890123456', bank: 'BRI', jasaMedis: 0, jasaParamedis: 0, jasaPenunjang: 47000000, bonusPrestasi: 4700000, totalJasaKotor: 51700000, pajakPPh: 2585000, iuranBPJS: 750000, potonganLain: 0, totalPotongan: 3335000, nettoDibayar: 48365000, status: 'disetujui', tanggalFinalisasi: '2026-01-26', tanggalPersetujuan: '2026-01-28' },
  { id: 'BAY-2026-0008', periode: 'Januari 2026', nakesId: 'NKS-008', nakesNama: 'Rudi Hartono, A.Md.Rad', nip: '198912172014081008', jabatan: 'Radiografer', unit: 'Radiologi', noRekening: '8901234567', bank: 'BNI', jasaMedis: 0, jasaParamedis: 0, jasaPenunjang: 28000000, bonusPrestasi: 2800000, totalJasaKotor: 30800000, pajakPPh: 1540000, iuranBPJS: 750000, potonganLain: 0, totalPotongan: 2290000, nettoDibayar: 28510000, status: 'draft' },
  { id: 'BAY-2026-0009', periode: 'Januari 2026', nakesId: 'NKS-009', nakesNama: 'dr. Bambang Wijaya, Sp.KJ', nip: '197504182002031009', jabatan: 'Dokter Spesialis Konsultan', unit: 'Poli Umum', noRekening: '9012345678', bank: 'BRI', jasaMedis: 102000000, jasaParamedis: 0, jasaPenunjang: 0, bonusPrestasi: 10200000, totalJasaKotor: 112200000, pajakPPh: 5610000, iuranBPJS: 1500000, potonganLain: 500000, totalPotongan: 7610000, nettoDibayar: 104590000, status: 'dibayar', tanggalFinalisasi: '2026-01-25', tanggalPersetujuan: '2026-01-27', tanggalPembayaran: '2026-01-30', noBukti: 'TRF/2026/01/004' },
  { id: 'BAY-2026-0010', periode: 'Januari 2026', nakesId: 'NKS-010', nakesNama: 'Bidan Yulianti, A.Md.Keb', nip: '199101222019102010', jabatan: 'Bidan', unit: 'Kamar Bersalin', noRekening: '0123456789', bank: 'Mandiri', jasaMedis: 0, jasaParamedis: 24500000, jasaPenunjang: 0, bonusPrestasi: 2450000, totalJasaKotor: 26950000, pajakPPh: 1347500, iuranBPJS: 750000, potonganLain: 0, totalPotongan: 2097500, nettoDibayar: 24852500, status: 'dibatalkan', catatan: 'Nakes nonaktif per 15 Januari 2026' },
];

export const dataLaporan: LaporanItem[] = [
  { id: 'LAP-001', nama: 'Laporan Pendapatan Harian', deskripsi: 'Rekap pendapatan per unit layanan harian', kategori: 'Keuangan', frekuensi: 'Harian', ukuran: '2.4 MB', terakhir_dibuat: '2026-01-15', total_baris: 1847 },
  { id: 'LAP-002', nama: 'Laporan Jasa Medis Bulanan', deskripsi: 'Distribusi jasa medis, paramedis, penunjang', kategori: 'Keuangan', frekuensi: 'Bulanan', ukuran: '5.1 MB', terakhir_dibuat: '2026-01-10', total_baris: 342 },
  { id: 'LAP-003', nama: 'Rekapitulasi Nakes', deskripsi: 'Daftar tenaga kesehatan dan kinerja', kategori: 'SDM', frekuensi: 'Bulanan', ukuran: '1.8 MB', terakhir_dibuat: '2026-01-12', total_baris: 342 },
  { id: 'LAP-004', nama: 'Analisis Profitabilitas Unit', deskripsi: 'Analisa pendapatan vs beban per unit', kategori: 'Analitik', frekuensi: 'Triwulan', ukuran: '8.3 MB', terakhir_dibuat: '2026-01-05', total_baris: 12 },
  { id: 'LAP-005', nama: 'Laporan Transaksi Pasien', deskripsi: 'Jumlah pasien dan transaksi per poli', kategori: 'Operasional', frekuensi: 'Bulanan', ukuran: '3.6 MB', terakhir_dibuat: '2026-01-15', total_baris: 15847 },
  { id: 'LAP-006', nama: 'Indexing & Bobot', deskripsi: 'Master data skala remunerasi', kategori: 'SDM', frekuensi: 'Tahunan', ukuran: '0.4 MB', terakhir_dibuat: '2026-01-01', total_baris: 12 },
  { id: 'LAP-007', nama: 'Log Aktivitas Sistem', deskripsi: 'Catatan lengkap aktivitas pengguna', kategori: 'Operasional', frekuensi: 'Harian', ukuran: '12.5 MB', terakhir_dibuat: '2026-01-15', total_baris: 2481 },
  { id: 'LAP-008', nama: 'Laporan Pajak PPh 21', deskripsi: 'Rekap pajak penghasilan tenaga medis', kategori: 'Keuangan', frekuensi: 'Bulanan', ukuran: '2.1 MB', terakhir_dibuat: '2026-01-10', total_baris: 342 },
  { id: 'LAP-009', nama: 'Slip Pembayaran Gaji', deskripsi: 'Slip gaji individual per tenaga kesehatan', kategori: 'Keuangan', frekuensi: 'Bulanan', ukuran: '3.4 MB', terakhir_dibuat: '2026-01-30', total_baris: 342 },
  { id: 'LAP-010', nama: 'Rekap Pembayaran Remunerasi', deskripsi: 'Total pembayaran per unit dan jabatan', kategori: 'Keuangan', frekuensi: 'Bulanan', ukuran: '4.2 MB', terakhir_dibuat: '2026-01-30', total_baris: 58 },
  { id: 'LAP-011', nama: 'File Batch Transfer Bank', deskripsi: 'File transfer massal untuk bank', kategori: 'Keuangan', frekuensi: 'Bulanan', ukuran: '1.8 MB', terakhir_dibuat: '2026-01-30', total_baris: 342 },
];
