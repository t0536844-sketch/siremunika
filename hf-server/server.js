const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 7860;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://npasitielsksoksctqbv.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYXNpdGllbHNrc29rc2N0cWJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA1NTAwMSwiZXhwIjoyMDk2NjMxMDAxfQ.yLd9NAEEx6LZprt2sKo-naAAtqkntbWH436v7oRuUhI';

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
  return res.json();
}

async function sbSelect(table, select = '*', query = '') {
  return sbFetch(table, 'GET', null, `?select=${select}${query}`);
}

async function sbInsert(table, rows) {
  return sbFetch(table, 'POST', rows);
}

async function sbUpdate(table, id, data) {
  return sbFetch(table, 'PATCH', data, `?id=eq.${encodeURIComponent(id)}`);
}

async function sbDelete(table, id) {
  return sbFetch(table, 'DELETE', null, `?id=eq.${encodeURIComponent(id)}`);
}

async function sbUpsert(table, rows) {
  const headers = { ...sbHeaders, 'Prefer': 'resolution=merge-duplicates' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers, body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase upsert ${table}: ${res.status} ${await res.text()}`);
  return res.json();
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
    const pendapatan = await sbSelect('pendapatan', 'count,nilaiPendapatan');
    const jasa = await sbSelect('jasa_medis', 'count,totalJasa');
    const nakes = await sbSelect('nakes', 'count,statusAktif');
    res.json({
      ok: true,
      data: {
        totalPendapatan: pendapatan.reduce((s, r) => s + r.nilaiPendapatan, 0),
        totalJasa: jasa.reduce((s, r) => s + r.totalJasa, 0),
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
    const current = await sbSelect('nakes', 'statusAktif', `&id=eq.${req.params.id}`);
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

// ── Serve static frontend ──────────────────────────────────────
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// ── Start server ────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SIM Remunerasi API + Frontend running on port ${PORT} (Supabase backend)`);
});