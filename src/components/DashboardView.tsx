import React, { useMemo, useState } from 'react';
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
} from 'recharts';
import { PlusCircle, ArrowRight, FileText, MessageSquareShare } from 'lucide-react';
import { Incident, MenuKey } from '../types/bpbd';
import { computeMetrics, NullableAggregate, sortIncidentsNewest } from '../utils/aggregations';
import { formatAngka, formatHektare, formatTanggalSingkat, getTodayIsoDate } from '../utils/formatters';
import { StatusLabel } from './StatusText';

interface DashboardViewProps {
  incidents: Incident[];
  dataLoading: boolean;
  onNavigate: (menu: MenuKey) => void;
  onInspectIncident: (incident: Incident) => void;
}

function renderAggValue(agg: NullableAggregate, unit = ''): string {
  if (!agg.hasKnown) return 'Belum tersedia';
  return `${formatAngka(agg.total)}${unit ? ` ${unit}` : ''}`;
}

export function DashboardView({
  incidents,
  dataLoading,
  onNavigate,
  onInspectIncident,
}: DashboardViewProps) {
  const currentYear = Number.parseInt(getTodayIsoDate().slice(0, 4), 10);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const availableYears = useMemo(() => {
    const yrs = new Set<number>([currentYear]);
    for (const i of incidents) {
      const y = Number.parseInt(i.identitas.tanggalKejadian.slice(0, 4), 10);
      if (!Number.isNaN(y)) yrs.add(y);
    }
    return Array.from(yrs).sort((a, b) => b - a);
  }, [incidents, currentYear]);

  const metrics = useMemo(
    () => computeMetrics(incidents, selectedYear),
    [incidents, selectedYear]
  );

  const recentIncidents = useMemo(
    () => sortIncidentsNewest(incidents).slice(0, 6),
    [incidents]
  );

  const kecamatanChartData = useMemo(
    () => metrics.byKecamatan.filter((k) => k.count > 0),
    [metrics.byKecamatan]
  );

  if (dataLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-24 bg-white border border-neutral-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-white border border-neutral-200 rounded-xl animate-pulse" />
          <div className="h-72 bg-white border border-neutral-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-5">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-neutral-900">
            Ringkasan Operasional Kebencanaan Kota Palembang
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Seluruh angka dihitung otomatis dari database kejadian Pusdalops-PB BPBD Kota Palembang.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('input')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Input Kejadian Baru
          </button>
          <button
            type="button"
            onClick={() => onNavigate('whatsapp')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MessageSquareShare className="w-4 h-4" />
            Status WhatsApp
          </button>
        </div>
      </div>

      {/* Empty state banner when zero records exist */}
      {incidents.length === 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center">
          <FileText className="w-10 h-10 text-[#EA580C] mx-auto mb-3" />
          <h2 className="text-base font-bold text-neutral-900">
            Belum Ada Data Kejadian Bencana Tersimpan
          </h2>
          <p className="text-sm text-neutral-600 max-w-md mx-auto mt-1 mb-5">
            Database Firestore terhubung dan siap digunakan. Silakan masukkan laporan kejadian
            pertama melalui formulir Input Data Kejadian.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('input')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Input Kejadian Pertama
          </button>
        </div>
      )}

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-500">Total Kejadian</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1">
            {formatAngka(metrics.totalKejadian)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Seluruh periode</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-500">Kejadian Hari Ini</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#EA580C] mt-1">
            {formatAngka(metrics.kejadianHariIni)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">{formatTanggalSingkat(getTodayIsoDate())}</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-500">Kejadian Bulan Ini</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1">
            {formatAngka(metrics.kejadianBulanIni)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Bulan berjalan</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-500">Selesai Ditangani</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {formatAngka(metrics.selesaiCount)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Status tuntas</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-500">Dalam Penanganan</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#C2410C] mt-1">
            {formatAngka(metrics.dalamPenangananCount)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Monitoring: {formatAngka(metrics.monitoringCount)}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs font-medium text-neutral-500">Luas Lahan Terbakar</div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900 mt-1">
            {metrics.luasLahanTerbakarHa.hasKnown
              ? formatHektare(metrics.luasLahanTerbakarHa.total)
              : 'Belum tersedia'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Karhutla &amp; Lahan</div>
        </div>
      </div>

      {/* Victim Metrics Strip */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-bold text-neutral-900">
            Rekapitulasi Dampak Korban Jiwa &amp; Pengungsi
          </h2>
          <span className="text-xs text-neutral-500">
            Nilai 0 menandakan nihil korban; data kosong tidak dihitung sebagai nol.
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div className="border-t border-neutral-100 pt-3">
            <div className="text-xs text-neutral-500">Korban Meninggal Dunia</div>
            <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-1">
              {renderAggValue(metrics.meninggal, 'jiwa')}
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-3">
            <div className="text-xs text-neutral-500">Korban Luka-Luka</div>
            <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-1">
              {renderAggValue(metrics.lukaLuka, 'jiwa')}
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-3">
            <div className="text-xs text-neutral-500">Korban Terdampak</div>
            <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-1">
              {renderAggValue(metrics.terdampakJiwa, 'jiwa')}
            </div>
          </div>
          <div className="border-t border-neutral-100 pt-3">
            <div className="text-xs text-neutral-500">Total Pengungsi</div>
            <div className="text-lg font-bold font-mono tabular-nums text-neutral-900 mt-1">
              {renderAggValue(metrics.mengungsi, 'jiwa')}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid: 4 Mandatory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Kejadian Berdasarkan Bulan */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Grafik Kejadian Berdasarkan Bulan
              </h3>
              <p className="text-xs text-neutral-500">Distribusi laporan bulanan</p>
            </div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-mono border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white text-neutral-900"
              aria-label="Pilih tahun grafik bulanan"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.byBulan} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#4B5563' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4B5563' }} />
                <Tooltip
                  formatter={(value) => [`${value ?? 0} kejadian`, 'Jumlah']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E5E7EB' }}
                />
                <Bar dataKey="count" fill="#EA580C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Kejadian Berdasarkan Jenis Bencana */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Grafik Kejadian Berdasarkan Jenis Bencana
            </h3>
            <p className="text-xs text-neutral-500">
              {metrics.byJenis.length > 0
                ? `${metrics.byJenis.length} jenis kejadian tercatat`
                : 'Belum ada data jenis kejadian'}
            </p>
          </div>
          {metrics.byJenis.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
              Grafik akan tampil setelah data kejadian disimpan.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.byJenis.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#4B5563' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 11, fill: '#111827' }}
                  />
                  <Tooltip
                    formatter={(value) => [`${value ?? 0} kejadian`, 'Total']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="count" fill="#111827" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 3: Kejadian Berdasarkan Kecamatan */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Grafik Kejadian Berdasarkan Kecamatan
            </h3>
            <p className="text-xs text-neutral-500">
              Cakupan 18 kecamatan Kota Palembang ({metrics.kecamatanTerdampakCount} terdampak)
            </p>
          </div>
          {kecamatanChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
              Belum ada sebaran kejadian per kecamatan.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={kecamatanChartData}
                  margin={{ top: 8, right: 12, left: -18, bottom: 28 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    angle={-28}
                    textAnchor="end"
                    interval={0}
                    height={55}
                    tick={{ fontSize: 10, fill: '#4B5563' }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4B5563' }} />
                  <Tooltip
                    formatter={(value) => [`${value ?? 0} kejadian`, 'Jumlah']}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 4: Status Penanganan */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Grafik Status Penanganan
            </h3>
            <p className="text-xs text-neutral-500">
              Perbandingan Selesai, Dalam Penanganan, dan Monitoring
            </p>
          </div>
          {incidents.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-neutral-400">
              Belum ada data status penanganan.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.byStatus.filter((s) => s.count > 0)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                  >
                    {metrics.byStatus
                      .filter((s) => s.count > 0)
                      .map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value ?? 0} kejadian`, 'Jumlah']} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Total Kejadian Berdasarkan Jenis Bencana + Kejadian Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-neutral-900 mb-3">
            Total Kejadian Berdasarkan Jenis Bencana
          </h3>
          {metrics.byJenis.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              Belum ada data tercatat.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {metrics.byJenis.map((item) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-neutral-700 font-medium">{item.name}</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900">
                    {formatAngka(item.count)} kejadian
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-900">Informasi Kejadian Terbaru</h3>
            <button
              type="button"
              onClick={() => onNavigate('data')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {recentIncidents.length === 0 ? (
            <p className="text-xs text-neutral-500 py-6 text-center">
              Belum ada kejadian terbaru.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentIncidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => onInspectIncident(inc)}
                  className="py-3 flex items-start justify-between gap-4 hover:bg-neutral-50 px-2 -mx-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-900 truncate">
                      {inc.identitas.jenisKejadian} — {inc.identitas.lokasiKejadian}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono">{inc.identitas.nomorLaporan}</span>
                      <span>·</span>
                      <span>{formatTanggalSingkat(inc.identitas.tanggalKejadian)}</span>
                      <span>·</span>
                      <span>Kec. {inc.identitas.kecamatan}</span>
                    </div>
                  </div>
                  <StatusLabel status={inc.penanganan.statusPenanganan} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
