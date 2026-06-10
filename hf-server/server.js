const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 7860;
const DB_PATH = path.join(__dirname, 'data', 'siremunika.db');
let db, SQL;

// ── Helper functions ────────────────────────────────────────────
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length ? rows[0] : null;
}

function queryRun(sql, params = []) {
  try { db.run(sql, params); return true; }
  catch (e) { console.error('SQL run error:', e.message); return false; }
}

function saveDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ── Initialize database ─────────────────────────────────────────
function initDatabase() {
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('Loaded existing database from file');
  } else {
    db = new SQL.Database();
    seedData();
    saveDb();
    console.log('Created new database with seed data');
  }
}

function seedData() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pendapatan (
      id TEXT PRIMARY KEY, tanggal TEXT, unit TEXT, jenisPelayanan TEXT,
      jumlahPasien INTEGER, nilaiPendapatan REAL, status TEXT DEFAULT 'pending', operator TEXT
    );
    CREATE TABLE IF NOT EXISTS jasa_medis (
      id TEXT PRIMARY KEY, periode TEXT, nakes TEXT, jabatan TEXT, unit TEXT,
      tarifJasa REAL, jumlahTindakan INTEGER, totalJasa REAL, status TEXT DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS indexing (
      id TEXT PRIMARY KEY, kodeIndex TEXT, namaIndex TEXT, bobot REAL,
      kategori TEXT, keterangan TEXT, aktif INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS hasil_kalkulasi (
      id TEXT PRIMARY KEY, periode TEXT, unit TEXT, totalPendapatan REAL,
      totalBeban REAL, totalJasaMedis REAL, totalJasaParamedis REAL, totalJasaPenunjang REAL,
      bonusPrestasi REAL, pajak REAL, netto REAL, status TEXT DEFAULT 'draft'
    );
    CREATE TABLE IF NOT EXISTS approval (
      id TEXT PRIMARY KEY, tipe TEXT, referensi TEXT, nilai REAL, pengaju TEXT,
      tanggalPengajuan TEXT, status TEXT DEFAULT 'pending', catatan TEXT, level TEXT
    );
    CREATE TABLE IF NOT EXISTS nakes (
      id TEXT PRIMARY KEY, nip TEXT, nama TEXT, jabatan TEXT, unit TEXT,
      noStr TEXT, noSip TEXT, tanggalLahir TEXT, tanggalMasuk TEXT, pendidikan TEXT,
      noHp TEXT, email TEXT, statusAktif INTEGER DEFAULT 1,
      jasaPerTindakan REAL, totalTindakan INTEGER, totalJasa REAL, rating REAL
    );
    CREATE TABLE IF NOT EXISTS pembayaran (
      id TEXT PRIMARY KEY, periode TEXT, nakesId TEXT, nakesNama TEXT, nip TEXT,
      jabatan TEXT, unit TEXT, noRekening TEXT, bank TEXT,
      jasaMedis REAL, jasaParamedis REAL, jasaPenunjang REAL, bonusPrestasi REAL,
      totalJasaKotor REAL, pajakPPh REAL, iuranBPJS REAL, potonganLain REAL,
      totalPotongan REAL, nettoDibayar REAL, status TEXT DEFAULT 'draft',
      tanggalFinalisasi TEXT, tanggalPersetujuan TEXT, tanggalPembayaran TEXT, noBukti TEXT, catatan TEXT
    );
  `);

  // Seed pendapatan
  const pendapatanSeed = [
    ['PEN-2026-0001','2026-01-15','Poli Umum','Rawat Jalan',245,125000000,'approved','dr. Andi Putra'],
    ['PEN-2026-0002','2026-01-15','IGD','Gawat Darurat',89,210000000,'approved','dr. Siti Nurhaliza'],
    ['PEN-2026-0003','2026-01-15','Poli Bedah','Rawat Jalan',67,185000000,'pending','dr. Budiono'],
    ['PEN-2026-0004','2026-01-15','Poli Gigi','Rawat Jalan',78,95000000,'pending','drg. Maya'],
    ['PEN-2026-0005','2026-01-15','Kamar Bersalin','Rawat Inap',23,310000000,'approved','dr. Devi'],
    ['PEN-2026-0006','2026-01-15','Laboratorium','Penunjang',412,178000000,'approved','Dewi Sartika'],
    ['PEN-2026-0007','2026-01-15','Radiologi','Penunjang',156,245000000,'pending','Rudi Hartono'],
    ['PEN-2026-0008','2026-01-15','Farmasi','Penunjang',892,425000000,'approved','Apt. Sari Dewi'],
  ];
  for (const r of pendapatanSeed) db.run('INSERT INTO pendapatan VALUES (?,?,?,?,?,?,?,?)', r);

  // Seed jasa_medis
  const jasaSeed = [
    ['JASA-2026-0001','Januari 2026','dr. Andi Putra','Dokter Umum','Poli Umum',250000,245,61250000,'verified'],
    ['JASA-2026-0002','Januari 2026','dr. Siti Nurhaliza','Dokter Spesialis','IGD',450000,89,40050000,'verified'],
    ['JASA-2026-0003','Januari 2026','Ns. Rina Marlina','Perawat','Kamar Perawatan',75000,560,42000000,'pending'],
    ['JASA-2026-0004','Januari 2026','dr. Budiono','Dokter Spesialis Bedah','Poli Bedah',850000,45,38250000,'paid'],
    ['JASA-2026-0005','Januari 2026','drg. Maya','Dokter Gigi','Poli Gigi',350000,78,27300000,'pending'],
    ['JASA-2026-0006','Januari 2026','Apt. Sari Dewi','Apoteker','Farmasi',95000,892,84740000,'verified'],
    ['JASA-2026-0007','Januari 2026','Dewi Sartika','Analis Lab','Laboratorium',55000,412,22660000,'paid'],
    ['JASA-2026-0008','Januari 2026','Rudi Hartono','Radiografer','Radiologi',65000,156,10140000,'verified'],
  ];
  for (const r of jasaSeed) db.run('INSERT INTO jasa_medis VALUES (?,?,?,?,?,?,?,?,?)', r);

  // Seed indexing
  const idxSeed = [
    ['IDX-001','IDX-A-001','Dokter Spesialis Konsultan',1.75,'Jabatan','Dokter dengan gelar konsultan spesialis',1],
    ['IDX-002','IDX-A-002','Dokter Spesialis',1.50,'Jabatan','Dokter spesialis umum',1],
    ['IDX-003','IDX-A-003','Dokter Umum',1.25,'Jabatan','Dokter umum praktek',1],
    ['IDX-004','IDX-A-004','Dokter Gigi',1.20,'Jabatan','Dokter gigi spesialis',1],
    ['IDX-005','IDX-B-001','Perawat Ahli Madya',1.00,'Perawat','Ners dengan STR aktif',1],
    ['IDX-006','IDX-B-002','Perawat Pratama',0.85,'Perawat','Perawat D3',1],
    ['IDX-007','IDX-C-001','Apoteker',1.10,'Penunjang','S1 Farmasi + STR Apoteker',1],
    ['IDX-008','IDX-C-002','Analis Kesehatan',0.90,'Penunjang','D3 Analis Kesehatan',1],
    ['IDX-009','IDX-D-001','Tingkat Kesulitan Tinggi',1.50,'Tindakan','Tindakan bedah besar',1],
    ['IDX-010','IDX-D-002','Tingkat Kesulitan Sedang',1.20,'Tindakan','Tindakan menengah',1],
    ['IDX-011','IDX-E-001','Bonus Prestasi Unit',0.15,'Bonus','Bonus 15% dari target unit',1],
    ['IDX-012','IDX-F-001','Pajak PPh 21',0.05,'Potongan','Pajak penghasilan 5%',1],
  ];
  for (const r of idxSeed) db.run('INSERT INTO indexing VALUES (?,?,?,?,?,?,?)', r);

  // Seed hasil_kalkulasi
  const hasilSeed = [
    ['HSL-2026-001','Januari 2026','Poli Umum',2450000000,980000000,735000000,367500000,220500000,147000000,73500000,1396500000,'approved'],
    ['HSL-2026-002','Januari 2026','IGD',3120000000,1248000000,936000000,468000000,280800000,187200000,93600000,1778400000,'final'],
    ['HSL-2026-003','Januari 2026','Poli Bedah',2890000000,1156000000,867000000,433500000,260100000,173400000,86700000,1647300000,'final'],
    ['HSL-2026-004','Januari 2026','Kebidanan',1980000000,792000000,594000000,297000000,178200000,118800000,59400000,1128600000,'approved'],
    ['HSL-2026-005','Januari 2026','Penunjang Medis',4500000000,1800000000,1350000000,675000000,405000000,270000000,135000000,2565000000,'draft'],
  ];
  for (const r of hasilSeed) db.run('INSERT INTO hasil_kalkulasi VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', r);

  // Seed approval
  const aprSeed = [
    ['APR-2026-0001','pendapatan','PEN-2026-0003',185000000,'dr. Budiono','2026-01-15','pending','Menunggu verifikasi data pasien','Unit'],
    ['APR-2026-0002','pendapatan','PEN-2026-0004',95000000,'drg. Maya','2026-01-15','pending','Data input lengkap, siap diverifikasi','Unit'],
    ['APR-2026-0003','jasa','JASA-2026-0003',42000000,'Ns. Rina Marlina','2026-01-14','pending','Menunggu approval keuangan','Keuangan'],
    ['APR-2026-0004','jasa','JASA-2026-0005',27300000,'drg. Maya','2026-01-14','pending','Perlu dicek ulang jumlah tindakan','Keuangan'],
    ['APR-2026-0005','hasil','HSL-2026-005',2565000000,'Kepala Bagian Penunjang','2026-01-13','pending','Finalisasi laporan periode Januari','Direksi'],
    ['APR-2026-0006','hasil','HSL-2026-003',1647300000,'Kepala Poli Bedah','2026-01-12','pending','Menunggu tanda tangan direktur','Direksi'],
  ];
  for (const r of aprSeed) db.run('INSERT INTO approval VALUES (?,?,?,?,?,?,?,?,?)', r);

  // Seed nakes
  const nakesSeed = [
    ['NKS-001','198501012010011001','dr. Andi Putra, Sp.PD','Dokter Spesialis','Poli Penyakit Dalam','STR-001/2024','SIP-001/2024/RSUD','1985-01-15','2010-01-01','Spesialis Penyakit Dalam','0812-3456-7890','andi.putra@rsudmimika.go.id',1,450000,340,153000000,4.8],
    ['NKS-002','198203122008041002','dr. Siti Nurhaliza, Sp.A','Dokter Spesialis','Poli Anak','STR-002/2024','SIP-002/2024/RSUD','1982-03-12','2008-04-01','Spesialis Anak','0813-9876-5432','siti.nurhaliza@rsudmimika.go.id',1,500000,285,142500000,4.9],
    ['NKS-003','199005052015031003','Ns. Rina Marlina, S.Kep','Perawat Ahli Madya','Kamar Perawatan','STR-003/2024','-','1990-05-05','2015-03-01','S1 Keperawatan','0852-1111-2222','rina.marlina@rsudmimika.go.id',1,75000,890,66750000,4.7],
    ['NKS-004','198811202012071004','dr. Budiono, Sp.B','Dokter Spesialis Bedah','Poli Bedah','STR-004/2024','SIP-004/2024/RSUD','1988-11-20','2012-07-01','Spesialis Bedah Umum','0811-2222-3333','budiono@rsudmimika.go.id',1,850000,145,123250000,4.6],
    ['NKS-005','199207152018012005','drg. Maya Safitri','Dokter Gigi','Poli Gigi','STR-005/2024','SIP-005/2024/RSUD','1992-07-15','2018-01-01','Dokter Gigi Umum','0812-5555-6666','maya.safitri@rsudmimika.go.id',1,350000,210,73500000,4.8],
    ['NKS-006','198509252011052006','Apt. Sari Dewi, S.Farm','Apoteker','Farmasi','STR-006/2024','SIPA-006/2024','1985-09-25','2011-05-01','S1 Farmasi','0856-7777-8888','sari.dewi@rsudmimika.go.id',1,95000,1245,118275000,4.5],
    ['NKS-007','199503082020052007','Dewi Sartika, A.Md.Analis','Analis Kesehatan','Laboratorium','STR-007/2024','-','1995-03-08','2020-05-01','D3 Analis Kesehatan','0898-1111-2222','dewi.sartika@rsudmimika.go.id',1,55000,950,52250000,4.4],
    ['NKS-008','198912172014081008','Rudi Hartono, A.Md.Rad','Radiografer','Radiologi','STR-008/2024','-','1989-12-17','2014-08-01','D3 Radiodiagnostik','0821-3333-4444','rudi.hartono@rsudmimika.go.id',1,65000,480,31200000,4.3],
    ['NKS-009','197504182002031009','dr. Bambang Wijaya, Sp.KJ','Dokter Spesialis Konsultan','Poli Umum','STR-009/2024','SIP-009/2024/RSUD','1975-04-18','2002-03-01','Konsultan Jiwa','0815-9999-0000','bambang.wijaya@rsudmimika.go.id',1,1200000,95,114000000,5.0],
    ['NKS-010','199101222019102010','Bidan Yulianti, A.Md.Keb','Bidan','Kamar Bersalin','STR-010/2024','-','1991-01-22','2019-10-01','D3 Kebidanan','0831-2222-0000','yulianti@rsudmimika.go.id',0,85000,320,27200000,4.6],
  ];
  for (const r of nakesSeed) db.run('INSERT INTO nakes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', r);

  // Seed pembayaran
  const baySeed = [
    ['BAY-2026-0001','Januari 2026','NKS-001','dr. Andi Putra, Sp.PD','198501012010011001','Dokter Spesialis','Poli Penyakit Dalam','1234567890','BRI',135000000,0,0,13500000,148500000,7425000,1500000,0,8925000,139575000,'dibayar','2026-01-25','2026-01-27','2026-01-30','TRF/2026/01/001','Pembayaran periode Januari 2026'],
    ['BAY-2026-0002','Januari 2026','NKS-002','dr. Siti Nurhaliza, Sp.A','198203122008041002','Dokter Spesialis','Poli Anak','2345678901','Mandiri',127500000,0,0,12750000,140250000,7012500,1500000,0,8512500,131737500,'dibayar','2026-01-25','2026-01-27','2026-01-30','TRF/2026/01/002',null],
    ['BAY-2026-0003','Januari 2026','NKS-003','Ns. Rina Marlina, S.Kep','199005052015031003','Perawat Ahli Madya','Kamar Perawatan','3456789012','BRI',0,60000000,0,6000000,66000000,3300000,750000,0,4050000,61950000,'dibayar','2026-01-25','2026-01-27','2026-01-30','TRF/2026/01/003',null],
    ['BAY-2026-0004','Januari 2026','NKS-004','dr. Budiono, Sp.B','198811202012071004','Dokter Spesialis Bedah','Poli Bedah','4567890123','BNI',110000000,0,0,11000000,121000000,6050000,1500000,0,7550000,113450000,'disetujui','2026-01-25','2026-01-28',null,null,null],
    ['BAY-2026-0005','Januari 2026','NKS-005','drg. Maya Safitri','199207152018012005','Dokter Gigi','Poli Gigi','5678901234','BRI',65000000,0,0,6500000,71500000,3575000,1500000,0,5075000,66425000,'final','2026-01-26',null,null,null,null],
  ];
  for (const r of baySeed) db.run('INSERT INTO pembayaran VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', r);
}

// ── Express app ─────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, database: 'SQLite', server: 'Express on HuggingFace Spaces' });
});

// Stats
app.get('/stats', (_req, res) => {
  const pendapatan = queryAll('SELECT COUNT(*) as count, SUM(nilaiPendapatan) as total FROM pendapatan');
  const jasa = queryAll('SELECT COUNT(*) as count, SUM(totalJasa) as total FROM jasa_medis');
  const nakes = queryAll('SELECT COUNT(*) as total, SUM(CASE WHEN statusAktif=1 THEN 1 ELSE 0 END) as aktif FROM nakes');
  res.json({
    ok: true,
    data: {
      totalPendapatan: pendapatan[0]?.total || 0,
      totalJasa: jasa[0]?.total || 0,
      jumlahNakesAktif: nakes[0]?.aktif || 0,
      jumlahTransaksi: (pendapatan[0]?.count || 0) + (jasa[0]?.count || 0),
    }
  });
});

// Export all data (camelCase keys matching frontend interfaces)
app.get('/api/export', (_req, res) => {
  const data = {
    pendapatan: queryAll('SELECT * FROM pendapatan'),
    jasaMedis: queryAll('SELECT * FROM jasa_medis'),
    refIndexing: queryAll('SELECT id, kodeIndex as kode_index, namaIndex as nama_index, bobot, kategori, keterangan, aktif FROM indexing'),
    hasilKalkulasi: queryAll('SELECT * FROM hasil_kalkulasi'),
    approval: queryAll('SELECT * FROM approval'),
    nakes: queryAll('SELECT id, nip, nama, jabatan, unit, noStr, noSip, tanggalLahir, tanggalMasuk, pendidikan, noHp, email, statusAktif, jasaPerTindakan, totalTindakan, totalJasa, rating FROM nakes'),
    pembayaran: queryAll('SELECT * FROM pembayaran'),
  };
  // Convert aktif (0/1) to boolean
  data.refIndexing = data.refIndexing.map(i => ({ ...i, aktif: !!i.aktif }));
  data.nakes = data.nakes.map(n => ({ ...n, statusAktif: !!n.statusAktif }));
  res.json({ ok: true, data });
});

// ── CRUD: Pendapatan ────────────────────────────────────────────
app.post('/api/pendapatan', (req, res) => {
  const d = req.body;
  if (!d.id) d.id = `PEN-${uuidv4().slice(0,8)}`;
  const existing = queryOne('SELECT id FROM pendapatan WHERE id=?', [d.id]);
  if (existing) {
    queryRun('UPDATE pendapatan SET tanggal=?,unit=?,jenisPelayanan=?,jumlahPasien=?,nilaiPendapatan=?,status=?,operator=? WHERE id=?',
      [d.tanggal, d.unit, d.jenisPelayanan, d.jumlahPasien, d.nilaiPendapatan, d.status||'pending', d.operator, d.id]);
  } else {
    queryRun('INSERT INTO pendapatan VALUES (?,?,?,?,?,?,?,?)',
      [d.id, d.tanggal, d.unit, d.jenisPelayanan, d.jumlahPasien, d.nilaiPendapatan, d.status||'pending', d.operator]);
  }
  saveDb();
  res.json({ ok: true, id: d.id });
});

app.delete('/api/pendapatan/:id', (req, res) => {
  queryRun('DELETE FROM pendapatan WHERE id=?', [req.params.id]);
  saveDb();
  res.json({ ok: true });
});

// ── CRUD: Jasa Medis ────────────────────────────────────────────
app.post('/api/jasa-medis', (req, res) => {
  const d = req.body;
  if (!d.id) d.id = `JASA-${uuidv4().slice(0,8)}`;
  const existing = queryOne('SELECT id FROM jasa_medis WHERE id=?', [d.id]);
  if (existing) {
    queryRun('UPDATE jasa_medis SET periode=?,nakes=?,jabatan=?,unit=?,tarifJasa=?,jumlahTindakan=?,totalJasa=?,status=? WHERE id=?',
      [d.periode, d.nakes, d.jabatan, d.unit, d.tarifJasa, d.jumlahTindakan, d.totalJasa, d.status||'pending', d.id]);
  } else {
    queryRun('INSERT INTO jasa_medis VALUES (?,?,?,?,?,?,?,?,?)',
      [d.id, d.periode, d.nakes, d.jabatan, d.unit, d.tarifJasa, d.jumlahTindakan, d.totalJasa, d.status||'pending']);
  }
  saveDb();
  res.json({ ok: true, id: d.id });
});

app.delete('/api/jasa-medis/:id', (req, res) => {
  queryRun('DELETE FROM jasa_medis WHERE id=?', [req.params.id]);
  saveDb();
  res.json({ ok: true });
});

// ── CRUD: Indexing ──────────────────────────────────────────────
app.post('/api/indexing', (req, res) => {
  const d = req.body;
  if (!d.id) d.id = `IDX-${uuidv4().slice(0,8)}`;
  const aktif = d.aktif ? 1 : 0;
  const existing = queryOne('SELECT id FROM indexing WHERE id=?', [d.id]);
  if (existing) {
    queryRun('UPDATE indexing SET kodeIndex=?,namaIndex=?,bobot=?,kategori=?,keterangan=?,aktif=? WHERE id=?',
      [d.kodeIndex, d.namaIndex, d.bobot, d.kategori, d.keterangan||null, aktif, d.id]);
  } else {
    queryRun('INSERT INTO indexing VALUES (?,?,?,?,?,?,?)',
      [d.id, d.kodeIndex, d.namaIndex, d.bobot, d.kategori, d.keterangan||null, aktif]);
  }
  saveDb();
  res.json({ ok: true, id: d.id });
});

app.delete('/api/indexing/:id', (req, res) => {
  queryRun('DELETE FROM indexing WHERE id=?', [req.params.id]);
  saveDb();
  res.json({ ok: true });
});

// ── CRUD: Approval ──────────────────────────────────────────────
app.post('/api/approval', (req, res) => {
  const d = req.body;
  if (!d.id) return res.status(400).json({ ok: false, error: 'id required' });
  queryRun('UPDATE approval SET status=?,catatan=? WHERE id=?',
    [d.status, d.catatan||null, d.id]);
  saveDb();
  res.json({ ok: true });
});

// ── CRUD: Hasil Kalkulasi ───────────────────────────────────────
app.post('/api/hasil-kalkulasi', (req, res) => {
  const d = req.body;
  if (!d.id) return res.status(400).json({ ok: false, error: 'id required' });
  queryRun('UPDATE hasil_kalkulasi SET status=? WHERE id=?', [d.status, d.id]);
  saveDb();
  res.json({ ok: true });
});

// ── CRUD: Nakes ─────────────────────────────────────────────────
app.post('/api/nakes', (req, res) => {
  const d = req.body;
  if (!d.id) d.id = `NKS-${uuidv4().slice(0,8)}`;
  const aktif = d.statusAktif ? 1 : 0;
  const existing = queryOne('SELECT id FROM nakes WHERE id=?', [d.id]);
  if (existing) {
    queryRun('UPDATE nakes SET nip=?,nama=?,jabatan=?,unit=?,noStr=?,noSip=?,tanggalLahir=?,tanggalMasuk=?,pendidikan=?,noHp=?,email=?,statusAktif=?,jasaPerTindakan=?,totalTindakan=?,totalJasa=?,rating=? WHERE id=?',
      [d.nip||null,d.nama,d.jabatan,d.unit,d.noStr||null,d.noSip||null,d.tanggalLahir||null,d.tanggalMasuk||null,d.pendidikan||null,d.noHp||null,d.email||null,aktif,d.jasaPerTindakan||0,d.totalTindakan||0,d.totalJasa||0,d.rating||0,d.id]);
  } else {
    queryRun('INSERT INTO nakes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [d.id,d.nip||null,d.nama,d.jabatan,d.unit,d.noStr||null,d.noSip||null,d.tanggalLahir||null,d.tanggalMasuk||null,d.pendidikan||null,d.noHp||null,d.email||null,aktif,d.jasaPerTindakan||0,d.totalTindakan||0,d.totalJasa||0,d.rating||0]);
  }
  saveDb();
  res.json({ ok: true, id: d.id });
});

app.delete('/api/nakes/:id', (req, res) => {
  queryRun('DELETE FROM nakes WHERE id=?', [req.params.id]);
  saveDb();
  res.json({ ok: true });
});

app.patch('/api/nakes/:id/toggle-status', (req, res) => {
  const current = queryOne('SELECT statusAktif FROM nakes WHERE id=?', [req.params.id]);
  const newVal = current?.statusAktif ? 0 : 1;
  queryRun('UPDATE nakes SET statusAktif=? WHERE id=?', [newVal, req.params.id]);
  saveDb();
  res.json({ ok: true, statusAktif: !!newVal });
});

// ── CRUD: Pembayaran ────────────────────────────────────────────
app.post('/api/pembayaran', (req, res) => {
  const d = req.body;
  if (!d.id) return res.status(400).json({ ok: false, error: 'id required' });
  queryRun('UPDATE pembayaran SET status=?,tanggalFinalisasi=?,tanggalPersetujuan=?,tanggalPembayaran=?,noBukti=?,catatan=? WHERE id=?',
    [d.status,d.tanggalFinalisasi||null,d.tanggalPersetujuan||null,d.tanggalPembayaran||null,d.noBukti||null,d.catatan||null,d.id]);
  saveDb();
  res.json({ ok: true });
});

// ── Serve static frontend ──────────────────────────────────────
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ── Start server ────────────────────────────────────────────────
async function start() {
  SQL = await initSqlJs();
  initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SIM Remunerasi API + Frontend running on port ${PORT}`);
  });
}
start().catch(e => { console.error('Failed to start:', e); process.exit(1); });