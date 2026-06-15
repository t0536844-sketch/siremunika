import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Wallet,
  Users,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Stethoscope,
  Building,
  Clock,
  DollarSign,
  HandCoins,
  UserCheck,
  Target,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import dataService, { dataService as dataServiceInstance } from '../data/dataService';
import { dashboardStats, dataPendapatan, dataJasa, chartTrend, chartUnit, chartKomposisi } from '../data/mockData';
import { formatRupiah, formatNumber, statusColors, statusLabel } from '../utils/helpers';
import { exportToExcel } from '../utils/exporters';
import { useApp } from '../context/AppContext';

const COLORS = ['#0f766e', '#0891b2', '#0d9488', '#10b981', '#f59e0b', '#ef4444'];

const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  trendValue,
  trendUp = true,
  color,
  subtitle,
  onClick,
}: {
  label: string;
  value: string;
  icon: any;
  trend?: string;
  trendValue?: string;
  trendUp?: boolean;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}) => (
          <div
    className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-600 transition-all group cursor-${onClick ? 'pointer' : 'default'} relative overflow-hidden`}
    onClick={onClick}
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity -mr-8 -mt-8 rounded-full" />
    <div className="flex items-start justify-between mb-3 relative">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} shadow-sm`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
            trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
          {trendValue && <span className="opacity-70 ml-0.5">({trendValue})</span>}
        </div>
      )}
    </div>
    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">{label}</p>
    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{value}</p>
    {subtitle && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">{subtitle}</p>}
  </div>
);

