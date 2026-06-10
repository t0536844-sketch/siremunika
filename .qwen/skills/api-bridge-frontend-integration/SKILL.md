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

SQLite column names in SELECT queries must produce **camelCase** keys matching the frontend TypeScript interfaces. If the table uses camelCase column names directly (like `kodeIndex`, `namaIndex`), the SELECT can use them directly. If the table uses snake_case, you must alias:

```javascript
// WRONG — returns snake_case keys the frontend doesn't recognize
refIndexing: queryAll('SELECT * FROM indexing'),  // returns { kode_index, nama_index }

// CORRECT — returns camelCase keys matching frontend Indexing interface
refIndexing: queryAll('SELECT id, kodeIndex, namaIndex, bobot, kategori, keterangan, aktif FROM indexing'),
```

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

---
