import { useState, useEffect } from 'react';
import { Database, Download, Upload, RefreshCw, AlertCircle, CheckCircle, X, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface SyncLogEntry {
  id: number;
  sync_type: string;
  direction: string;
  status: string;
  records_count: number;
  error_message?: string;
  started_at: string;
  completed_at: string;
  performed_by: string;
}

interface DatabaseStats {
  tables: Record<string, string>;
  views: string[];
}

interface HealthCheckResult {
  ok: boolean;
  version?: string;
  database?: string;
  error?: string;
}

export default function NetworkDatabase() {
  const { 
    showToast, setActivePage, 
    isSyncing, setIsSyncing, 
    lastSync, setLastSync, 
    syncStatus, setSyncStatus 
  } = useApp();
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'connect' | 'sync' | 'backup' | 'log'>('connect');
  
  // State untuk connection
  const [apiUrl, setApiUrl] = useState(
    window.location.port === '5173' || window.location.port === '5174'
      ? `http://${window.location.hostname}:7860`
      : ''  // Same server on HF Spaces
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [healthInfo, setHealthInfo] = useState<HealthCheckResult | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);

  // State untuk sync
  const [syncDirection, setSyncDirection] = useState<'pull' | 'push'>('pull');
  const [syncResult, setSyncResult] = useState<{ success: boolean; message?: string; details?: any } | null>(null);

  // State untuk backup
  const [backupData, setBackupData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // State untuk log
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // ─── Connect to API ────────────────────────────────────────────
  const checkConnection = async () => {
    setSyncStatus('connecting');
    setIsConnecting(true);
    try {
      const response = await fetch(`${apiUrl}/health`);
      const data: HealthCheckResult = await response.json();
      
      if (data.ok) {
        setIsConnected(true);
        setHealthInfo(data);
        setSyncStatus('success');
        showToast('success', 'Terhubung ke database', `Database: ${data.database}`);
        // Auto-load stats
        loadDatabaseStats();
        // Auto-load sync logs
        loadSyncLogs();
      } else {
        setIsConnected(false);
        setHealthInfo({ ...data, error: data.error || 'Connection failed' });
        setSyncStatus('error');
        showToast('error', 'Koneksi gagal', data.error);
      }
    } catch (error) {
      setIsConnected(false);
      setHealthInfo({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
      setSyncStatus('error');
      showToast('error', 'Tidak dapat terhubung', 'Pastikan API server berjalan di port 7860');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/stats`);
      const result = await response.json();
      if (result.ok && result.data) {
        // HF server returns { ok, data: { totalPendapatan, ... } } — adapt to DatabaseStats
        const statsData = result.data;
        const tables: Record<string, string> = {};
        for (const [key, val] of Object.entries(statsData)) {
          if (typeof val === 'number') tables[key] = String(val);
        }
        setDbStats({ tables, views: [] });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSyncLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await fetch(`${apiUrl}/api/sync-log`);
      const data = await response.json();
      if (data.ok) {
        setSyncLogs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load sync logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // ─── Sync operations ───────────────────────────────────────────
  const performSync = async (direction: 'pull' | 'push') => {
    setSyncStatus('syncing');
    setIsSyncing(true);
    setSyncDirection(direction);
    setSyncResult(null);

    try {
      if (direction === 'pull') {
        // Pull data from server
        const response = await fetch(`${apiUrl}/api/export`);
        const data = await response.json();
        
        if (data.ok) {
          // Simulate import to localStorage
          localStorage.setItem('sim_remunerasi_db_backup', JSON.stringify(data.data));
          setBackupData(data.data);
          setSyncResult({
            success: true,
            message: `Berhasil mengimpor ${Object.keys(data.data).length} tabel dari database`,
            details: data.data
          });
          setSyncStatus('success');
          setLastSync(new Date().toISOString());
          showToast('success', 'Sync berhasil', 'Data berhasil diambil dari database');
          // Refresh current page
          window.location.reload();
        } else {
          setSyncResult({ success: false, message: data.error });
          setSyncStatus('error');
          showToast('error', 'Sync gagal', data.error);
        }
      } else {
        // Push data to server
        const backup = localStorage.getItem('sim_remunerasi_db_backup');
        if (!backup) {
          setSyncResult({ success: false, message: 'Tidak ada data untuk di-push' });
          showToast('error', 'Tidak ada data', 'Lakukan sync terlebih dahulu');
          return;
        }

        const data = JSON.parse(backup);
        const response = await fetch(`${apiUrl}/api/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'merge', data })
        });

        const result = await response.json();
        if (result.ok) {
          setSyncResult({
            success: true,
            message: `Berhasil mengunggah ${result.recordsUpserted} record ke database`,
            details: result
          });
          setSyncStatus('success');
          setLastSync(new Date().toISOString());
          showToast('success', 'Sync berhasil', `Data berhasil diunggah (${result.recordsUpserted} record)`);
          // Reload sync logs
          loadSyncLogs();
        } else {
          setSyncResult({ success: false, message: result.error });
          showToast('error', 'Sync gagal', result.error);
        }
      }
    } catch (error) {
      setSyncResult({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
      setSyncStatus('error');
      showToast('error', 'Sync gagal', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── Backup operations ────────────────────────────────────────
  const exportBackup = () => {
    const backup = localStorage.getItem('sim_remunerasi_db_backup');
    if (!backup) {
      showToast('warning', 'Tidak ada data', 'Lakukan sync terlebih dahulu');
      return;
    }

    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simremunerasi_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'Backup berhasil', 'File unduhan dimulai');
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        localStorage.setItem('sim_remunerasi_db_backup', JSON.stringify(data));
        setBackupData(data);
        showToast('success', 'Backup berhasil', 'Data berhasil diimpor');
      } catch (error) {
        showToast('error', 'Gagal import', 'Format file tidak valid');
      }
    };
    reader.readAsText(file);
  };

  // ─── Initialize ────────────────────────────────────────────────
  useEffect(() => {
    // Auto-check connection on mount
    checkConnection();
  }, []);

  // ─── UI: Connection Status ─────────────────────────────────────
  const renderConnectionStatus = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          isConnected ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {isConnected ? <CheckCircle className="w-6 h-6" /> : <X className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="font-semibold text-lg">Status Koneksi</h3>
          <p className="text-sm text-gray-500">
            {isConnected ? 'Terhubung ke API Bridge' : 'Tidak terhubung'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-500" />
          <input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="API URL"
          />
        </div>
        
        <button
          onClick={checkConnection}
          disabled={isConnecting}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isConnecting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Database className="w-4 h-4" />
          )}
          {isConnecting ? 'Menghubungkan...' : 'Cek Koneksi'}
        </button>
      </div>

      {healthInfo && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm">
          {healthInfo.ok ? (
            <div className="text-green-700">
              <p><strong>Database:</strong> {healthInfo.database}</p>
              <p><strong>Server:</strong> {healthInfo.database || 'Supabase PostgreSQL via Express'}</p>
              <p className="text-xs mt-1 text-gray-500">API Bridge berjalan normal</p>
            </div>
          ) : (
            <div className="text-red-700">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {healthInfo.error}
            </div>
          )}
        </div>
      )}

      {dbStats && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="font-semibold text-sm mb-2">Statistik Database</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(dbStats.tables).map(([key, val]) => (
              <div key={key}>{key}: {val}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── UI: Sync Operations ───────────────────────────────────────
  const renderSyncOperations = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Sinkronisasi Data</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Pull Database
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Ambil data dari database ke aplikasi
          </p>
          <button
            onClick={() => performSync('pull')}
            disabled={isSyncing || !isConnected}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSyncing && syncDirection === 'pull' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Pull Database
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Push Database
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Simpan data aplikasi ke database
          </p>
          <button
            onClick={() => performSync('push')}
            disabled={isSyncing || !isConnected}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSyncing && syncDirection === 'push' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Push Database
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={`p-3 rounded-md ${
          syncResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {syncResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div>
              <p className="font-medium text-sm">{syncResult.message}</p>
              {syncResult.details && (
                <p className="text-xs text-gray-600 mt-1">
                  {syncResult.details.recordsUpserted && `Records: ${syncResult.details.recordsUpserted}`}
                  {syncResult.details.errors && `Errors: ${syncResult.details.errors.length}`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── UI: Backup/Restore ────────────────────────────────────────
  const renderBackupOperations = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
      <h3 className="font-semibold text-lg mb-4">Backup & Restore</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Backup
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Download data aplikasi sebagai file JSON
          </p>
          <button
            onClick={exportBackup}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Backup
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Backup
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Upload file backup untuk memulihkan data
          </p>
          <input
            type="file"
            accept=".json"
            onChange={importBackup}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
        </div>
      </div>

      {backupData && (
        <div className="mt-4 p-3 bg-green-50 rounded-md">
          <p className="text-sm text-green-700">
            Backup tersedia ({Object.keys(backupData).length} tabel)
          </p>
        </div>
      )}
    </div>
  );

  // ─── UI: Sync Log ──────────────────────────────────────────────
  const renderSyncLogs = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Riwayat Sync</h3>
        <button
          onClick={loadSyncLogs}
          disabled={isLoadingLogs}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
          Muat ulang
        </button>
      </div>

      {isLoadingLogs ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Memuat log...</span>
        </div>
      ) : syncLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Belum ada riwayat sync</p>
        </div>
      ) : (
        <div className="space-y-2">
          {syncLogs.slice(0, 10).map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-md p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {log.sync_type} - {log.direction}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(log.started_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.status}
                  </span>
                  {log.records_count && (
                    <span className="text-xs text-gray-500">
                      {log.records_count} records
                    </span>
                  )}
                </div>
              </div>
              {log.error_message && (
                <p className="text-xs text-red-600 mt-2">{log.error_message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Network Database</h1>
        <p className="text-gray-600">
          Kelola sinkronisasi data antara aplikasi dan database SQL Server
        </p>
        
        {/* Status Sync */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              syncStatus === 'success' ? 'bg-green-500' :
              syncStatus === 'error' ? 'bg-red-500' :
              syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
              syncStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span>
              {syncStatus === 'success' ? 'Terhubung' :
               syncStatus === 'error' ? 'Koneksi Gagal' :
               syncStatus === 'syncing' ? 'Mensinkronkan...' :
               syncStatus === 'connecting' ? 'Menghubungkan...' : 'Belum terhubung'}
            </span>
          </div>
          {lastSync && (
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Terakhir sync: {new Date(lastSync).toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'connect', label: 'Koneksi', icon: Database },
            { id: 'sync', label: 'Sinkronisasi', icon: RefreshCw },
            { id: 'backup', label: 'Backup', icon: Download },
            { id: 'log', label: 'Riwayat', icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'connect' && renderConnectionStatus()}
        {activeTab === 'sync' && renderSyncOperations()}
        {activeTab === 'backup' && renderBackupOperations()}
        {activeTab === 'log' && renderSyncLogs()}
      </div>
    </div>
  );
}