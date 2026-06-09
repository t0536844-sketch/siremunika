// ═══════════════════════════════════════════════════════════
// USER MANAGEMENT & RBAC DATA
// SIM Remunerasi RSUD Mimika
// ═══════════════════════════════════════════════════════════

// ─── Daftar semua permission yang ada di sistem ───────────────
export type PermissionKey =
  // Dashboard
  | 'dashboard.view'
  // Pendapatan
  | 'pendapatan.view' | 'pendapatan.create' | 'pendapatan.edit' | 'pendapatan.delete' | 'pendapatan.export'
  // Jasa Medis
  | 'jasa.view' | 'jasa.create' | 'jasa.edit' | 'jasa.delete' | 'jasa.export'
  // Indexing
  | 'indexing.view' | 'indexing.create' | 'indexing.edit' | 'indexing.delete'
  // Kalkulator
  | 'kalkulasi.view' | 'kalkulasi.simulate' | 'kalkulasi.save_default'
  // Hasil
  | 'hasil.view' | 'hasil.finalize' | 'hasil.export'
  // Approval
  | 'approval.view' | 'approval.approve_unit' | 'approval.approve_keuangan' | 'approval.approve_direksi'
  // Pembayaran
  | 'pembayaran.view' | 'pembayaran.finalize' | 'pembayaran.approve' | 'pembayaran.process' | 'pembayaran.export'
  // Nakes
  | 'nakes.view' | 'nakes.create' | 'nakes.edit' | 'nakes.delete' | 'nakes.export'
  // Laporan
  | 'laporan.view' | 'laporan.generate' | 'laporan.export'
  // Activity Log
  | 'activity.view' | 'activity.export'
  // User Management
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete' | 'users.reset_password' | 'users.manage_roles'
  // Pengaturan
  | 'settings.view' | 'settings.edit';

export interface Permission {
  key: PermissionKey;
  label: string;
  group: string;
  description: string;
}

