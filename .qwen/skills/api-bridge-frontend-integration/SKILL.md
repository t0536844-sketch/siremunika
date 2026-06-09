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

## Common pitfalls

- **`ERR_FAILED` with 200 status**: Usually means the API bridge server is not running. Always start `node server.js` in the `api-bridge/` directory before testing.
- **FK name resolution failures**: If the frontend sends `"Poli Umum"` as `unit` but that name doesn't exist in `ref_unit`, the server returns 400 with `Cannot resolve unit='...'`. Make sure reference data is seeded.
- **`SCOPE_IDENTITY()` for auto‑increment**: New nakes/user records use `INSERT …; SELECT SCOPE_IDENTITY() AS newId` — the response includes the generated ID for the frontend to track.
- **Frontend field names are camelCase**: The server endpoints accept camelCase (`jenisPelayanan`, `nilaiPendapatan`, `statusAktif`) and internally resolve to snake_case columns (`jenis_pelayanan_id`, `nilai_pendapatan`, `status_aktif`). This mirrors the view‑based export asymmetry documented in the architecture memory.

---
