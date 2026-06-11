import { Pendapatan, JasaMedis, Indexing, HasilKalkulasi, ApprovalItem, Nakes, ActivityLog, Pembayaran } from './mockData';

// API Configuration — uses relative URL when frontend and API are on the same server (HF Spaces),
// or absolute URL with port 3100 for local development (separate Express API bridge)
const API_BASE_URL = localStorage.getItem('sim_remunerasi_api_url') || 
  (window.location.port === '5173' || window.location.port === '5174' 
    ? `http://${window.location.hostname}:3100`  // Local dev: separate API server
    : '');  // HF Spaces or production: same server, relative URLs

// Generic API fetch function with error handling
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data || data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Data fetching functions
export const dataService = {
  // Health check
  async checkHealth() {
    return apiFetch('/health');
  },

  // Export all data from database
  async exportAllData() {
    return apiFetch('/api/export');
  },

  // Import data to database
  async importData(data: any) {
    return apiFetch('/api/import', {
      method: 'POST',
      body: JSON.stringify({ mode: 'merge', data }),
    });
  },

  // Get sync logs
  async getSyncLogs() {
    return apiFetch('/api/sync-log');
  },

  // Get database stats
  async getDatabaseStats() {
    return apiFetch('/stats');
  },

  // Data getters with fallback to mock data
  async getPendapatan(): Promise<Pendapatan[]> {
    try {
      const data = await this.exportAllData();
      return data.pendapatan || [];
    } catch (error) {
      console.warn('Failed to fetch pendapatan from API, using mock data');
      return (await import('./mockData')).dataPendapatan;
    }
  },

  async getJasaMedis(): Promise<JasaMedis[]> {
    try {
      const data = await this.exportAllData();
      return data.jasaMedis || [];
    } catch (error) {
      console.warn('Failed to fetch jasa medis from API, using mock data');
      return (await import('./mockData')).dataJasa;
    }
  },

  async getIndexing(): Promise<Indexing[]> {
    try {
      const data = await this.exportAllData();
      return data.refIndexing || [];
    } catch (error) {
      console.warn('Failed to fetch indexing from API, using mock data');
      return (await import('./mockData')).dataIndexing;
    }
  },

  async getHasilKalkulasi(): Promise<HasilKalkulasi[]> {
    try {
      const data = await this.exportAllData();
      return data.hasilKalkulasi || [];
    } catch (error) {
      console.warn('Failed to fetch hasil kalkulasi from API, using mock data');
      return (await import('./mockData')).dataHasil;
    }
  },

  async getApproval(): Promise<ApprovalItem[]> {
    try {
      const data = await this.exportAllData();
      return data.approval || [];
    } catch (error) {
      console.warn('Failed to fetch approval from API, using mock data');
      return (await import('./mockData')).dataApproval;
    }
  },

  async getNakes(): Promise<Nakes[]> {
    try {
      const data = await this.exportAllData();
      return data.nakes || [];
    } catch (error) {
      console.warn('Failed to fetch nakes from API, using mock data');
      return (await import('./mockData')).dataNakes;
    }
  },

  async getActivityLog(): Promise<ActivityLog[]> {
    try {
      const data = await this.exportAllData();
      return data.activityLog || [];
    } catch (error) {
      console.warn('Failed to fetch activity log from API, using mock data');
      return (await import('./mockData')).dataActivityLog;
    }
  },

  async getPembayaran(): Promise<Pembayaran[]> {
    try {
      const data = await this.exportAllData();
      return data.pembayaran || [];
    } catch (error) {
      console.warn('Failed to fetch pembayaran from API, using mock data');
      return (await import('./mockData')).dataPembayaran;
    }
  },

  // Reference data
  async getUnits() {
    try {
      const data = await this.exportAllData();
      return data.refUnit || [];
    } catch (error) {
      console.warn('Failed to fetch units from API, using mock data');
      return (await import('./mockData')).daftarUnit.map((nama, index) => ({ id: index + 1, nama, kode: `UNIT-${index + 1}`, aktif: true }));
    }
  },

  async getJabatan() {
    try {
      const data = await this.exportAllData();
      return data.refJabatan || [];
    } catch (error) {
      console.warn('Failed to fetch jabatan from API, using mock data');
      return (await import('./mockData')).daftarJabatan.map((nama, index) => ({ id: index + 1, nama, kode: `JAB-${index + 1}`, aktif: true }));
    }
  },

  // Dashboard stats calculation
  async getDashboardStats() {
    try {
      const data = await this.exportAllData();
      
      // Calculate dashboard stats from real data
      const pendapatan = data.pendapatan || [];
      const jasaMedis = data.jasaMedis || [];
      const nakes = data.nakes || [];
      
      const totalPendapatanBulanIni = pendapatan
        .filter((p: any) => p.tanggal.startsWith('2026-01'))
        .reduce((sum: number, p: any) => sum + p.nilaiPendapatan, 0);
      
      const totalJasaDibayarkan = jasaMedis
        .filter((j: any) => j.status === 'paid')
        .reduce((sum: number, j: any) => sum + j.totalJasa, 0);
      
      const jumlahNakesAktif = nakes.filter((n: any) => n.statusAktif).length;
      
      const approvedPendapatan = pendapatan.filter((p: any) => p.status === 'approved').length;
      const totalPendapatan = pendapatan.length;
      const persentaseApproval = totalPendapatan > 0 ? (approvedPendapatan / totalPendapatan) * 100 : 0;
      
      return {
        totalPendapatanBulanIni,
        totalJasaDibayarkan,
        jumlahNakesAktif,
        persentaseApproval: Math.round(persentaseApproval),
        pertumbuhanPendapatan: 12.5, // Mock for now
        jumlahTransaksi: pendapatan.length + jasaMedis.length,
      };
    } catch (error) {
      console.warn('Failed to fetch dashboard stats from API, using mock data');
      return (await import('./mockData')).dashboardStats;
    }
  },

  // Chart data
  async getChartTrend() {
    try {
      const data = await this.exportAllData();
      // Mock chart data for now, could be calculated from real data
      return (await import('./mockData')).chartTrend;
    } catch (error) {
      console.warn('Failed to fetch chart trend from API, using mock data');
      return (await import('./mockData')).chartTrend;
    }
  },

  async getChartUnit() {
    try {
      const data = await this.exportAllData();
      // Mock chart data for now, could be calculated from real data
      return (await import('./mockData')).chartUnit;
    } catch (error) {
      console.warn('Failed to fetch chart unit from API, using mock data');
      return (await import('./mockData')).chartUnit;
    }
  },

  async getChartKomposisi() {
    try {
      const data = await this.exportAllData();
      // Mock chart data for now, could be calculated from real data
      return (await import('./mockData')).chartKomposisi;
    } catch (error) {
      console.warn('Failed to fetch chart komposisi from API, using mock data');
      return (await import('./mockData')).chartKomposisi;
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // CRUD: Save / Update / Delete (writes directly to database)
  // ═══════════════════════════════════════════════════════════════

  // ─── Pendapatan ───────────────────────────────────────────────
  async savePendapatan(item: any): Promise<any> {
    return apiFetch('/api/pendapatan', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async deletePendapatan(id: string): Promise<any> {
    return apiFetch(`/api/pendapatan/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // ─── Jasa Medis ───────────────────────────────────────────────
  async saveJasaMedis(item: any): Promise<any> {
    return apiFetch('/api/jasa-medis', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async deleteJasaMedis(id: string): Promise<any> {
    return apiFetch(`/api/jasa-medis/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // ─── Indexing ─────────────────────────────────────────────────
  async saveIndexing(item: any): Promise<any> {
    return apiFetch('/api/indexing', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async deleteIndexing(id: string): Promise<any> {
    return apiFetch(`/api/indexing/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // ─── Approval ─────────────────────────────────────────────────
  async updateApproval(item: any): Promise<any> {
    return apiFetch('/api/approval', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  // ─── Hasil Kalkulasi ──────────────────────────────────────────
  async updateHasilKalkulasi(item: any): Promise<any> {
    return apiFetch('/api/hasil-kalkulasi', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  // ─── Nakes ────────────────────────────────────────────────────
  async saveNakes(item: any): Promise<any> {
    return apiFetch('/api/nakes', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async deleteNakes(id: string): Promise<any> {
    return apiFetch(`/api/nakes/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async toggleNakesStatus(id: string): Promise<any> {
    return apiFetch(`/api/nakes/${encodeURIComponent(id)}/toggle-status`, { method: 'PATCH' });
  },

  // ─── User ─────────────────────────────────────────────────────
  async saveUser(item: any): Promise<any> {
    return apiFetch('/api/user', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async deleteUser(id: string): Promise<any> {
    return apiFetch(`/api/user/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // ─── Pembayaran ──────────────────────────────────────────────
  async savePembayaran(item: any): Promise<any> {
    return apiFetch('/api/pembayaran', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  // ─── Role ────────────────────────────────────────────────────
  async saveRole(item: any): Promise<any> {
    return apiFetch('/api/role', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async deleteRole(id: string): Promise<any> {
    return apiFetch(`/api/role/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

export default dataService;