// ─── Semua permission dengan metadata ─────────────────────────
export const allPermissions: Permission[] = [
  // Dashboard
  { key: 'dashboard.view',              group: 'Dashboard',       label: 'Lihat Dashboard',          description: 'Akses halaman ringkasan utama' },
  // Pendapatan
  { key: 'pendapatan.view',             group: 'Pendapatan',      label: 'Lihat',                    description: 'Melihat data pendapatan' },
  { key: 'pendapatan.create',           group: 'Pendapatan',      label: 'Tambah',                   description: 'Menambah data pendapatan baru' },
  { key: 'pendapatan.edit',             group: 'Pendapatan',      label: 'Edit',                     description: 'Mengubah data pendapatan' },
  { key: 'pendapatan.delete',           group: 'Pendapatan',      label: 'Hapus',                    description: 'Menghapus data pendapatan' },
  { key: 'pendapatan.export',           group: 'Pendapatan',      label: 'Export',                   description: 'Mengekspor data pendapatan' },
  // Jasa Medis
  { key: 'jasa.view',                   group: 'Jasa Medis',      label: 'Lihat',                    description: 'Melihat data jasa medis' },
  { key: 'jasa.create',                 group: 'Jasa Medis',      label: 'Tambah',                   description: 'Menambah data jasa medis' },
  { key: 'jasa.edit',                   group: 'Jasa Medis',      label: 'Edit',                     description: 'Mengubah data jasa medis' },
  { key: 'jasa.delete',                 group: 'Jasa Medis',      label: 'Hapus',                    description: 'Menghapus data jasa medis' },
  { key: 'jasa.export',                 group: 'Jasa Medis',      label: 'Export',                   description: 'Mengekspor data jasa medis' },
  // Indexing
  { key: 'indexing.view',               group: 'Indexing',        label: 'Lihat',                    description: 'Melihat data indexing & bobot' },
  { key: 'indexing.create',             group: 'Indexing',        label: 'Tambah',                   description: 'Menambah index baru' },
  { key: 'indexing.edit',               group: 'Indexing',        label: 'Edit',                     description: 'Mengubah data index' },
  { key: 'indexing.delete',             group: 'Indexing',        label: 'Hapus',                    description: 'Menghapus index' },
  // Kalkulator
  { key: 'kalkulasi.view',              group: 'Kalkulator',      label: 'Lihat',                    description: 'Membuka kalkulator remunerasi' },
  { key: 'kalkulasi.simulate',          group: 'Kalkulator',      label: 'Simulasi',                 description: 'Menjalankan simulasi kalkulasi' },
  { key: 'kalkulasi.save_default',      group: 'Kalkulator',      label: 'Simpan Default',           description: 'Menyimpan konfigurasi sebagai default' },
  // Hasil
  { key: 'hasil.view',                  group: 'Hasil',           label: 'Lihat',                    description: 'Melihat hasil kalkulasi' },
  { key: 'hasil.finalize',              group: 'Hasil',           label: 'Finalisasi',               description: 'Memfinalisasi hasil kalkulasi' },
  { key: 'hasil.export',                group: 'Hasil',           label: 'Export',                   description: 'Mengekspor hasil kalkulasi' },
  // Approval
  { key: 'approval.view',               group: 'Persetujuan',     label: 'Lihat',                    description: 'Melihat daftar pengajuan' },
  { key: 'approval.approve_unit',       group: 'Persetujuan',     label: 'Approve Level Unit',       description: 'Menyetujui di level unit' },
  { key: 'approval.approve_keuangan',   group: 'Persetujuan',     label: 'Approve Level Keuangan',   description: 'Menyetujui di level keuangan' },
  { key: 'approval.approve_direksi',    group: 'Persetujuan',     label: 'Approve Level Direksi',    description: 'Menyetujui di level direksi' },
  // Pembayaran
  { key: 'pembayaran.view',             group: 'Pembayaran',      label: 'Lihat',                    description: 'Melihat data pembayaran' },
  { key: 'pembayaran.finalize',         group: 'Pembayaran',      label: 'Finalisasi',               description: 'Memfinalisasi pembayaran' },
  { key: 'pembayaran.approve',          group: 'Pembayaran',      label: 'Setujui',                  description: 'Menyetujui pembayaran' },
  { key: 'pembayaran.process',          group: 'Pembayaran',      label: 'Proses Transfer',          description: 'Memproses transfer bank' },
  { key: 'pembayaran.export',           group: 'Pembayaran',      label: 'Export',                   description: 'Mengekspor data pembayaran' },
  // Nakes
  { key: 'nakes.view',                  group: 'Profil Nakes',    label: 'Lihat',                    description: 'Melihat profil nakes' },
  { key: 'nakes.create',                group: 'Profil Nakes',    label: 'Tambah',                   description: 'Menambah nakes baru' },
  { key: 'nakes.edit',                  group: 'Profil Nakes',    label: 'Edit',                     description: 'Mengubah profil nakes' },
  { key: 'nakes.delete',                group: 'Profil Nakes',    label: 'Hapus',                    description: 'Menghapus data nakes' },
  { key: 'nakes.export',                group: 'Profil Nakes',    label: 'Export',                   description: 'Mengekspor data nakes' },
  // Laporan
  { key: 'laporan.view',                group: 'Laporan',         label: 'Lihat',                    description: 'Membuka pusat laporan' },
  { key: 'laporan.generate',            group: 'Laporan',         label: 'Generate',                 description: 'Membuat laporan baru' },
  { key: 'laporan.export',              group: 'Laporan',         label: 'Export',                   description: 'Mengunduh laporan' },
  // Activity
  { key: 'activity.view',               group: 'Activity Log',    label: 'Lihat',                    description: 'Melihat log aktivitas' },
  { key: 'activity.export',             group: 'Activity Log',    label: 'Export',                   description: 'Mengekspor activity log' },
  // User Management
  { key: 'users.view',                  group: 'Manajemen User',  label: 'Lihat User',               description: 'Melihat daftar pengguna' },
  { key: 'users.create',                group: 'Manajemen User',  label: 'Tambah User',              description: 'Membuat akun pengguna baru' },
  { key: 'users.edit',                  group: 'Manajemen User',  label: 'Edit User',                description: 'Mengubah data pengguna' },
  { key: 'users.delete',                group: 'Manajemen User',  label: 'Hapus User',               description: 'Menghapus akun pengguna' },
  { key: 'users.reset_password',        group: 'Manajemen User',  label: 'Reset Password',           description: 'Mereset password pengguna' },
  { key: 'users.manage_roles',          group: 'Manajemen User',  label: 'Kelola Role',              description: 'Mengelola role dan permission' },
  // Settings
  { key: 'settings.view',               group: 'Pengaturan',      label: 'Lihat Pengaturan',         description: 'Melihat konfigurasi sistem' },
  { key: 'settings.edit',               group: 'Pengaturan',      label: 'Edit Pengaturan',          description: 'Mengubah konfigurasi sistem' },
];

