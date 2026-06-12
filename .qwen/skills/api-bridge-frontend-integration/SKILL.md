---
name: api-bridge-frontend-integration
description: Integrate the Express API bridge with the React frontend using a data service layer — read with mock fallback, write with optimistic update + API save + warning fallback.
source: auto-skill
extracted_at: '2026-06-09T04:47:00.317Z'
---

## Overview
This skill documents wiring the **SIM Remunerasi** API bridge (`api-bridge/server.js`) to the React frontend (`src/pages/*`). It covers two integration patterns:

- **Read**: fetch data from API, fall back to mock data on failure (original pattern).
- **Write**: save data to database via individual CRUD endpoints, using an optimistic‑update pattern that preserves local state even if the API call fails.

---

## Pattern A — Read (fetch + mock fallback)

Used for page data loading (Dashboard, InputPendapatan, etc.).

1. **Centralised Data Service** (`src/data/dataService.ts`)
   * Generic `apiFetch<T>` helper prefixes requests with configurable base URL, handles non‑200 responses and API‑level errors.
   * Getter functions (`getPendapatan`, `getJasaMedis`, `getNakes`, …) try the API first; on failure, dynamically import mock data from `mockData.ts` so the UI stays functional.

2. **Page Component Integration**
   * Import `dataService`, add `isLoading` state, `useEffect` to load data.
   * On success → populate state. On error → fall back to mock data + show error toast.
   * Example: Dashboard loads `getDashboardStats`, `getPendapatan`, `getChartTrend` concurrently.

---

## Pattern B — Write (optimistic update + API save + warning fallback)

Used for form submissions, deletions, and status changes (InputPendapatan, InputJasa, Indexing, ProfilNakes, Approval, Hasil, ManajemenUser).

### 1. Add CRUD endpoints to `server.js`

Add individual POST/DELETE/PATCH endpoints for each entity. These use `buildLookupMaps()` to resolve frontend FK names (e.g. `unit: "Poli Umum"`) to database IDs (e.g. `unit_id: 5`).

Endpoint naming convention:
| Entity | Save (upsert) | Delete | Special |
|--------|--------------|--------|---------|
| Pendapatan | `POST /api/pendapatan` | `DELETE /api/pendapatan/:id` | — |
| Jasa Medis | `POST /api/jasa-medis` | `DELETE /api/jasa-medis/:id` | — |
| Indexing | `POST /api/indexing` | `DELETE /api/indexing/:id` | — |
| Nakes | `POST /api/nakes` | `DELETE /api/nakes/:id` | `PATCH /api/nakes/:id/toggle-status` |
| User | `POST /api/user` | `DELETE /api/user/:id` | — |
| Approval | `POST /api/approval` | — | — |
| Hasil Kalkulasi | `POST /api/hasil-kalkulasi` | — | — |

Key patterns in each endpoint:
- **Upsert via `IF NOT EXISTS … INSERT ELSE UPDATE`** for entities with known IDs.
- **`SELECT SCOPE_IDENTITY() AS newId`** for auto‑increment inserts (nakes, user) — return the new ID to frontend.
- **FK name→ID resolution** using `buildLookupMaps()` for unit, jabatan, jenisPelayanan, nakes names.
- **Return `{ ok: true, id }`** on success; `{ ok: false, error }` on failure.

### 2. Add save/delete functions to `dataService.ts`

Each function uses `apiFetch` to call the corresponding server endpoint:

```typescript
async savePendapatan(item: any): Promise<any> {
  return apiFetch('/api/pendapatan', { method: 'POST', body: JSON.stringify(item) });
},
async deletePendapatan(id: string): Promise<any> {
  return apiFetch(`/api/pendapatan/${encodeURIComponent(id)}`, { method: 'DELETE' });
},
```

### 3. Wire page handlers with optimistic‑update pattern

**Critical pattern — always update local state FIRST, then try API:**

```typescript
// BEFORE (only local state — data never reaches database)
const handleSubmit = () => {
  setItems([newItem, ...items]);
  showToast('success', 'Data ditambahkan', 'Berhasil');
};

// AFTER (local state + database save with graceful fallback)
const handleSubmit = async () => {
  let savedItem: Pendapatan;
  if (editing) {
    savedItem = { ...editing, ...form, status: 'pending' };
    setItems(items.map((i) => (i.id === editing.id ? savedItem : i)));
  } else {
    savedItem = { id: generateId(), ...form, status: 'pending' };
    setItems([savedItem, ...items]);
  }
  setShowModal(false);               // close modal immediately (optimistic)
  try {
    await dataService.savePendapatan(savedItem);
    showToast('success', 'Tersimpan ke database');
  } catch (e) {
    showToast('warning', 'Tersimpan lokal', 'Gagal simpan ke database');
  }
};
```

**Delete handler pattern:**

```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Hapus?')) return;
  setItems(items.filter((i) => i.id !== id));   // remove from local state first
  try {
    await dataService.deletePendapatan(id);
    showToast('warning', 'Dihapus dari database');
  } catch (e) {
    showToast('warning', 'Dihapus lokal saja', 'Gagal hapus dari database');
  }
};
```

**Status‑toggle pattern (Nakes):**

```typescript
const handleToggleStatus = async (id: string) => {
  setItems(items.map((n) => (n.id === id ? { ...n, statusAktif: !n.statusAktif } : n)));
  try {
    await dataService.toggleNakesStatus(id);
    showToast('success', 'Status diperbarui');
  } catch (e) {
    showToast('warning', 'Diperbarui lokal saja');
  }
};
```

### Why optimistic update?

- **No blocking UI**: modal closes immediately, no spinner needed for simple saves.
- **Works offline**: if API bridge is down, data still persists in React state (user can keep working).
- **Clear feedback**: success toast confirms DB save; warning toast tells user data is only local.
- **Consistent with read fallback**: the read pattern already uses mock data when API is down, so the write pattern mirrors this resilience philosophy.

---

## Entity‑to‑endpoint mapping (for wiring new pages)

When adding a new page that needs database persistence:

1. **Check if endpoint exists** in `server.js` — if not, add it following the naming convention above.
2. **Check if dataService function exists** — if not, add it using `apiFetch`.
3. **Wire the handler** — make it `async`, use optimistic‑update pattern, call dataService, handle catch.
4. **Test**: add data via form → check server logs → verify in database with `curl /api/export` or SQL query.

---

## CORS configuration for network access

The `cors` middleware **does NOT handle comma-separated string origins correctly**. If you pass `origin: 'http://localhost:5173,http://192.168.0.233:5173'` as a string, it sends ALL origins as a single `Access-Control-Allow-Origin` header value — browsers reject this because the header must contain exactly one origin or `*`.

**Fix: Use a custom origin function:**

```javascript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);  // Allow server-to-server requests
    const allowed = (process.env.CORS_ORIGIN || '*').split(',');
    if (allowed.includes(origin) || allowed.includes('*')) return callback(null, true);
    callback(null, true);  // Or restrict: callback(new Error('Not allowed'))
  },
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
}));
```

**Why:** The `cors` package's `origin` option expects an array, a boolean, a function, or a single string — NOT a comma-separated string. When it receives a multi-origin string, it concatenates them into one header value which browsers reject per the CORS spec.

## Network access configuration

To make the app accessible from other devices on the network (not just localhost):