export default function Dashboard() {
  const { showToast, setActivePage, settings } = useApp();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [stats, pendapatan, chartData] = await Promise.all([
          dataService.getDashboardStats(),
          dataService.getPendapatan(),
          dataService.getChartTrend()
        ]);
        
        setDashboardData({
          stats,
          pendapatan,
          chartTrend: chartData,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showToast('error', 'Gagal memuat data dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [showToast]);

  // Use mock data as fallback while loading or if API fails
  const currentStats = dashboardData?.stats || dashboardStats;
  const currentPendapatan = dashboardData?.pendapatan || dataPendapatan;
  const currentChartTrend = dashboardData?.chartTrend || chartTrend;

  const handleExportSummary = () => {
    const summary = [
      { metric: 'Total Pendapatan (Bulan Ini)', nilai: currentStats.totalPendapatanBulanIni },
      { metric: 'Total Jasa Dibayarkan', nilai: currentStats.totalJasaDibayarkan },
      { metric: 'Jumlah Nakes Aktif', nilai: currentStats.jumlahNakesAktif },
      { metric: 'Persentase Approval', nilai: currentStats.persentaseApproval },
      { metric: 'Pertumbuhan Pendapatan', nilai: currentStats.pertumbuhanPendapatan },
      { metric: 'Jumlah Transaksi', nilai: currentStats.jumlahTransaksi },
    ];
    exportToExcel(
      'Ringkasan_Dashboard',
      'Dashboard',
      [
        { header: 'Metrik', key: 'metric', width: 32 },
        { header: 'Nilai', key: 'nilai', format: 'number' as const, width: 22 },
      ],
      summary,
      { title: 'RINGKASAN DASHBOARD RSUD MIMIKA', subtitle: `Periode: ${settings.periode}` }
    );
    showToast('success', 'Ringkasan diekspor ke Excel');
  };

  // (Data komposisi chart dikelola inline di dalam komponen chart)

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-950">
      {/* Hero Banner - Professional Gradient */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute right-20 bottom-0 w-64 h-64 bg-white/5 rounded-full -mb-32" />
        <div className="absolute left-0 top-1/2 w-2 bg-gradient-to-b from-transparent via-amber-400 to-transparent h-24 -translate-y-1/2" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[10px] font-semibold tracking-wide">WELCOME BACK</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-2 tracking-tight">
              Selamat Datang di SIM Remunerasi 👋
            </h2>
            <p className="text-teal-50/90 text-sm lg:text-base max-w-2xl leading-relaxed">
              Sistem Informasi Manajemen Remunerasi terintegrasi untuk {settings.namaRS}.
              Kelola pendapatan, jasa medis, indexing, dan distribusi remunerasi dengan transparan dan akuntabel.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm border border-white/10">
                <Building className="w-4 h-4 text-teal-100" />
                <span>12 Unit Layanan</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm border border-white/10">
                <Stethoscope className="w-4 h-4 text-teal-100" />
                <span>{formatNumber(currentStats.jumlahNakesAktif)} Nakes Aktif</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 text-sm border border-white/10">
                <Clock className="w-4 h-4 text-teal-100" />
                <span>Periode: {settings.periode}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <div className="flex flex-col items-start lg:items-end bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 min-w-[240px]">
              <p className="text-xs text-teal-100 mb-1">Total Pendapatan</p>
              <p className="text-3xl lg:text-4xl font-bold tracking-tight">
                {formatRupiah(dashboardStats.totalPendapatanBulanIni)}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  <ArrowUpRight className="w-3 h-3" />
                  +{dashboardStats.pertumbuhanPendapatan}%
                </span>
                <span className="text-teal-100/70">vs bulan lalu</span>
              </div>
            </div>
            <button
              onClick={handleExportSummary}
              className="flex items-center gap-2 px-5 py-3 bg-white text-teal-700 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Ringkasan
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Input Pendapatan', page: 'pendapatan', icon: Wallet, iconBg: 'bg-teal-100 text-teal-700' },
          { label: 'Input Jasa Medis', page: 'jasa', icon: Stethoscope, iconBg: 'bg-cyan-100 text-cyan-700' },
          { label: 'Kalkulator', page: 'kalkulasi', icon: Target, iconBg: 'bg-amber-100 text-amber-700' },
          { label: 'Approval', page: 'approval', icon: CheckCircle2, iconBg: 'bg-rose-100 text-rose-700' },
          { label: 'Output Pembayaran', page: 'pembayaran', icon: Activity, iconBg: 'bg-emerald-100 text-emerald-700' },
        ].map((qa) => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.page}
              onClick={() => setActivePage(qa.page)}
              className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left flex items-center gap-3 transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 group`}
            >
              <div className={`w-11 h-11 rounded-xl ${qa.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{qa.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 mt-0.5">
                  Buka halaman <ChevronRight className="w-3 h-3" />
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Pendapatan"
          value={formatRupiah(currentStats.totalPendapatanBulanIni)}
          icon={DollarSign}
          trend="+12.5%"
          trendValue="vs Juli"
          color="bg-teal-100 text-teal-700"
          subtitle={`${formatNumber(dashboardStats.jumlahTransaksi)} transaksi`}
          onClick={() => setActivePage('pendapatan')}
        />
        <StatCard
          label="Total Jasa Dibayarkan"
          value={formatRupiah(currentStats.totalJasaDibayarkan)}
          icon={HandCoins}
          trend="+8.3%"
          trendValue="vs Juli"
          color="bg-cyan-100 text-cyan-700"
          subtitle="Distribusi jasa medis"
          onClick={() => setActivePage('jasa')}
        />
        <StatCard
          label="Jumlah Nakes Aktif"
          value={formatNumber(currentStats.jumlahNakesAktif)}
          icon={UserCheck}
          trend="+2.1%"
          trendValue="Nakes baru"
          color="bg-amber-100 text-amber-700"
          subtitle="Tenaga kesehatan terdaftar"
          onClick={() => setActivePage('nakes')}
        />
        <StatCard
          label="Tingkat Approval"
          value={`${currentStats.persentaseApproval}%`}
          icon={CheckCircle2}
          trend="+5.8%"
          trendValue="Efisiensi"
          color="bg-emerald-100 text-emerald-700"
          subtitle="Proses approval berjalan"
          onClick={() => setActivePage('approval')}
        />
        <StatCard
          label="Pembayaran Cair"
          value={formatRupiah(692650000)}
          icon={Activity}
          trend="+15.2%"
          trendValue="On-time"
          color="bg-green-100 text-green-700"
          subtitle="4 dari 10 nakes dibayar"
          onClick={() => setActivePage('pembayaran')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart - Area Chart Professional */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Trend Pendapatan & Jasa (7 Bulan)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Perkembangan bulanan dalam jutaan Rupiah</p>
            </div>
            <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              Growth +12.5%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={currentChartTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorJasa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v) => `${(v / 1000000000).toFixed(1)}M`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any) => formatRupiah(Number(value))}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} iconType="circle" />
              <Area
                type="monotone"
                dataKey="pendapatan"
                stroke="#0f766e"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPendapatan)"
                name="Pendapatan"
                dot={{ r: 4, fill: '#0f766e', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="jasa"
                stroke="#0891b2"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorJasa)"
                name="Jasa Medis"
                dot={{ r: 4, fill: '#0891b2', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Komposisi Biaya */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Komposisi Biaya</h3>
              <p className="text-xs text-slate-500 mt-0.5">Distribusi periode ini</p>
            </div>
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartKomposisi}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                dataKey="value"
                paddingAngle={3}
              >
                {chartKomposisi.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => `${value}%`}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {chartKomposisi.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-xs group hover:bg-slate-50 rounded-lg p-1.5 transition-colors cursor-pointer">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[idx] }}
                ></span>
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="text-slate-800 font-bold ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar Chart Horizontal - Professional */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Top 5 Unit Berdasarkan Pendapatan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pendapatan per unit dalam juta Rupiah</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartUnit} layout="vertical" margin={{ top: 5, right: 30, left: 110, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="unit"
                width={110}
                tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any) => [`${formatNumber(Number(value))} Jt`, 'Pendapatan']}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
              />
              <Bar
                dataKey="nilai"
                fill="#0d9488"
                radius={[0, 6, 6, 0]}
                barSize={28}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity with trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Pendapatan Terbaru</h3>
              <p className="text-xs text-slate-500 mt-0.5">Transaksi hari ini</p>
            </div>
            <button
              onClick={() => setActivePage('pendapatan')}
              className="text-[10px] font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-0.5"
            >
              Lihat semua <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5 max-h-[320px] overflow-auto pr-1">
            {currentPendapatan.slice(0, 6).map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/40 transition-all cursor-pointer group"
                onClick={() => setActivePage('pendapatan')}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.unit}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">
                    {item.jenisPelayanan} · {formatNumber(item.jumlahPasien)} pasien
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-teal-700">{formatRupiah(item.nilaiPendapatan)}</p>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${statusColors[item.status || 'pending']}`}
                  >
                    {statusLabel[item.status || 'pending']}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Pembayaran Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Status Pembayaran Periode {settings.periode}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Workflow pembayaran dari Draft hingga Dibayar</p>
          </div>
          <button
            onClick={() => setActivePage('pembayaran')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            Kelola Pembayaran
          </button>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            { status: 'Draft', count: 1, color: 'from-slate-400 to-slate-500', bgColor: 'bg-slate-50', textColor: 'text-slate-700', borderColor: 'border-slate-200' },
            { status: 'Final', count: 2, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
            { status: 'Disetujui', count: 2, color: 'from-yellow-500 to-yellow-600', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
            { status: 'Dibayar', count: 4, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
            { status: 'Dibatalkan', count: 1, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
          ].map((item, idx, arr) => (
            <div key={item.status} className="relative">
              <div className={`${item.bgColor} ${item.borderColor} border rounded-xl p-4 text-center hover:shadow-md transition`}>
                <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-lg shadow-md mb-2`}>
                  {item.count}
                </div>
                <p className={`text-xs font-bold ${item.textColor} mb-1`}>{item.status}</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                  <div className={`bg-gradient-to-r ${item.color} h-1.5 rounded-full`} style={{ width: `${(item.count / 10) * 100}%` }}></div>
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Jasa Medis Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Top Nakes Berdasarkan Jasa Medis</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribusi jasa per tenaga kesehatan periode {settings.periode}</p>
          </div>
          <button
            onClick={() => setActivePage('jasa')}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            Kelola Data Jasa
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase">
                <th className="px-6 py-3 text-left font-bold">Peringkat</th>
                <th className="px-6 py-3 text-left font-bold">Nakes</th>
                <th className="px-6 py-3 text-left font-bold">Jabatan</th>
                <th className="px-6 py-3 text-left font-bold">Unit</th>
                <th className="px-6 py-3 text-right font-bold">Tindakan</th>
                <th className="px-6 py-3 text-right font-bold">Total Jasa</th>
                <th className="px-6 py-3 text-center font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {dataJasa
                .slice()
                .sort((a, b) => b.totalJasa - a.totalJasa)
                .slice(0, 5)
                .map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 hover:bg-teal-50/40 transition-colors cursor-pointer"
                    onClick={() => setActivePage('nakes')}
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                          idx === 0
                            ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md'
                            : idx === 1
                            ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                            : idx === 2
                            ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{item.nakes}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{item.jabatan}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{item.unit}</td>
                    <td className="px-6 py-4 text-right text-slate-600 text-xs">{formatNumber(item.jumlahTindakan)}</td>
                    <td className="px-6 py-4 text-right font-bold text-teal-700">{formatRupiah(item.totalJasa)}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${statusColors[item.status || 'pending']}`}
                      >
                        {statusLabel[item.status || 'pending']}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