// ─── Role definitions ──────────────────────────────────────────
export type RoleId = 'superadmin' | 'direktur' | 'kepala_keuangan' | 'admin_keuangan' | 'kepala_unit' | 'operator_unit' | 'verifikator' | 'viewer';

export interface Role {
  id: RoleId;
  nama: string;
  deskripsi: string;
  warna: string;         // tailwind color class
  warnaText: string;
  warnaBg: string;
  warnaBorder: string;
  permissions: PermissionKey[];
  isSystem: boolean;     // tidak bisa dihapus
  createdAt: string;
  userCount?: number;
}

const ALL_PERMS = allPermissions.map((p) => p.key) as PermissionKey[];

export const defaultRoles: Role[] = [
  {
    id: 'superadmin',
    nama: 'Super Administrator',
    deskripsi: 'Akses penuh ke seluruh fitur dan konfigurasi sistem tanpa batasan',
    warna: 'violet', warnaText: 'text-violet-700', warnaBg: 'bg-violet-100', warnaBorder: 'border-violet-200',
    permissions: ALL_PERMS,
    isSystem: true,
    createdAt: '2024-01-01',
    userCount: 1,
  },
  {
    id: 'direktur',
    nama: 'Direktur RSUD',
    deskripsi: 'Akses view semua modul, approval level direksi, dan laporan eksekutif',
    warna: 'teal', warnaText: 'text-teal-700', warnaBg: 'bg-teal-100', warnaBorder: 'border-teal-200',
    permissions: [
      'dashboard.view',
      'pendapatan.view', 'pendapatan.export',
      'jasa.view', 'jasa.export',
      'indexing.view',
      'kalkulasi.view', 'kalkulasi.simulate',
      'hasil.view', 'hasil.export',
      'approval.view', 'approval.approve_direksi',
      'pembayaran.view', 'pembayaran.approve', 'pembayaran.export',
      'nakes.view', 'nakes.export',
      'laporan.view', 'laporan.generate', 'laporan.export',
      'activity.view',
      'settings.view',
    ],
    isSystem: true,
    createdAt: '2024-01-01',
    userCount: 1,
  },
  {
    id: 'kepala_keuangan',
    nama: 'Kepala Keuangan',
    deskripsi: 'Mengelola seluruh proses keuangan, persetujuan level keuangan, dan output pembayaran',
    warna: 'blue', warnaText: 'text-blue-700', warnaBg: 'bg-blue-100', warnaBorder: 'border-blue-200',
    permissions: [
      'dashboard.view',
      'pendapatan.view', 'pendapatan.edit', 'pendapatan.export',
      'jasa.view', 'jasa.edit', 'jasa.export',
      'indexing.view', 'indexing.edit',
      'kalkulasi.view', 'kalkulasi.simulate', 'kalkulasi.save_default',
      'hasil.view', 'hasil.finalize', 'hasil.export',
      'approval.view', 'approval.approve_keuangan',
      'pembayaran.view', 'pembayaran.finalize', 'pembayaran.approve', 'pembayaran.export',
      'nakes.view', 'nakes.export',
      'laporan.view', 'laporan.generate', 'laporan.export',
      'activity.view',
      'settings.view',
    ],
    isSystem: true,
    createdAt: '2024-01-01',
    userCount: 2,
  },
  {
    id: 'admin_keuangan',
    nama: 'Admin Keuangan',
    deskripsi: 'Input data keuangan, kalkulasi, dan pemrosesan pembayaran harian',
    warna: 'cyan', warnaText: 'text-cyan-700', warnaBg: 'bg-cyan-100', warnaBorder: 'border-cyan-200',
    permissions: [
      'dashboard.view',
      'pendapatan.view', 'pendapatan.create', 'pendapatan.edit', 'pendapatan.export',
      'jasa.view', 'jasa.create', 'jasa.edit', 'jasa.export',
      'indexing.view',
      'kalkulasi.view', 'kalkulasi.simulate',
      'hasil.view', 'hasil.export',
      'approval.view',
      'pembayaran.view', 'pembayaran.finalize', 'pembayaran.export',
      'nakes.view',
      'laporan.view', 'laporan.generate', 'laporan.export',
      'activity.view',
    ],
    isSystem: false,
    createdAt: '2024-01-01',
    userCount: 4,
  },
  {
    id: 'kepala_unit',
    nama: 'Kepala Unit',
    deskripsi: 'Mengelola data unitnya, approval level unit, dan melihat laporan unit',
    warna: 'amber', warnaText: 'text-amber-700', warnaBg: 'bg-amber-100', warnaBorder: 'border-amber-200',
    permissions: [
      'dashboard.view',
      'pendapatan.view', 'pendapatan.create', 'pendapatan.edit',
      'jasa.view', 'jasa.create', 'jasa.edit',
      'kalkulasi.view',
      'hasil.view',
      'approval.view', 'approval.approve_unit',
      'pembayaran.view',
      'nakes.view',
      'laporan.view', 'laporan.generate',
    ],
    isSystem: false,
    createdAt: '2024-01-01',
    userCount: 12,
  },
  {
    id: 'operator_unit',
    nama: 'Operator Unit',
    deskripsi: 'Input data pendapatan dan jasa medis pada unit masing-masing',
    warna: 'emerald', warnaText: 'text-emerald-700', warnaBg: 'bg-emerald-100', warnaBorder: 'border-emerald-200',
    permissions: [
      'dashboard.view',
      'pendapatan.view', 'pendapatan.create', 'pendapatan.edit',
      'jasa.view', 'jasa.create',
      'nakes.view',
      'laporan.view',
    ],
    isSystem: false,
    createdAt: '2024-01-01',
    userCount: 24,
  },
  {
    id: 'verifikator',
    nama: 'Verifikator',
    deskripsi: 'Memverifikasi data jasa medis dan menyetujui di level yang ditentukan',
    warna: 'rose', warnaText: 'text-rose-700', warnaBg: 'bg-rose-100', warnaBorder: 'border-rose-200',
    permissions: [
      'dashboard.view',
      'pendapatan.view',
      'jasa.view', 'jasa.edit',
      'hasil.view',
      'approval.view', 'approval.approve_unit', 'approval.approve_keuangan',
      'pembayaran.view',
      'nakes.view',
      'laporan.view',
    ],
    isSystem: false,
    createdAt: '2024-01-01',
    userCount: 6,
  },
  {
    id: 'viewer',
    nama: 'Viewer (Read Only)',
    deskripsi: 'Hanya dapat melihat data tanpa bisa mengubah apapun',
    warna: 'slate', warnaText: 'text-slate-600', warnaBg: 'bg-slate-100', warnaBorder: 'border-slate-200',
    permissions: [
      'dashboard.view',
      'pendapatan.view',
      'jasa.view',
      'indexing.view',
      'kalkulasi.view',
      'hasil.view',
      'approval.view',
      'pembayaran.view',
      'nakes.view',
      'laporan.view',
    ],
    isSystem: false,
    createdAt: '2024-01-01',
    userCount: 8,
  },
];