### Server binding
- **API bridge**: `app.listen(PORT, '0.0.0.0', ...)` — listen on all interfaces, not just localhost.
- **Vite dev server**: `server: { host: '0.0.0.0', port: 5173 }` in `vite.config.ts`.

### Dynamic API URL routing
The frontend must determine whether it's running locally (separate API server on port 3100) or on a cloud platform (API served from the same origin). Use `window.location.port` to detect the environment:

```typescript
const API_BASE_URL = localStorage.getItem('sim_remunerasi_api_url') || 
  (window.location.port === '5173' || window.location.port === '5174' 
    ? `http://${window.location.hostname}:3100`  // Local dev: separate API server
    : '');  // Cloud/production: same server, relative URLs
```

**Why:** On localhost, the frontend runs on port 5173/5174 and the API runs on port 3100 — absolute URL needed. On HuggingFace Spaces (or any production deployment where Express serves both API and frontend from the same port), relative URLs work because the API shares the same origin. Using `window.location.hostname` instead of `'localhost'` ensures the URL resolves correctly from any device on the network.

### CORS_ORIGIN in .env
Include all network IPs that clients might use to access the frontend:
```
CORS_ORIGIN=http://localhost:5173,http://192.168.0.233:5173,http://192.168.1.250:5173
```

## HuggingFace Spaces deployment (Express + SQLite Docker)

The project deploys to HuggingFace Spaces as a **Docker container** running Express + SQLite, which serves both the REST API and the static frontend from port 7860. This replaces the local architecture (Vite on 5173 + Express+SQL Server on 3100) with a single-server cloud deployment.

### Architecture comparison

| Environment | Frontend | API | Database | Port |
|-------------|----------|-----|----------|------|
| Local dev | Vite dev server | Express + SQL Server | SIMRemunerasi (SQL Server 2019) | 5173 + 3100 |
| HF Spaces | Express static middleware | Express + SQLite | siremunika.db (SQLite) | 7860 |

### Directory structure for HF deployment

```
hf-server/
  package.json       — express, cors, sql.js, uuid
  package-lock.json  — REQUIRED (Docker npm ci fails without it)
  server.js          — Express app: init SQLite DB, mount CRUD routes, serve static frontend, listen on 7860
  data/
    siremunika.db    — SQLite database file (created at runtime, persisted to disk)
```

### Dockerfile (multi-stage: frontend build + backend build + runtime)

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build backend (hf-server)
FROM node:20-alpine AS backend-builder
WORKDIR /server
COPY hf-server/package.json hf-server/package-lock.json* ./
RUN npm ci --only=production
COPY hf-server/ ./

# Stage 3: Runtime — Express serves API + static frontend + SQLite
FROM node:20-alpine
WORKDIR /app
COPY --from=backend-builder /server /app/server
COPY --from=frontend-builder /app/dist /app/server/public
RUN mkdir -p /app/server/data
EXPOSE 7860
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:7860/health || exit 1
ENV NODE_ENV=production
ENV PORT=7860
CMD ["node", "/app/server/server.js"]
```

**Key points:**
- Frontend build output (`dist/`) is copied to `/app/server/public/` — Express serves it via `express.static()`.
- SQLite database is created in `/app/server/data/` — persisted to disk via `saveDb()` function.
- Port must be **7860** (HF Spaces requirement).
- No nginx needed — Express handles both API routes and static file serving.

### SQLite server implementation patterns

The `hf-server/server.js` uses `sql.js` (pure JavaScript SQLite via WASM) instead of `better-sqlite3` (native C++ bindings). This is critical for Docker Alpine compatibility.

**Async startup pattern:**
```javascript
const initSqlJs = require('sql.js');
async function start() {
  const SQL = await initSqlJs();  // Load WASM binary
  const db = initDatabase(SQL);   // Create/open DB from file or fresh
  app.listen(PORT, '0.0.0.0', () => { ... });
}
start().catch(e => { process.exit(1); });
```

**Helper functions (abstract sql.js awkward API):**
```javascript
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();  // CRITICAL: must free to avoid memory leaks
  return results;
}
function queryOne(sql, params = []) { return queryAll(sql, params)[0] || null; }
function queryRun(sql, params = []) { try { db.run(sql, params); return true; } catch(e) { return false; } }
function saveDb() {
  const data = db.export();  // Returns Uint8Array
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}
```

**CRUD endpoints use synchronous helpers (not async):** Unlike the local Express+SQL Server endpoints which use `async/await` with `mssql`, the SQLite endpoints are synchronous — all sql.js operations after `initSqlJs()` are synchronous. Call `saveDb()` after every write operation to persist data.

**Database persistence:** Call `saveDb()` after every INSERT/UPDATE/DELETE. Without this, data is only in memory and lost on restart. On startup, check if `siremunika.db` file exists and load it; otherwise create fresh with seed data.

### .gitignore and .dockerignore configuration

**`.gitignore`** — exclude local-only files:
```
api-bridge/          # Local SQL Server API, not for cloud
hf-server/node_modules/  # Rebuilt in Docker
hf-server/data/      # Runtime DB file, not for git
api key.txt          # Credentials — NEVER commit
*token* *secret* *credential*
```

**`.dockerignore`** — exclude build artifacts but INCLUDE `hf-server/` source:
```
node_modules/
dist/
.git/
.qwen/
report/
api-bridge/              # Not needed in Docker
hf-server/node_modules/  # Rebuilt by npm ci
hf-server/data/          # Runtime, not in image
```

**CRITICAL:** `.dockerignore` must NOT exclude `hf-server/` directory itself — the Dockerfile needs `COPY hf-server/ ./` to work. Only exclude `hf-server/node_modules/` and `hf-server/data/`.

### HF Spaces git push — merge conflict resolution

When pushing to an HF Space that was created via the web UI, the Space has an initial commit with template files (`README.md`, `.gitattributes`, etc.). This causes merge conflicts:

```bash
git fetch hf
git merge hf/main --allow-unrelated-histories -m "Merge HF initial commit"
# Resolve README.md conflict: keep YOUR project's frontmatter + content
# Delete HF template files (style.css, etc.) that don't belong
git add -A && git commit && git push hf main
```

**README.md frontmatter requirements for HF Spaces:**
```yaml
---
title: SIM Remunerasi RSUD Mimika
emoji: 🏥
colorFrom: green    # Must be: red/yellow/green/blue/indigo/purple/pink/gray
colorTo: blue        # Same valid color list
sdk: docker
app_port: 7860
pinned: false
license: openrail
---
```

`colorFrom` and `colorTo` must be from the **valid list only** — using other colors (teal, emerald, orange) causes the push to be rejected by HF's pre-receive hook.

### Docker build failure: missing package-lock.json

**The #1 cause of Docker build failure on HF Spaces:** `npm ci` in the Dockerfile requires `package-lock.json`. If it's missing from `hf-server/`, the backend-builder stage fails with exit code 1.

**Fix:** Always run `npm install` in `hf-server/` locally to generate `package-lock.json` before committing and pushing. Verify the file exists:
```bash
cd hf-server && npm install && ls package-lock.json
```

### HF Spaces API URL detection

The frontend `dataService.ts` uses port-based detection to route API calls correctly:

```typescript
const API_BASE_URL = localStorage.getItem('sim_remunerasi_api_url') ||
  (window.location.port === '5173' || window.location.port === '5174'
    ? `http://${window.location.hostname}:3100`  // Local: separate API server
    : '');  // HF Spaces: same server, relative URLs
