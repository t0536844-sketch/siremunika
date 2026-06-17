const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 7860;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://npasitielsksoksctqbv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYXNpdGllbHNrc29rc2N0cWJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA1NTAwMSwiZXhwIjoyMDk2NjMxMDAxfQ.yLd9NAEEx6LZprt2sKo-naAAtqkntbWH436v7oRuUhI';

// ── camelCase key transformation ───────────────────────────────
// PostgreSQL normalizes camelCase identifiers to lowercase.
// Supabase PostgREST returns lowercase keys: jenispelayanan, jumlahpasien, etc.
// Frontend TypeScript interfaces expect camelCase: jenisPelayanan, jumlahPasien, etc.
// A generic snake_case→camelCase converter won't work because PostgreSQL merges
// multi-word names into a single lowercase string (e.g. totalJasaMedis → totaljasamedis).
const CAMEL_CASE_MAP = {
  // pendapatan
  jenispelayanan: 'jenisPelayanan',
  jumlahpasien: 'jumlahPasien',
  nilaipendapatan: 'nilaiPendapatan',
  // jasa_medis
  tarifjasa: 'tarifJasa',
  jumlahtindakan: 'jumlahTindakan',
  totaljasa: 'totalJasa',
  // indexing
  kodeindex: 'kodeIndex',
  namaindex: 'namaIndex',
  // hasil_kalkulasi
  totalpendapatan: 'totalPendapatan',
  totalbeban: 'totalBeban',
  totaljasamedis: 'totalJasaMedis',
  totaljasaparamedis: 'totalJasaParamedis',
  totaljasapenunjang: 'totalJasaPenunjang',
  bonusprestasi: 'bonusPrestasi',
  // approval
  tanggalpengajuan: 'tanggalPengajuan',
  // nakes
  nostr: 'noStr',
  nosip: 'noSip',
  tanggallahir: 'tanggalLahir',
  tanggalmasuk: 'tanggalMasuk',
  nohp: 'noHp',
  statusaktif: 'statusAktif',
  jasapertindakan: 'jasaPerTindakan',
  totaltindakan: 'totalTindakan',
  // pembayaran
  nakesid: 'nakesId',
  nakesnama: 'nakesNama',
  norekening: 'noRekening',
  jasamedis: 'jasaMedis',
  jasaparamedis: 'jasaParamedis',
  jasapenunjang: 'jasaPenunjang',
  totaljasakotor: 'totalJasaKotor',
  pajakpph: 'pajakPPh',
  iuranbpjs: 'iuranBPJS',
  potonganlain: 'potonganLain',
  totalpotongan: 'totalPotongan',
  nettodibayar: 'nettoDibayar',
  tanggalfinalisasi: 'tanggalFinalisasi',
  tanggalpersetujuan: 'tanggalPersetujuan',
  tanggalpembayaran: 'tanggalPembayaran',
  nobukti: 'noBukti',
  // mst_role
  namarole: 'namaRole',
  // mst_user
  roleid: 'roleId',
  unitid: 'unitId',
};

// ── Valid column sets per Supabase table ─────────────────────
// PostgREST rejects unknown columns — strip fields not in the table schema
const TABLE_COLUMNS = {
  pendapatan: ['id','tanggal','unit','jenispelayanan','jumlahpasien','nilaipendapatan','operator','status'],
  jasa_medis: ['id','periode','nakes','jabatan','unit','tarifjasa','jumlahtindakan','totaljasa','status'],
  indexing:    ['id','kodeindex','namaindex','bobot','kategori','keterangan','aktif'],
  hasil_kalkulasi: ['id','periode','unit','totalpendapatan','totalbeban','totaljasamedis','totaljasaparamedis','totaljasapenunjang','bonusprestasi','pajak','netto','status'],
  approval:    ['id','referensi','tipe','nilai','pengaju','status','catatan','level','tanggalpengajuan'],
  nakes:       ['id','nip','nama','jabatan','unit','nostr','nosip','tanggallahir','tanggalmasuk','pendidikan','nohp','email','statusaktif','jasapertindakan','totaltindakan','totaljasa','rating'],
  pembayaran:  ['id','periode','nakesid','nakesnama','nip','jabatan','unit','bank','norekening','jasamedis','jasaparamedis','jasapenunjang','bonusprestasi','totaljasakotor','pajakpph','iuranbpjs','potonganlain','totalpotongan','nettodibayar','status','tanggalfinalisasi','tanggalpersetujuan','tanggalpembayaran','nobukti','catatan'],
  mst_user:    ['id','nama','username','email','nohp','roleid','unitid','jabatan','status','password'],
  mst_role:    ['id','namarole','level','deskripsi'],
};