// ─── User accounts ─────────────────────────────────────────────
export type UserStatus = 'aktif' | 'nonaktif' | 'suspend';

export interface UserAccount {
  id: string;
  nama: string;
  username: string;
  email: string;
  noHp: string;
  roleId: RoleId;
  unit: string;
  jabatan: string;
  avatar: string;           // inisial 2 huruf
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
  createdBy: string;
  twoFactorEnabled: boolean;
  loginCount: number;
  passwordChangedAt: string;
  isOnline: boolean;
}

export const defaultUsers: UserAccount[] = [
  {
    id: 'USR-001', nama: 'Administrator Sistem', username: 'superadmin',
    email: 'superadmin@rsudmimika.go.id', noHp: '0811-0000-0001',
    roleId: 'superadmin', unit: 'IT & Sistem Informasi', jabatan: 'System Administrator',
    avatar: 'AS', status: 'aktif', lastLogin: '2026-01-15 14:30:00', createdAt: '2024-01-01',
    createdBy: 'System', twoFactorEnabled: true, loginCount: 1482, passwordChangedAt: '2026-01-01',
    isOnline: true,
  },
  {
    id: 'USR-002', nama: 'dr. Hendra Kusuma', username: 'direktur.hendra',
    email: 'direktur@rsudmimika.go.id', noHp: '0812-1111-0002',
    roleId: 'direktur', unit: 'Direksi', jabatan: 'Direktur RSUD Mimika',
    avatar: 'HK', status: 'aktif', lastLogin: '2026-01-15 09:15:00', createdAt: '2024-01-01',
    createdBy: 'USR-001', twoFactorEnabled: true, loginCount: 892, passwordChangedAt: '2025-12-01',
    isOnline: false,
  },
  {
    id: 'USR-003', nama: 'Drs. Bambang Sutrisno, M.M.', username: 'kabag.keuangan',
    email: 'keuangan@rsudmimika.go.id', noHp: '0813-2222-0003',
    roleId: 'kepala_keuangan', unit: 'Bagian Keuangan', jabatan: 'Kepala Bagian Keuangan',
    avatar: 'BS', status: 'aktif', lastLogin: '2026-01-15 13:45:00', createdAt: '2024-01-02',
    createdBy: 'USR-001', twoFactorEnabled: true, loginCount: 1124, passwordChangedAt: '2026-01-01',
    isOnline: true,
  },
  {
    id: 'USR-004', nama: 'Sri Wahyuni, S.E.', username: 'admin.keuangan1',
    email: 'sri.wahyuni@rsudmimika.go.id', noHp: '0814-3333-0004',
    roleId: 'admin_keuangan', unit: 'Bagian Keuangan', jabatan: 'Staff Keuangan Senior',
    avatar: 'SW', status: 'aktif', lastLogin: '2026-01-15 14:20:00', createdAt: '2024-01-03',
    createdBy: 'USR-003', twoFactorEnabled: false, loginCount: 876, passwordChangedAt: '2025-11-15',
    isOnline: true,
  },
  {
    id: 'USR-005', nama: 'Rudi Santoso, A.Md.', username: 'admin.keuangan2',
    email: 'rudi.santoso@rsudmimika.go.id', noHp: '0815-4444-0005',
    roleId: 'admin_keuangan', unit: 'Bagian Keuangan', jabatan: 'Staff Keuangan',
    avatar: 'RS', status: 'aktif', lastLogin: '2026-01-14 16:30:00', createdAt: '2024-02-01',
    createdBy: 'USR-003', twoFactorEnabled: false, loginCount: 654, passwordChangedAt: '2025-10-01',
    isOnline: false,
  },
  {
    id: 'USR-006', nama: 'dr. Andi Putra, Sp.PD', username: 'kabag.poli_dalam',
    email: 'andi.putra@rsudmimika.go.id', noHp: '0816-5555-0006',
    roleId: 'kepala_unit', unit: 'Poli Penyakit Dalam', jabatan: 'Kepala Poli Penyakit Dalam',
    avatar: 'AP', status: 'aktif', lastLogin: '2026-01-15 11:00:00', createdAt: '2024-01-10',
    createdBy: 'USR-003', twoFactorEnabled: false, loginCount: 432, passwordChangedAt: '2025-09-01',
    isOnline: true,
  },
  {
    id: 'USR-007', nama: 'dr. Siti Nurhaliza, Sp.A', username: 'kabag.poli_anak',
    email: 'siti.nurhaliza@rsudmimika.go.id', noHp: '0817-6666-0007',
    roleId: 'kepala_unit', unit: 'Poli Anak', jabatan: 'Kepala Poli Anak',
    avatar: 'SN', status: 'aktif', lastLogin: '2026-01-13 10:30:00', createdAt: '2024-01-10',
    createdBy: 'USR-003', twoFactorEnabled: false, loginCount: 318, passwordChangedAt: '2025-08-01',
    isOnline: false,
  },
  {
    id: 'USR-008', nama: 'Dewi Sartika, A.Md.', username: 'operator.lab',
    email: 'dewi.sartika@rsudmimika.go.id', noHp: '0818-7777-0008',
    roleId: 'operator_unit', unit: 'Laboratorium', jabatan: 'Analis Kesehatan',
    avatar: 'DS', status: 'aktif', lastLogin: '2026-01-15 08:00:00', createdAt: '2024-03-01',
    createdBy: 'USR-006', twoFactorEnabled: false, loginCount: 521, passwordChangedAt: '2025-07-01',
    isOnline: true,
  },
  {
    id: 'USR-009', nama: 'Rudi Hartono, A.Md.Rad', username: 'operator.radiologi',
    email: 'rudi.hartono@rsudmimika.go.id', noHp: '0819-8888-0009',
    roleId: 'operator_unit', unit: 'Radiologi', jabatan: 'Radiografer',
    avatar: 'RH', status: 'aktif', lastLogin: '2026-01-14 17:00:00', createdAt: '2024-03-01',
    createdBy: 'USR-006', twoFactorEnabled: false, loginCount: 410, passwordChangedAt: '2025-06-01',
    isOnline: false,
  },
  {
    id: 'USR-010', nama: 'Mega Pratiwi, S.E.', username: 'verifikator.1',
    email: 'mega.pratiwi@rsudmimika.go.id', noHp: '0821-9999-0010',
    roleId: 'verifikator', unit: 'Bagian Keuangan', jabatan: 'Verifikator Keuangan',
    avatar: 'MP', status: 'aktif', lastLogin: '2026-01-15 12:00:00', createdAt: '2024-04-01',
    createdBy: 'USR-003', twoFactorEnabled: false, loginCount: 287, passwordChangedAt: '2025-12-15',
    isOnline: true,
  },
  {
    id: 'USR-011', nama: 'Agus Salim, S.Kom.', username: 'viewer.audit',
    email: 'agus.salim@rsudmimika.go.id', noHp: '0822-0000-0011',
    roleId: 'viewer', unit: 'Inspektorat', jabatan: 'Auditor Internal',
    avatar: 'AG', status: 'aktif', lastLogin: '2026-01-10 09:00:00', createdAt: '2024-05-01',
    createdBy: 'USR-001', twoFactorEnabled: false, loginCount: 145, passwordChangedAt: '2025-05-01',
    isOnline: false,
  },
  {
    id: 'USR-012', nama: 'Yuli Astuti, S.E.', username: 'admin.keuangan3',
    email: 'yuli.astuti@rsudmimika.go.id', noHp: '0823-1111-0012',
    roleId: 'admin_keuangan', unit: 'Bagian Keuangan', jabatan: 'Staff Keuangan',
    avatar: 'YA', status: 'nonaktif', lastLogin: '2025-12-01 10:00:00', createdAt: '2024-06-01',
    createdBy: 'USR-003', twoFactorEnabled: false, loginCount: 203, passwordChangedAt: '2025-06-01',
    isOnline: false,
  },
  {
    id: 'USR-013', nama: 'Budi Santoso', username: 'operator.igd',
    email: 'budi.santoso@rsudmimika.go.id', noHp: '0824-2222-0013',
    roleId: 'operator_unit', unit: 'IGD', jabatan: 'Perawat IGD',
    avatar: 'BU', status: 'suspend', lastLogin: '2025-11-15 08:00:00', createdAt: '2024-07-01',
    createdBy: 'USR-006', twoFactorEnabled: false, loginCount: 89, passwordChangedAt: '2024-07-01',
    isOnline: false,
  },
];

// ─── Permission groups untuk tampilan ─────────────────────────
export const permissionGroups = Array.from(
  new Set(allPermissions.map((p) => p.group))
);