```

On HF Spaces, `window.location.port` is empty (HTTPS default port 443) or the HF proxy port — NOT 5173/5174. So the condition falls through to empty string, meaning API calls use relative URLs like `/health`, `/api/export`, `/api/pendapatan` — which resolve to the same Express server serving the frontend.

**`NetworkDatabase.tsx`** uses the same pattern for its default `apiUrl` state.

## Common pitfalls

- **`ERR_FAILED` with 200 status**: Usually means the API bridge server is not running. Always start `node server.js` in the `api-bridge/` directory before testing.
- **CORS rejects with comma-separated origin string**: See "CORS configuration" section above — use a custom origin function, not a plain string.
- **API unreachable from network devices**: Ensure server listens on `0.0.0.0` (not default localhost-only) and CORS includes the device's access URL.
- **`window.location.hostname` vs `'localhost'`**: When accessed from a network device, `window.location.hostname` returns the server's IP (e.g. `192.168.0.233`), not `localhost`. Always use the dynamic hostname.
- **FK name resolution failures**: If the frontend sends `"Poli Umum"` as `unit` but that name doesn't exist in `ref_unit`, the server returns 400 with `Cannot resolve unit='...'`. Make sure reference data is seeded.
- **`SCOPE_IDENTITY()` for auto‑increment**: New nakes/user records use `INSERT …; SELECT SCOPE_IDENTITY() AS newId` — the response includes the generated ID for the frontend to track.
- **Frontend field names are camelCase**: The server endpoints accept camelCase (`jenisPelayanan`, `nilaiPendapatan`, `statusAktif`) and internally resolve to snake_case columns (`jenis_pelayanan_id`, `nilai_pendapatan`, `status_aktif`). This mirrors the view‑based export asymmetry documented in the architecture memory.
- **HF Spaces Docker build fails without package-lock.json**: `npm ci` requires an exact lockfile. Always generate `hf-server/package-lock.json` via `npm install` before pushing.
- **HF Spaces README colorFrom/colorTo validation**: Only `red, yellow, green, blue, indigo, purple, pink, gray` are valid. Other color names cause push rejection.
- **HF Spaces merge conflicts on first push**: Use `--allow-unrelated-histories` and resolve README.md conflict keeping your project's content.

## API response format must match between local and HF servers

The HF server (`hf-server/server.js`) and local API bridge (`api-bridge/server.js`) must return **identical response structures** from `/api/export`. If keys or column names differ, the frontend crashes with `TypeError: Cannot convert undefined or null to object` because `Object.keys()` receives null/undefined when expected keys are missing.

### Critical requirements for `/api/export` response

The response must include **all keys** that the frontend expects, even if some are empty arrays or static data. Missing keys cause `Object.keys(null)` crashes in components that iterate over the data structure.

```javascript
// MINIMUM required keys in /api/export response data object
const data = {
  pendapatan, jasaMedis, refIndexing, hasilKalkulasi, approval,
  nakes, pembayaran, mstUser, mstRole, activityLog, notification,
  appSettings, refUnit, refJabatan, refJenisPelayanan, refBank,
  refLaporan, mstPermission, mstRolePermission,
};
```

### Column names must be camelCase (matching frontend interfaces)

All API responses must produce **camelCase** keys matching the frontend TypeScript interfaces. The approach differs between SQLite and Supabase PostgreSQL:

#### SQLite (local API bridge)

SQLite column names in SELECT queries can use camelCase directly if the table defines them that way (like `kodeIndex`, `namaIndex`). If the table uses snake_case, you must alias:

```javascript
// WRONG — returns snake_case keys the frontend doesn't recognize
refIndexing: queryAll('SELECT * FROM indexing'),  // returns { kode_index, nama_index }

// CORRECT — returns camelCase keys matching frontend Indexing interface
refIndexing: queryAll('SELECT id, kodeIndex, namaIndex, bobot, kategori, keterangan, aktif FROM indexing'),
```

#### Supabase PostgreSQL — CRITICAL: lowercase normalization requires explicit mapping

**PostgreSQL normalizes ALL unquoted identifiers to lowercase.** This means Supabase PostgREST returns lowercase keys even when you created the table with camelCase column names. For example:
- `jenisPelayanan` column → PostgREST returns `jenispelayanan`
- `totalJasaMedis` column → returns `totaljasamedis`
- `statusAktif` column → returns `statusaktif`

**A generic snake_case→camelCase converter DOES NOT WORK** because PostgreSQL merges multi-word camelCase into a single lowercase string without underscores — `totalJasaMedis` becomes `totaljasamedis` (NOT `total_jasa_medis`). You can't reconstruct the original camelCase from `totaljasamedis` without knowing where the word boundaries are.

**Solution: Explicit bidirectional mapping table + transform functions in the API server:**

```javascript
// Explicit map: lowercase (from Supabase) → camelCase (frontend expects)
const CAMEL_CASE_MAP = {
  jenispelayanan: 'jenisPelayanan',
  jumlahpasien: 'jumlahPasien',
  nilaipendapatan: 'nilaiPendapatan',
  tarifjasa: 'tarifJasa',
  jumlahtindakan: 'jumlahTindakan',
  totaljasa: 'totalJasa',
  kodeindex: 'kodeIndex',
  namaindex: 'namaIndex',
  totalpendapatan: 'totalPendapatan',
  totalbeban: 'totalBeban',
  totaljasamedis: 'totalJasaMedis',
  totaljasaparamedis: 'totalJasaParamedis',
  totaljasapenunjang: 'totalJasaPenunjang',
  bonusprestasi: 'bonusPrestasi',
  tanggalpengajuan: 'tanggalPengajuan',
  nostr: 'noStr',
  nosip: 'noSip',
  tanggallahir: 'tanggalLahir',
  tanggalmasuk: 'tanggalMasuk',
  nohp: 'noHp',
  statusaktif: 'statusAktif',
  jasapertindakan: 'jasaPerTindakan',
  totaltindakan: 'totalTindakan',
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
  namarole: 'namaRole',
  roleid: 'roleId',
  unitid: 'unitId',
};

// Reverse map: camelCase → lowercase (for sending data TO Supabase)
const LOWER_CASE_MAP = {};
for (const [lc, cc] of Object.entries(CAMEL_CASE_MAP)) {
  LOWER_CASE_MAP[cc] = lc;
}

// Transform functions applied to ALL Supabase REST API read/write operations
function toCamelKey(key) { return CAMEL_CASE_MAP[key] || key; }
function toLowerKey(key) { return LOWER_CASE_MAP[key] || key; }

function transformRow(row, direction = 'toCamel') {
  if (!row || typeof row !== 'object') return row;
  const fn = direction === 'toCamel' ? toCamelKey : toLowerKey;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[fn(k)] = Array.isArray(v) ? v.map(r => transformRow(r, direction))
      : (v && typeof v === 'object' ? transformRow(v, direction) : v);
  }
  return out;
}