function stripPayload(payload, table) {
  const allowed = TABLE_COLUMNS[table];
  if (!allowed) return payload;
  if (Array.isArray(payload)) return payload.map(row => {
    const out = {};
    for (const [k, v] of Object.entries(row)) { if (allowed.includes(k)) out[k] = v; }
    return out;
  });
  const out = {};
  for (const [k, v] of Object.entries(payload)) { if (allowed.includes(k)) out[k] = v; }
  return out;
}

// Reverse map: camelCase → lowercase (for sending data TO Supabase)
const LOWER_CASE_MAP = {};
for (const [lc, cc] of Object.entries(CAMEL_CASE_MAP)) {
  LOWER_CASE_MAP[cc] = lc;
}

function toCamelKey(key) {
  return CAMEL_CASE_MAP[key] || key;
}

function toLowerKey(key) {
  return LOWER_CASE_MAP[key] || key;
}

function transformRow(row, direction = 'toCamel') {
  if (!row || typeof row !== 'object') return row;
  const fn = direction === 'toCamel' ? toCamelKey : toLowerKey;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[fn(k)] = Array.isArray(v) ? v.map(r => transformRow(r, direction)) : (v && typeof v === 'object' ? transformRow(v, direction) : v);
  }
  return out;
}

function transformData(data, direction = 'toCamel') {
  if (Array.isArray(data)) return data.map(r => transformRow(r, direction));
  if (data && typeof data === 'object') return transformRow(data, direction);
  return data;
}

