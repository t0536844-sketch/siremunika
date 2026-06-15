import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  PlusCircle,
  Download,
  Edit3,
  Trash2,
  LogIn,
  Settings as SettingsIcon,
  FileSpreadsheet,
  FileText,
  User,
} from 'lucide-react';
import { dataActivityLog } from '../data/mockData';
import dataService from '../data/dataService';
import { useApp } from '../context/AppContext';
import { exportToExcel } from '../utils/exporters';
import type { ActivityLog } from '../data/mockData';

const iconMap: Record<string, any> = {
  check: CheckCircle2,
  plus: PlusCircle,
  download: Download,
  edit: Edit3,
  trash: Trash2,
  login: LogIn,
  settings: SettingsIcon,
  clock: Clock,
};

const colorMap: Record<string, string> = {
  check: 'bg-emerald-100 text-emerald-700',
  plus: 'bg-teal-100 text-teal-700',
  download: 'bg-sky-100 text-sky-700',
  edit: 'bg-amber-100 text-amber-700',
  trash: 'bg-rose-100 text-rose-700',
  login: 'bg-indigo-100 text-indigo-700',
  settings: 'bg-slate-100 text-slate-700',
  clock: 'bg-purple-100 text-purple-700',
};

export default function ActivityLogPage() {
  const { showToast } = useApp();
  const [items, setItems] = useState<ActivityLog[]>([]);

  useEffect(() => {
    dataService.getActivityLog().then((data) => {
      if (data && data.length > 0) setItems(data);
    }).catch(() => {
      setItems(dataActivityLog);
      showToast('warning', 'Data dimuat dari lokal', 'Gagal mengambil data dari database, data tersimpan di aplikasi');
    });
  }, []);

  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('Semua');
  const [filterUser, setFilterUser] = useState('Semua');

  const modules = Array.from(new Set(items.map((i) => i.module)));
  const users = Array.from(new Set(items.map((i) => i.user)));

  const filtered = items.filter(
    (i) =>
      (filterModule === 'Semua' || i.module === filterModule) &&
      (filterUser === 'Semua' || i.user === filterUser) &&
      ((i.detail || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.target || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.action || '').toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport = () => {
    exportToExcel(
      'Activity_Log',
      'Activity Log',
      [
        { header: 'Waktu', key: 'timestamp', width: 22 },
        { header: 'Pengguna', key: 'user', width: 22 },
        { header: 'Aksi', key: 'action', width: 18 },
        { header: 'Target', key: 'target', width: 22 },
        { header: 'Detail', key: 'detail', width: 40 },
        { header: 'Modul', key: 'module', width: 18 },
      ],
      filtered,
      { title: 'ACTIVITY LOG SISTEM', subtitle: `${filtered.length} aktivitas tercatat` }
    );
    showToast('success', 'Activity Log diekspor', `${filtered.length} baris log disimpan`);
  };

  return (
    <div className="p-6 space-y-5 bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="relative">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">Activity Log Sistem</h2>
              <p className="text-indigo-100 text-sm mt-1 max-w-2xl">
                Catatan lengkap seluruh aktivitas pengguna dalam sistem SIM Remunerasi.
                Gunakan log ini untuk audit dan monitoring keamanan.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{items.length}</p>
              <p className="text-[10px] text-indigo-100">aktivitas tercatat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Penyetujuan', count: items.filter((i) => i.icon === 'check').length, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Penambahan', count: items.filter((i) => i.icon === 'plus').length, color: 'from-teal-500 to-teal-600' },
          { label: 'Perubahan', count: items.filter((i) => i.icon === 'edit').length, color: 'from-amber-500 to-amber-600' },
          { label: 'Penghapusan', count: items.filter((i) => i.icon === 'trash').length, color: 'from-rose-500 to-rose-600' },
          { label: 'Export', count: items.filter((i) => i.icon === 'download').length, color: 'from-sky-500 to-sky-600' },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-4 shadow-md`}>
            <p className="text-xs opacity-90">{s.label}</p>
            <p className="text-2xl font-bold">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[130px]"
          >
            <option>Semua</option>
            {modules.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <User className="w-4 h-4 text-slate-500" />
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="bg-transparent text-sm focus:outline-none min-w-[180px]"
          >
            <option>Semua</option>
            {users.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aktivitas..."
            className="bg-transparent text-sm focus:outline-none w-full"
          />
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Log
        </button>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="relative max-h-[70vh] overflow-y-auto">
          <div className="absolute left-[84px] top-0 bottom-0 w-px bg-slate-200 hidden md:block" />
          {filtered.map((log, idx) => {
            const Icon = iconMap[log.icon] || Clock;
            const color = colorMap[log.icon] || 'bg-slate-100 text-slate-700';
            return (
              <div key={log.id} className={`flex items-start gap-4 p-5 ${idx > 0 ? 'border-t border-slate-100' : ''} hover:bg-slate-50 transition`}>
                <div className="text-right flex-shrink-0 w-[60px]">
                  <p className="text-xs font-semibold text-slate-700">{log.timestamp.split(' ')[0]}</p>
                  <p className="text-[10px] text-slate-400">{log.timestamp.split(' ')[1]}</p>
                </div>
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0 shadow-sm z-10`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                    <span className="text-[10px] bg-slate-100 text-slate-700 rounded-full px-2 py-0.5 font-semibold">
                      {log.module}
                    </span>
                    <span className="text-[10px] font-mono text-teal-700">{log.target}</span>
                  </div>
                  <p className="text-sm text-slate-600">{log.detail}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Oleh <span className="font-semibold text-slate-600">{log.user}</span>
                  </p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              Tidak ada log aktivitas dengan filter tersebut
            </div>
          )}
        </div>
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Menampilkan <b>{filtered.length}</b> dari <b>{items.length}</b> aktivitas
          </span>
          <span>Log diupdate otomatis setiap 5 menit</span>
        </div>
      </div>
    </div>
  );
}