function transformData(data, direction = 'toCamel') {
  if (Array.isArray(data)) return data.map(r => transformRow(r, direction));
  if (data && typeof data === 'object') return transformRow(data, direction);
  return data;
}
```

**Apply transforms at the Supabase helper layer:**

- **Read** (`sbSelect`): `return transformData(data, 'toCamel')` — converts Supabase lowercase keys to camelCase before returning to frontend
- **Write** (`sbUpsert`, `sbInsert`, `sbUpdate`): convert incoming camelCase body to lowercase first (`transformData(rows, 'toLower')`), then send to Supabase; convert response back to camelCase (`transformData(result, 'toCamel')`)
- **Select column names**: Use lowercase column names in Supabase REST API `?select=` queries (e.g., `statusaktif` not `statusAktif`), since PostgREST expects lowercase

**Alternative approach (fix at the source):** Recreate Supabase tables with double-quoted column names (e.g., `"jenisPelayanan" TEXT`) so PostgreSQL preserves camelCase. This is cleaner but requires dropping and recreating all tables + re-seeding data. The mapping-table approach is faster and works without touching the database schema.

**How to discover the mapping:** Curl the `/api/export` endpoint and compare the returned lowercase keys against the frontend TypeScript interfaces in `mockData.ts`. Every multi-word property that differs needs an entry in `CAMEL_CASE_MAP`. Single-word keys (like `id`, `nama`, `unit`, `status`) don't need mapping — they're the same in both lowercase and camelCase.

## Null-safe rendering patterns for React + Supabase data

**Critical lesson:** Supabase (and any SQL database) allows `NULL` values in columns. When user-created records have nullable fields that are left empty, the API returns `null` (not `0` or `""`). React components that call string/number methods on these `null` values crash the entire render tree — the page appears blank/invisible with no error shown to the user.

### Specific crash patterns and fixes

| Pattern | Crashes on null | Null-safe fix |
|---------|----------------|---------------|
| `n.nama.toLowerCase()` | TypeError: Cannot read properties of null | `(n.nama || '').toLowerCase()` |
| `n.nama.replace(...)` | TypeError: Cannot read properties of null | `(n.nama || '??').replace(...)` |
| `rating.toFixed(1)` | TypeError: Cannot read properties of null | `(rating ?? 0).toFixed(1)` |
| `Math.floor(rating)` | Returns NaN for null → wrong UI | `Math.floor(rating || 0)` |
| `id.replace(/\D/g, '')` | TypeError: Cannot read properties of null | `(id || '0').replace(/\D/g, '')` |
| `items.reduce((s, n) => s + n.totalJasa, 0)` | `null + 0 = 0` (safe in JS) but still wrong for formatRupiah | `items.reduce((s, n) => s + (n.totalJasa || 0), 0)` |
| `formatRupiah(n.totalJasa)` where totalJasa is null | Intl.NumberFormat treats null as 0 → "Rp0" (no crash, but misleading) | `formatRupiah(n.totalJasa || 0)` for explicit |

### The `.toFixed()` crash is the most common and most dangerous

This is the #1 cause of "page doesn't open" when Supabase data has null numeric fields. The crash happens silently — React error boundary catches it but shows nothing, making the page appear completely blank.

```typescript
// BEFORE — crashes the entire ProfilNakes page when rating is null
const renderStars = (rating: number) => (
  <span>{rating.toFixed(1)}</span>  // null.toFixed(1) → TypeError!
);

// AFTER — null-safe, shows "0.0" for null ratings
const renderStars = (rating: number | null) => (
  <span>{(rating ?? 0).toFixed(1)}</span>
);
```

### How to systematically null-guard a page component

When a page component renders data from Supabase (or any database):

1. **Audit all property access in JSX** — grep for patterns like `.toLowerCase()`, `.replace()`, `.toFixed()`, `.substring()`, `.includes()` and add `(value || default)` guards.
2. **Audit all useMemo/useCallback computations** — add `|| 0` for numeric fields in `.reduce()`, `.filter()` predicates.
3. **Audit function signatures** — change `rating: number` to `rating: number | null` for any parameter that comes from database data.
4. **Test with null data** — curl `/api/export`, check if any items have null fields, then mentally trace how those null values flow through the component's render logic.

### Supabase data field subset vs TypeScript interface mismatch

Supabase tables typically store only a subset of the fields defined in frontend TypeScript interfaces. For example, `mstUser` in Supabase has `{id, nama, username, email, noHp, roleId, unitId, jabatan, status}` (9 fields) while `UserAccount` interface expects 17 fields (`avatar`, `lastLogin`, `createdAt`, `twoFactorEnabled`, `loginCount`, `isOnline`, etc.).

**Problem:** If you directly set Supabase data into React state typed as `UserAccount[]`, the missing fields become `undefined` — accessing `user.avatar` works (undefined) but `user.twoFactorEnabled` in conditional logic may produce wrong results.

**Fix: Merge Supabase data with default/reference data:**

```typescript
dataService.exportAllData().then((data) => {
  if (data.mstUser && data.mstUser.length > 0) {
    const merged = data.mstUser.map((u: any) => {
      const defaults = defaultUsers.find(d => d.id === u.id || d.username === u.username);
      return {
        id: u.id || 'USR-000',
        nama: u.nama || '',
        username: u.username || '',
        email: u.email || '',
        noHp: u.noHp || '',
        roleId: (u.roleId || 'viewer') as RoleId,
        unit: u.unit || u.unitId || '',
        jabatan: u.jabatan || '',
        // Fill missing fields from defaults
        avatar: u.avatar || u.nama?.substring(0, 2).toUpperCase() || '??',
        status: (u.status || 'aktif') as UserStatus,
        lastLogin: u.lastLogin || defaults?.lastLogin || '-',
        createdAt: u.createdAt || defaults?.createdAt || new Date().toISOString().slice(0, 10),
        twoFactorEnabled: u.twoFactorEnabled ?? defaults?.twoFactorEnabled ?? false,
        loginCount: u.loginCount ?? defaults?.loginCount ?? 0,
        isOnline: u.isOnline ?? defaults?.isOnline ?? false,
      } as UserAccount;
    });
    setUsers(merged);
  }
}).catch(() => { setUsers(defaultUsers); setRoles(defaultRoles); });
```

Key patterns in the merge:
- **String fields:** `u.field || ''` (empty string default)
- **Numeric fields:** `u.field ?? defaults?.field ?? 0` (nullish coalescing to preserve `0` as a valid value)
- **Boolean fields:** `u.field ?? defaults?.field ?? false`
- **Date fields:** `u.field || defaults?.field || fallbackString`
- **FK name resolution:** `u.unit || u.unitId || ''` — Supabase stores `unitId` (FK), frontend expects `unit` (display name)

### Common React+Supabase crash bugs

**Bug: `showToast` called without destructuring from `useApp()`**

```typescript
// WRONG — showToast is undefined → ReferenceError crashes render
export default function ManajemenUser() {
  // Missing: const { showToast } = useApp();
  const handleSave = async () => {
    showToast('success', 'Saved');  // ReferenceError: showToast is not defined
  };
}

// CORRECT
export default function ManajemenUser() {
  const { showToast } = useApp();  // Required!
  ...
}
```

**Why this crashes silently:** `showToast` is not a variable in scope, so calling it throws `ReferenceError`. If this happens inside a handler function (not during initial render), the error is caught by the handler's try/catch or React's error handling. But if it happens during render (e.g., in a useMemo or useEffect callback that calls showToast synchronously), it crashes the entire component tree.

**Bug: API response format mismatch — `Object.keys(undefined)` crash**

```typescript
// WRONG — /stats returns { ok, data: { totalPendapatan, ... } } not { tables, views }
const loadDatabaseStats = async () => {
  const response = await fetch(`${apiUrl}/stats`);
  const data: DatabaseStats = await response.json();
  setDbStats(data);  // data has no .tables property
};
// Later in JSX: Object.keys(dbStats.tables).length → Object.keys(undefined) → TypeError!