// ── Supabase REST API helper ──────────────────────────────────
const sbHeaders = {
  'apikey': SUPABASE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function sbFetch(table, method = 'GET', body = null, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const opts = { method, headers: { ...sbHeaders } };
  if (body) opts.body = JSON.stringify(body);
  if (method !== 'GET') opts.headers['Prefer'] = 'return=representation';
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Supabase ${method} ${table}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function sbSelect(table, select = '*', query = '') {
  const data = await sbFetch(table, 'GET', null, `?select=${select}${query}`);
  return transformData(data, 'toCamel');
}

async function sbInsert(table, rows) {
  const payload = transformData(rows, 'toLower');
  const stripped = stripPayload(payload, table);
  const data = await sbFetch(table, 'POST', stripped);
  return transformData(data, 'toCamel');
}

async function sbUpdate(table, id, data) {
  const payload = transformRow(data, 'toLower');
  const stripped = stripPayload(payload, table);
  const result = await sbFetch(table, 'PATCH', stripped, `?id=eq.${encodeURIComponent(id)}`);
  return transformData(result, 'toCamel');
}

async function sbDelete(table, id) {
  return sbFetch(table, 'DELETE', null, `?id=eq.${encodeURIComponent(id)}`);
}

async function sbUpsert(table, rows) {
  const payload = transformData(rows, 'toLower');
  const stripped = stripPayload(payload, table);
  const headers = { ...sbHeaders, 'Prefer': 'return=representation,resolution=merge-duplicates' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers, body: JSON.stringify(stripped),
  });
  if (!res.ok) throw new Error(`Supabase upsert ${table}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? transformData(JSON.parse(text), 'toCamel') : [];
}

// ── Express app ─────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, database: 'Supabase PostgreSQL', server: 'Express on HuggingFace Spaces' });
});

// Stats
app.get('/stats', async (_req, res) => {
  try {
    const pendapatan = await sbSelect('pendapatan', 'nilaipendapatan');
    const jasa = await sbSelect('jasa_medis', 'totaljasa');
    const nakes = await sbSelect('nakes', 'statusaktif');
    res.json({
      ok: true,
      data: {
        totalPendapatan: pendapatan.reduce((s, r) => s + (r.nilaiPendapatan || 0), 0),
        totalJasa: jasa.reduce((s, r) => s + (r.totalJasa || 0), 0),
        jumlahNakesAktif: nakes.filter(r => r.statusAktif).length,
        persentaseApproval: 87,
        pertumbuhanPendapatan: 12.5,
        jumlahTransaksi: pendapatan.length + jasa.length,
      }
    });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Sync log
app.get('/api/sync-log', async (_req, res) => {
  try {
    const logs = await sbSelect('sync_log', '*', '&order=timestamp.desc');
    res.json({ ok: true, data: logs });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Export all data (camelCase keys matching frontend interfaces)
app.get('/api/export', async (_req, res) => {
  try {
    const [pendapatan, jasaMedis, refIndexing, hasilKalkulasi, approval, nakes, pembayaran, mstUser, mstRole] = await Promise.all([
      sbSelect('pendapatan'),
      sbSelect('jasa_medis'),
      sbSelect('indexing'),
      sbSelect('hasil_kalkulasi'),
      sbSelect('approval'),
      sbSelect('nakes'),
      sbSelect('pembayaran'),
      sbSelect('mst_user'),
      sbSelect('mst_role'),
    ]);

    const data = {
      pendapatan,
      jasaMedis,
      refIndexing,
      hasilKalkulasi,
      approval,
      nakes,
      pembayaran,
      mstUser,
      mstRole,
      activityLog: [],
      notification: [],
      appSettings: { appName: 'SIM Remunerasi', version: '1.0', pajakPPh: 5.5, bpjsPercent: 1 },
      refUnit: ['Poli Umum','IGD','Poli Bedah','Poli Gigi','Poli Anak','Poli Penyakit Dalam','Kamar Bersalin','Kamar Perawatan','Laboratorium','Radiologi','Farmasi','Rehabilitasi Medis'],
      refJabatan: ['Dokter Spesialis Konsultan','Dokter Spesialis','Dokter Umum','Dokter Gigi','Perawat Ahli Madya','Perawat Pratama','Bidan','Apoteker','Analis Kesehatan','Radiografer','Fisioterapis','Administrasi Medis'],
      refJenisPelayanan: ['Rawat Jalan','Rawat Inap','Gawat Darurat','Penunjang'],
      refBank: ['BRI','BNI','Mandiri','BCA'],
      refLaporan: [],
      mstPermission: [],
      mstRolePermission: [],
    };
    res.json({ ok: true, data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── CRUD: Pendapatan ────────────────────────────────────────────
app.post('/api/pendapatan', async (req, res) => {
  try {
    const d = req.body;
    if (!d.id) d.id = `PEN-${uuidv4().slice(0,8)}`;
    await sbUpsert('pendapatan', [d]);
    res.json({ ok: true, id: d.id });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.delete('/api/pendapatan/:id', async (req, res) => {
  try {
    await sbDelete('pendapatan', req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── CRUD: Jasa Medis ────────────────────────────────────────────
app.post('/api/jasa-medis', async (req, res) => {
  try {
    const d = req.body;
    if (!d.id) d.id = `JASA-${uuidv4().slice(0,8)}`;
    await sbUpsert('jasa_medis', [d]);
    res.json({ ok: true, id: d.id });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.delete('/api/jasa-medis/:id', async (req, res) => {
  try {
    await sbDelete('jasa_medis', req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── CRUD: Indexing ──────────────────────────────────────────────
app.post('/api/indexing', async (req, res) => {
  try {
    const d = req.body;
    if (!d.id) d.id = `IDX-${uuidv4().slice(0,8)}`;
    d.aktif = !!d.aktif;
    await sbUpsert('indexing', [d]);
    res.json({ ok: true, id: d.id });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.delete('/api/indexing/:id', async (req, res) => {
  try {
    await sbDelete('indexing', req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Import data (upsert all tables) ────────────────────────────
// ── Valid column sets per Supabase table ─────────────────────
app.post('/api/import', async (req, res) => {
  try {
    const { mode = 'merge', data } = req.body;
    if (!data) return res.status(400).json({ ok: false, error: 'data required' });

    const tableMap = {
      pendapatan: 'pendapatan',
      jasaMedis: 'jasa_medis',
      refIndexing: 'indexing',
      hasilKalkulasi: 'hasil_kalkulasi',
      approval: 'approval',
      nakes: 'nakes',
      pembayaran: 'pembayaran',
      mstUser: 'mst_user',
      mstRole: 'mst_role',
    };

    const imported = [];
    const errors = [];
    for (const [key, table] of Object.entries(tableMap)) {
      const rows = data[key];
      if (!rows || !Array.isArray(rows) || rows.length === 0) continue;
      try {
        // 1) camelCase → lowercase keys
        let payload = transformData(rows, 'toLower');
        // 2) Strip columns unknown to Supabase
        payload = stripPayload(payload, table);
        // 3) Upsert or replace
        let result;
        if (mode === 'merge') {
          result = await sbUpsert(table, payload);
        } else {
          await sbFetch(table, 'DELETE', null, '');
          result = await sbInsert(table, payload);
        }
        imported.push(`${key}: ${result?.length || 0} rows`);
      } catch (e) {
        errors.push(`${key}: ${e.message}`);
      }
    }

    res.json({ ok: true, imported, errors: errors.length ? errors : undefined });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── CRUD: Approval ──────────────────────────────────────────────
app.post('/api/approval', async (req, res) => {
  try {
    const d = req.body;
    if (!d.id) return res.status(400).json({ ok: false, error: 'id required' });
    await sbUpdate('approval', d.id, d);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── CRUD: Hasil Kalkulasi ───────────────────────────────────────
app.post('/api/hasil-kalkulasi', async (req, res) => {
  try {
    const d = req.body;
    if (!d.id) return res.status(400).json({ ok: false, error: 'id required' });
    await sbUpdate('hasil_kalkulasi', d.id, d);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── CRUD: Nakes ─────────────────────────────────────────────────
app.post('/api/nakes', async (req, res) => {
  try {
    const d = req.body;
    if (!d.id) d.id = `NKS-${uuidv4().slice(0,8)}`;
    d.statusAktif = !!d.statusAktif;
    await sbUpsert('nakes', [d]);
    res.json({ ok: true, id: d.id });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.delete('/api/nakes/:id', async (req, res) => {
  try {
    await sbDelete('nakes', req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.patch('/api/nakes/:id/toggle-status', async (req, res) => {
  try {
    const current = await sbSelect('nakes', 'statusaktif', `&id=eq.${req.params.id}`);
    const newVal = !current[0].statusAktif;
    await sbUpdate('nakes', req.params.id, { statusAktif: newVal });
    res.json({ ok: true, statusAktif: newVal });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── CRUD: Pembayaran ────────────────────────────────────────────
app.post('/api/pembayaran', async (req, res) => {
  try {
    const d = req.body;
    if (!d.id) return res.status(400).json({ ok: false, error: 'id required' });
    await sbUpdate('pembayaran', d.id, d);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── CRUD: User ──────────────────────────────────────────────────
app.post('/api/user', async (req, res) => {
  try {
    const d = req.body;
    if (!d.id) d.id = `USR-${uuidv4().slice(0,6)}`;
    await sbUpsert('mst_user', [d]);
    res.json({ ok: true, id: d.id });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.delete('/api/user/:id', async (req, res) => {
  try {
    await sbDelete('mst_user', req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── CRUD: Role ──────────────────────────────────────────────────
app.post('/api/role', async (req, res) => {
  try {
    const d = req.body;
    if (!d.id) d.id = `ROL-${uuidv4().slice(0,6)}`;
    await sbUpsert('mst_role', [d]);
    res.json({ ok: true, id: d.id });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.delete('/api/role/:id', async (req, res) => {
  try {
    await sbDelete('mst_role', req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

// ── Serve static frontend (no-cache for SPA updates) ───────────
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  },
}));
app.get('*', (_req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ── Start server ────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SIM Remunerasi API + Frontend running on port ${PORT} (Supabase backend)`);
});