// CORRECT — parse the actual response format and adapt
const loadDatabaseStats = async () => {
  const result = await response.json();
  if (result.ok && result.data) {
    const tables: Record<string, string> = {};
    for (const [key, val] of Object.entries(result.data)) {
      if (typeof val === 'number') tables[key] = String(val);
    }
    setDbStats({ tables, views: [] });
  }
};
```

**Rule:** Never assume the API response format matches your TypeScript interface. Always validate the actual response structure and adapt it. Type assertions (`as DatabaseStats`) don't provide runtime safety — they only silence the compiler.

## Deployment checklist — always commit ALL fixes before pushing

**Common mistake:** Making fixes to multiple files but only staging/committing some of them. The uncommitted changes don't get built into the Docker image and aren't deployed to HF Spaces.

```bash
# WRONG — only commits ManajemenUser, leaves ProfilNakes changes uncommitted
git add src/pages/ManajemenUser.tsx && git commit -m "fix ManajemenUser"

# CORRECT — check git status, stage ALL modified source files before committing
git status  # See ALL modified files
git add src/pages/ManajemenUser.tsx src/pages/ProfilNakes.tsx src/pages/NetworkDatabase.tsx
git commit -m "fix: null-safe rendering + showToast destructuring + stats format"
npm run build  # Rebuild frontend with ALL fixes
git push origin main && git push hf main
```

**Always run `git status` and `git diff` before committing** to verify all intended changes are staged. Missing a file means the deployed version still has the bug.

### Missing API endpoints cause HTML fallback (not JSON)

When Express serves both API and static frontend from the same server (HF Spaces Docker), the catch-all route `app.get('*', ...)` serves `index.html` for ANY undefined route. This means:

- If `/api/sync-log` endpoint doesn't exist, Express falls through to `app.get('*', ...)` which returns `index.html` (HTML content).
- The frontend tries to parse this as JSON → `SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON`

**Fix:** Define ALL API endpoints BEFORE the catch-all static serving route. Required endpoints that the frontend calls:

| Endpoint | Used by | Purpose |
|----------|---------|---------|
| `/health` | NetworkDatabase | Connection check |
| `/stats` | Dashboard | Dashboard statistics |
| `/api/export` | All pages (via dataService getters) | Load all data |
| `/api/sync-log` | NetworkDatabase | Sync history |
| `/api/pendapatan` | InputPendapatan | Save/delete pendapatan |
| `/api/jasa-medis` | InputJasa | Save/delete jasa medis |
| `/api/indexing` | Indexing | Save/delete indexing |
| `/api/approval` | Approval | Update approval status |
| `/api/hasil-kalkulasi` | Hasil | Update hasil status |
| `/api/nakes` | ProfilNakes | Save/delete/toggle nakes |
| `/api/user` | ManajemenUser | Save/delete user |
| `/api/pembayaran` | OutputPembayaran | Update pembayaran status |

**Rule:** Every endpoint that exists in `api-bridge/server.js` must also exist in `hf-server/server.js`. If an endpoint is missing, the frontend gets HTML instead of JSON → crash.

### Browser caching stale SPA — "fix deployed but error still appears"

When using `vite-plugin-singlefile`, the entire SPA is bundled into a single `index.html` with all JS/CSS inlined. After deploying a fix, the browser may still serve the **cached old version** — users see the same crash (e.g., `null.toFixed()` TypeError) even though the code is fixed on the server.

**Why this happens:** The single-file SPA has no separate JS filename with a content hash that changes on rebuild. The browser's default caching behavior keeps the old `index.html` (with old inlined JS) because the URL hasn't changed.

**Fix: Add no-cache headers at multiple levels:**

1. **Express server — Cache-Control headers on static files:**
```javascript
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
```

2. **HTML meta tags — fallback for proxies that strip HTTP headers:**
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

3. **Tell users to hard-refresh:** After deploying fixes, instruct users to press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac), or open in a new incognito/private window.

**Debugging tip:** To verify whether the deployed version has the fix, check the HF Spaces API endpoint SHA:
```
https://huggingface.co/api/spaces/Timsupport/siremunika
```
Compare the `lastSyncedCommitSha` against your local `git log --oneline -1`. If they match but the browser still shows the old error, it's definitely a caching issue.

### Database upgrade handling for existing DB files

When the HF Spaces Docker container restarts with a new version of `server.js` that adds new tables (e.g. `mst_user`, `mst_role`, `sync_log`), the existing `siremunika.db` file may persist from a previous deployment. The old DB file won't have the new tables, causing SELECT queries to fail.

**Fix:** Add an `ensureTables()` function that runs after loading an existing DB file:

```javascript
function initDatabase() {
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
    ensureTables();  // Create missing tables, seed if empty
  } else {
    db = new SQL.Database();
    seedData();
    saveDb();
  }
}

function ensureTables() {
  db.exec('CREATE TABLE IF NOT EXISTS mst_user (...)');
  db.exec('CREATE TABLE IF NOT EXISTS mst_role (...)');
  db.exec('CREATE TABLE IF NOT EXISTS sync_log (...)');
  // Seed only if table is empty (don't duplicate data)
  if (queryAll('SELECT COUNT(*) as c FROM mst_role')[0].c === 0) { ... seed ... }
  saveDb();
}
```

## HF Spaces deployment: push to both remotes separately

`git push origin main` pushes to GitHub. `git push hf main` pushes to HuggingFace Spaces. These are **two separate git remotes** — pushing to one does NOT push to the other. When making fixes, always push to BOTH:

```bash
git push origin main && git push hf main
```

**Common mistake:** After committing a fix, you push to `origin/main` (GitHub) but forget `hf/main`. The HF Spaces stays on the old commit, and users see the old buggy version. The HF API shows `lastSyncedCommitSha` that doesn't match your latest local commit.

**Force rebuild if HF doesn't auto-rebuild:** Sometimes HF Spaces needs a manual restart to trigger Docker rebuild after a new push. Use the HF API:

```bash
curl -X POST "https://huggingface.co/api/spaces/<username>/<space>/restart" \
  -H "Authorization: Bearer <hf_token>"
```

This returns `{"stage":"RUNNING_BUILDING"}` confirming the rebuild is triggered.

**Check deployed commit:** Verify the deployed commit matches your latest push:
```bash
curl -s "https://huggingface.co/api/spaces/<username>/<space>" | grep sha
```

Compare against `git log hf/main --oneline -1`.

## Missing API endpoints: always check dataService calls against server routes

**Common mistake:** The frontend `dataService.ts` calls API endpoints that don't exist on the HF server (`hf-server/server.js`). For example, `dataService.importData()` calls `POST /api/import`, but if that endpoint wasn't added to the server, it returns 404.

**Checklist when adding new frontend features:**
1. Does `dataService.ts` call the endpoint? → Check `apiFetch('/api/...')` calls
2. Does `hf-server/server.js` have a matching route handler? → Search for `app.post('/api/...')` etc.
3. Does the local `api-bridge/server.js` have it too? → Both servers need matching routes

**Import endpoint pattern:** The `POST /api/import` endpoint accepts `{ mode: 'merge'|'replace', data: { pendapatan: [...], nakes: [...], ... } }` and upserts each entity into Supabase:

```javascript
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

    const results = {};
    for (const [key, table] of Object.entries(tableMap)) {
      const rows = data[key];
      if (!rows || !Array.isArray(rows) || rows.length === 0) continue;
      const payload = transformData(rows, 'toLower');  // camelCase → lowercase for Supabase
      if (mode === 'merge') {
        results[key] = await sbUpsert(table, payload);
      } else {
        await sbFetch(table, 'DELETE', null, '');
        results[key] = await sbInsert(table, payload);
      }
    }
    res.json({ ok: true, imported: Object.keys(results).map(k => `${k}: ${results[k]?.length || 0} rows`) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});
```

**Key point:** The import endpoint must apply `transformData(rows, 'toLower')` to convert camelCase keys from the frontend into lowercase keys that Supabase expects, just like the individual CRUD endpoints do.

## Reference/lookup data must use mock data as initial state (not empty `[]`)

**Problem:** When a page component uses `.find()` or lookup operations on reference data (e.g., finding a pendapatan record by ID to display details in an approval modal), initializing that state as `useState([])` causes the lookup to always fail on first render — `.find()` on an empty array returns `undefined`, and the detail view shows blank/white/empty content.

**Why this happens:** The `useEffect` data loading is asynchronous. Between the initial render and the Promise resolving, the state arrays are empty. If the user opens a detail modal during this window (or if the API is slow/unavailable), all lookups return `undefined` → `getRelatedDetail()` returns `null` → "Data sumber tidak ditemukan" or a blank modal.

**The same issue affected Profil Nakes before it was fixed** — the page showed a white/blank screen because lookup data was empty.

**Fix: Initialize reference data state with mock data, then override with real API data when available:**

```typescript
// ❌ WRONG — empty initial state, lookups fail before API responds
const [dataPendapatan, setDataPendapatan] = useState<Pendapatan[]>([]);
const [dataJasa, setDataJasa] = useState<JasaMedis[]>([]);

// ✅ CORRECT — mock data as initial state, lookups work immediately
const [dataPendapatan, setDataPendapatan] = useState<Pendapatan[]>(mockPendapatan);
const [dataJasa, setDataJasa] = useState<JasaMedis[]>(mockJasa);
```

**The useEffect fallback is simpler because mock data is already the initial state:**

```typescript
// ✅ CORRECT — override mock with real data when available; no redundant fallback needed
useEffect(() => {
  dataService.getPendapatan()
    .then((d) => { if (d && d.length > 0) setDataPendapatan(d); })
    .catch(() => {});  // already using mockPendapatan, no action needed
}, []);
```

**vs. the old approach with empty initial state (requires explicit fallback):**

```typescript
// ❌ OLD — had to explicitly set mock data on catch, but modal was still blank during loading
useEffect(() => {
  dataService.getPendapatan()
    .then((d) => { if (d) setDataPendapatan(d); })
    .catch(() => setDataPendapatan(mockPendapatan));  // redundant with mock-as-initial-state
}, []);
```

**When to use this pattern:**
- ✅ Use mock-as-initial-state when the state is **reference/lookup data** used by `.find()`, `.filter()` lookups, or detail modals
- ✅ Use `useState([])` for **primary page data** (the list/table that the page directly displays) — this data arrives quickly via `useEffect` and the page shows a loading state or empty-list message naturally

**Import aliasing gotcha:** When you import mock data with aliases (`import { dataPendapatan as mockPendapatan }`) but later add a state variable with the original name (`const [dataPendapatan, setDataPendapatan] = useState(mockPendapatan)`), any code that still references the original unaliased name (`dataPendapatan.find(...)`) at module scope will throw `ReferenceError: dataPendapatan is not defined`. The fix is either:
1. Use the alias consistently in the function body, OR
2. Move the lookup into the component where the state variable shadows the import

**Null-safe access in detail functions:** When building detail/lookup functions that reference API-loaded data, use optional chaining (`d?.id || '-'`) and null-safe helpers (`d?.nilaiPendapatan ? formatRupiah(d.nilaiPendapatan) : '-'`) to prevent crashes when fields are missing from API data (null/undefined from nullable DB columns).

**Error boundary for modal rendering:** When a modal renders data that could have unexpected shapes (mixed mock + API data), wrap it in a React Error Boundary class component. Without an error boundary, any render crash (like rendering `<undefined />` from a failed icon lookup) unmounts the entire page — the user sees a blank white screen with no feedback. The Error Boundary catches the crash and shows a user-friendly message instead:

```typescript
class DetailErrorBoundary extends Component<{ children: React.ReactNode; onReset: () => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div className="text-center py-8 px-4">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <p className="text-sm font-semibold">Gagal menampilkan detail</p>
        <button onClick={() => { this.setState({ hasError: false }); this.props.onReset(); }}>Tutup Modal</button>
      </div>
    );
    return this.props.children;
  }
}
```

**Null-safe icon/label lookups in modals:** When using Record maps for icons/colors/labels based on a `tipe` field (`tipeIcon[detailItem.tipe]`, `tipeColor[detailItem.tipe]`), always provide a fallback because an unexpected `tipe` value produces `undefined` — rendering `<undefined className="w-5 h-5" />` crashes React:

```typescript
// ❌ CRASHES if detailItem.tipe is not in tipeIcon
{(() => { const IC = tipeIcon[detailItem.tipe]; return <IC className="w-5 h-5" />; })()}

// ✅ Null-safe — fallback to a generic icon
{(() => { const IC = tipeIcon[detailItem.tipe] || FileText; return <IC className="w-5 h-5" />; })()}
```

## Critical async bug: try/catch does NOT catch un-awaited async rejections

**This is the #1 cause of "data not persisting" bugs in this project.** The pattern `try { someAsyncFunction(); } catch { ... }` **only catches synchronous errors**, NOT async Promise rejections. If `someAsyncFunction()` returns a rejected Promise, the catch block is never executed — the error silently vanishes, and the operation appears to succeed locally but never reaches the database.

**How it manifests:** User clicks "Approve" → toast says "✅ Disetujui" → looks successful in UI → refresh page → status reverted back to "pending" because the database never received the update.

```typescript
// ❌ WRONG — fire-and-forget, catch never triggers on async rejection
const executeAction = () => {
  setItems(prev => prev.map(...));  // optimistic local update
  showToast('success', '✅ Disetujui');
  try {
    dataService.updateApproval({ id, status: 'approved' });  // NOT awaited
  } catch {
    showToast('warning', 'Updated locally only');  // NEVER reached on async failure
  }
};

// ✅ CORRECT — properly await the async call inside an async function
const executeAction = () => {
  setProcessing(true);
  setTimeout(async () => {  // make the callback async
    setItems(prev => prev.map(...));
    showToast('success', '✅ Disetujui');
    try {
      await dataService.updateApproval({ id, status: 'approved' });  // AWAITED
    } catch {
      showToast('warning', 'Updated locally only');  // Now properly catches async errors
    }
    setProcessing(false);
  }, 800);
};

// ✅ ALSO CORRECT — make the entire handler async
const handleRevert = async (id: string) => {
  setItems(prev => prev.map(...));
  showToast('info', 'Status dikembalikan');
  try {
    await dataService.updateApproval({ id, status: 'pending' });
  } catch {
    showToast('warning', 'Updated locally only');
  }
};
```

**Rule: Every `dataService.*` call that modifies data MUST be `await`ed inside an `async` function/callback.** If the containing function uses `setTimeout`, make the callback `async`: `setTimeout(async () => { ... })`.

## PostgREST 500 errors: unknown columns in write payloads

**This is the #1 cause of 500 Internal Server Error when saving/updating data to Supabase.** The frontend TypeScript interfaces contain mock-only fields (like `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`, `alasanTolak` for Approval, or `twoFactorEnabled`, `loginCount`, `isOnline` for Users) that **do not exist as columns in the Supabase table schema**. When these fields are included in PATCH/POST payloads, PostgREST rejects them with a 400/500 error.

**How it manifests:** User clicks "Approve" → toast says success → but console shows `POST /api/approval 500 (Internal Server Error)`. The Express handler catches the PostgREST error and returns 500 to the frontend. The optimistic local update succeeds, but the database never receives the change.

**Root cause trace:**
1. Frontend sends `{ id, status: 'approved', approvedBy: 'Admin', approvedAt: '2026-...' }` to `POST /api/approval`
2. Express handler calls `sbUpdate('approval', id, data)` → `transformRow(data, 'toLower')`
3. `transformRow` converts `approvedBy` → stays `approvedBy` (NOT in LOWER_CASE_MAP, no transformation needed)
4. PostgREST PATCH to `approval` table includes column `approvedby` → table doesn't have this column → 400/500 error
5. Express catches error → returns `{ ok: false, error: "Supabase PATCH approval: 400 ..." }` → frontend sees 500

**Fix: Strip unknown columns from ALL Supabase write operations.** Define a `TABLE_COLUMNS` map (listing only columns that actually exist in each Supabase table) and a `stripPayload()` helper. Apply it to `sbInsert`, `sbUpdate`, and `sbUpsert`:

```javascript
// ── Valid column sets per Supabase table ─────────────────────
const TABLE_COLUMNS = {
  pendapatan: ['id','tanggal','unit','jenispelayanan','jumlahpasien','nilaipendapatan','operator','status'],
  jasa_medis: ['id','tanggal','nakes','nakesid','unit','jabatan','jenispelayanan','tarifjasa','jumlahtindakan','totaljasa','status'],
  indexing:    ['id','kodeindex','namaindex','deskripsi','bobot','aktif'],
  hasil_kalkulasi: ['id','periode','unit','totalpendapatan','totalbeban','totaljasamedis','totaljasaparamedis','totaljasapenunjang','bonusprestasi','status'],
  approval:    ['id','referensi','tipe','nilai','pengaju','status','catatan','level','tanggalpengajuan'],
  nakes:       ['id','nip','nama','jabatan','unit','nostr','nosip','tanggallahir','tanggalmasuk','pendidikan','nohp','email','statusaktif','jasapertindakan','totaltindakan','totaljasa','rating'],
  pembayaran:  ['id','periode','nakesid','nakesnama','unit','jabatan','jasamedis','jasaparamedis','jasapenunjang','totaljasakotor','pajakpph','iuranbpjs','potonganlain','totalpotongan','nettodibayar','status','norekening','tanggalpembayaran','tanggalpersetujuan','tanggalfinalisasi','nobukti'],
  mst_user:    ['id','nama','username','email','nohp','roleid','unitid','jabatan','status'],
  mst_role:    ['id','namarole','deskripsi'],
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

// Apply to ALL write functions:
async function sbInsert(table, rows) {
  const payload = transformData(rows, 'toLower');
  const stripped = stripPayload(payload, table);  // ← strip unknown columns
  const data = await sbFetch(table, 'POST', stripped);
  return transformData(data, 'toCamel');
}

async function sbUpdate(table, id, data) {
  const payload = transformRow(data, 'toLower');
  const stripped = stripPayload(payload, table);  // ← strip unknown columns
  const result = await sbFetch(table, 'PATCH', stripped, `?id=eq.${encodeURIComponent(id)}`);
  return transformData(result, 'toCamel');
}

async function sbUpsert(table, rows) {
  const payload = transformData(rows, 'toLower');
  const stripped = stripPayload(payload, table);  // ← strip unknown columns
  const headers = { ...sbHeaders, 'Prefer': 'resolution=merge-duplicates' };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers, body: JSON.stringify(stripped),
  });
  ...
}
```

**Key rules for `TABLE_COLUMNS`:**
- **Must be defined BEFORE `sbInsert`/`sbUpdate`/`sbUpsert`** — since these are `async function` declarations (not `const`), they're hoisted, but `TABLE_COLUMNS` is `const` and NOT hoisted. Place `TABLE_COLUMNS` at the top of server.js (after CAMEL_CASE_MAP) so it's always available.
- **Must list ALL columns that exist in the Supabase table** — not just the ones you want to update. If you miss a column, it will be stripped from INSERT payloads and the row won't have that column value.
- **Must NOT include columns that don't exist** — mock-only fields like `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`, `alasanTolak`, `timestamp` (for approval), `twoFactorEnabled`, `avatar`, `loginCount` (for users) must NOT be listed. These are frontend-only fields that don't map to real database columns.
- **Must be updated when Supabase schema changes** — if you add a new column to a table (e.g., adding `nilai` and `level` to `approval`), you must update `TABLE_COLUMNS` to include them, otherwise they'll be stripped from payloads.
- **Column names must be lowercase** — matching the actual Supabase/PostgreSQL column names (not camelCase). The `stripPayload` function operates on the payload AFTER `transformRow(data, 'toLower')` has been applied, so all keys are already lowercase.

**How to discover which columns exist in a Supabase table:**
1. Query the `/api/export` endpoint and look at the keys returned for each entity
2. Or use Supabase dashboard: https://supabase.com/dashboard/project/npasitielsksoksctqbv/editor
3. Compare returned keys against `TABLE_COLUMNS` — any key present in API response but missing from `TABLE_COLUMNS` needs to be added; any key in `TABLE_COLUMNS` but NOT in API response should be removed

**When adding a new CRUD endpoint for a new entity:**
1. First, create the Supabase table with the needed columns
2. Then, add the table name + column list to `TABLE_COLUMNS` in server.js
3. Then, add the Express endpoint (POST/DELETE/PATCH)
4. Then, add the `dataService` method in frontend
5. Then, wire the page handler with optimistic-update + `await`

### Critical: Prefer header must include BOTH values for upsert

The `sbUpsert` function sends a POST with `Prefer: resolution=merge-duplicates` to PostgREST. If you override `Prefer` to ONLY `resolution=merge-duplicates` (removing the default `return=representation` from `sbHeaders`), PostgREST returns an **empty response body** for successful operations. Then `res.json()` tries to parse an empty string → throws `SyntaxError: Unexpected end of JSON input` → Express catches it → returns 500 to frontend.

**This is the #1 cause of "Unexpected end of JSON input" 500 errors on POST/upsert endpoints.**

```javascript
// WRONG — only resolution=merge-duplicates, no return=representation
const headers = { ...sbHeaders, 'Prefer': 'resolution=merge-duplicates' };
// Result: PostgREST returns empty body → res.json() crashes

// CORRECT — both values comma-separated
const headers = { ...sbHeaders, 'Prefer': 'return=representation,resolution=merge-duplicates' };
// Result: PostgREST returns the upserted rows → res.json() succeeds
```

**Why:** When you spread `sbHeaders` (which has `Prefer: 'return=representation'`) and then override with `'Prefer': 'resolution=merge-duplicates'`, the later key wins — replacing `return=representation` entirely. PostgREST needs BOTH values to return data AND handle merge conflicts.

### Critical: Safe JSON parsing for all Supabase responses

PostgREST may return an empty body for various operations (DELETE, PATCH without `return=representation`, etc.). Using `res.json()` directly on empty responses throws `SyntaxError: Unexpected end of JSON input`, which crashes the Express handler and returns 500 to the frontend.

**Fix: Always use `res.text()` before `JSON.parse()`:**

```javascript
// WRONG — res.json() crashes on empty body
async function sbFetch(table, method, body, query) {
  ...
  return res.json();  // Throws "Unexpected end of JSON input" if body is empty
}

// CORRECT — safe parse with empty fallback
async function sbFetch(table, method, body, query) {
  ...
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}
```

**Apply this pattern to ALL Supabase helper functions:** `sbFetch`, `sbSelect` (which calls `sbFetch`), `sbInsert`, `sbUpdate`, `sbUpsert`, `sbDelete` — any function that processes PostgREST responses.

**Why:** Even with `return=representation` in the Prefer header, some operations may return empty bodies (e.g., DELETE on a non-existent row, PATCH that doesn't match any rows). The safe pattern prevents the Express handler from crashing and returning 500 to the frontend.

## Comprehensive CRUD persistence checklist

When a page's operations appear to work in the UI but don't persist to the database after refresh, systematically check EVERY handler:

| Check | What to verify |
|-------|---------------|
| 1. Does `dataService` have a method for this operation? | If not, add it (e.g. `savePembayaran`, `saveRole`) |
| 2. Does the server have an endpoint? | If not, add it to `hf-server/server.js` (e.g. `POST /api/role`, `DELETE /api/role/:id`) |
| 3. Does the page handler call `await dataService.*Method*()`? | If only `setItems()` with no API call → add the call |
| 4. Is the `await` inside an `async` function? | `try { asyncFn(); } catch {}` silently fails — must `await` inside `async` |
| 5. Does the catch block inform the user? | `showToast('warning', 'Updated locally only')` — so they know data isn't in DB |
| 6. Does the payload contain mock-only fields? | Check `TABLE_COLUMNS` — fields like `approvedBy`, `twoFactorEnabled` not in Supabase will cause 500 unless stripped |
| 7. Is the `Prefer` header correct for upsert? | Must be `return=representation,resolution=merge-duplicates` — not just `resolution=merge-duplicates` |
| 8. Is `res.json()` safe on empty responses? | Use `res.text()` → `JSON.parse()` pattern — `res.json()` crashes on empty body |

**Known pages that had local-only operations (fixed):**
- **OutputPembayaran**: `handleFinalisasi`, `handleSetujui`, `handleBayar`, `handleBatal` — all 4 only did `setItems()`, no API calls. Added `await dataService.savePembayaran(...)` to each.
- **ManajemenUser**: `handleToggleStatus`, `handleSuspend` — only `setUsers()`. Added `await dataService.saveUser(...)`. Role CRUD (`handleSaveRole`, `handleDeleteRole`) — only `setRoles()`. Added `await dataService.saveRole/deleteRole`.
- **Approval**: `executeAction` and `handleRevert` — had `dataService.updateApproval()` calls but NOT awaited (fire-and-forget). Added `await` + made callbacks `async`.

## Incomplete save payloads — form fields omitted from API request

**This is a systematic bug pattern** that causes "data not saved" even when the API call succeeds. The frontend form has fields (e.g., `jasaPerTindakan`, `totalTindakan`, `totalJasa`, `rating` in ProfilNakes) that the user fills in, but the `savedItem` object constructed for the API call **omits those fields**. The local state update (`setItems`) includes them (via `{ ...form }`), but the API payload only includes a subset.

**How it manifests:** User fills in jasaPerTindakan = 450000 → save succeeds → refresh → jasaPerTindakan shows null/0 because Supabase never received it.

**Root cause:** The developer manually constructs `savedItem` with a subset of form fields instead of sending the full form. This often happens because some fields were added later to the form/Supabase table but the `savedItem` wasn't updated.

```typescript
// ❌ WRONG — savedItem omits fields that exist in the form AND Supabase
const savedItem = {
  nip: form.nip,
  nama: form.nama,
  jabatan: form.jabatan,
  // ... 10 more fields ...
  statusAktif: form.statusAktif,
  // MISSING: jasaPerTindakan, totalTindakan, totalJasa, rating
};
await dataService.saveNakes(savedItem);  // API succeeds but 4 fields never reach DB

// ✅ CORRECT — include ALL fields that exist in both the form and the database
const savedItem = {
  nip: form.nip,
  nama: form.nama,
  jabatan: form.jabatan,
  // ... all fields ...
  statusAktif: form.statusAktif,
  jasaPerTindakan: form.jasaPerTindakan,
  totalTindakan: form.totalTindakan,
  totalJasa: form.totalJasa,
  rating: form.rating,
};
await dataService.saveNakes(savedItem);
```

**Rule: The `savedItem` sent to the API must include EVERY field that exists in both the form state AND the Supabase table.** Fields that only exist in mock data (not in Supabase) will be stripped by `stripPayload`/`TABLE_COLUMNS`, so it's safe to include them. But fields that DO exist in Supabase MUST be in `savedItem` — otherwise they're silently lost.

**How to verify:** After any save operation, check the Supabase data via `/api/export` or the Supabase dashboard. Compare the stored data against what the user entered. Any field showing null/default values that the user filled in indicates an incomplete payload.

**Prevention:** When adding a new field to a form, ALWAYS add it to both:
1. The `savedItem` object in the save handler
2. The `TABLE_COLUMNS` array in server.js (if it's a new Supabase column)

## Null-safe form validation and initialization for Supabase data

**Pattern:** When editing a record loaded from Supabase, nullable columns return `null` (not `""` or `0`). Calling `.trim()` on a null string field crashes with `TypeError: Cannot read properties of null (reading 'trim')`.

**How it manifests:** User clicks "Edit" on an existing nakes record → form loads with `noStr: null` from Supabase → user tabs out of a field → `onBlur` triggers validation → `form.noStr.trim()` → TypeError → page crashes or validation never completes.

```typescript
// ❌ WRONG — crashes on null values from Supabase
function validateForm(form: FormNakes): FormError {
  if (!form.noStr.trim()) err.noStr = 'No. STR wajib diisi';  // null.trim() → TypeError!
}

// ✅ CORRECT — null-safe coalescing before string methods
function validateForm(form: FormNakes): FormError {
  const noStr = form.noStr ?? '';
  if (!noStr.trim()) err.noStr = 'No. STR wajib diisi';
}
```

**Also sanitize on form initialization (openEdit):**

```typescript
// ❌ WRONG — raw Supabase data has null values that crash validation
const openEdit = (n: Nakes) => {
  const { id, ...rest } = n;
  setForm(rest);  // rest has null fields → .trim() crashes on blur
};

// ✅ CORRECT — sanitize nulls to empty strings/0 before setting form
const openEdit = (n: Nakes) => {
  const { id, ...rest } = n;
  const sanitized: FormNakes = {} as FormNakes;
  for (const [k, v] of Object.entries(rest)) {
    sanitized[k as keyof FormNakes] = (v === null || v === undefined
      ? (typeof EMPTY_FORM[k as keyof FormNakes] === 'string' ? '' : 0)
      : v) as any;
  }
  setForm(sanitized);
};
```

**Rule: Any page that loads data from Supabase into a form must sanitize null values before setting form state.** String fields → `''`, numeric fields → `0`, boolean fields → `false`. The `EMPTY_FORM` constant provides the correct default type for each field.

---
