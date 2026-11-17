import React, { useMemo, useState } from 'react';
import { Incident } from '../types/bpbd';
import { computeMetrics, filterIncidentsByPeriod, NullableAggregate } from '../utils/aggregations';
import {
  formatAngka,
  formatHektare,
  formatTanggalIndonesia,
  getIsoWeekRange,
  getTodayIsoDate,
} from '../utils/formatters';

type PeriodTab = 'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'semua';

function fmtAgg(agg: NullableAggregate, unit: string): string {
  if (!agg.hasKnown) return 'Belum tersedia';
  return `${formatAngka(agg.total)} ${unit}`;
}

export function RecapView({ incidents }: { incidents: Incident[] }) {
  const today = getTodayIsoDate();
  const [periodTab, setPeriodTab] = useState<PeriodTab>('bulanan');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(today.slice(0, 4));

  const filtered = useMemo(
    () =>
      filterIncidentsByPeriod(incidents, periodTab, {
        date: selectedDate,
        month: selectedMonth,
        year: selectedYear,
      }),
    [incidents, periodTab, selectedDate, selectedMonth, selectedYear]
  );

  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);

  const periodDescription = useMemo(() => {
    if (periodTab === 'harian') return formatTanggalIndonesia(selectedDate, true);
    if (periodTab === 'mingguan') {
      const { start, end } = getIsoWeekRange(selectedDate);
      return `${formatTanggalIndonesia(start)} s.d. ${formatTanggalIndonesia(end)}`;
    }
    if (periodTab === 'bulanan') return `Bulan ${selectedMonth}`;
    if (periodTab === 'tahunan') return `Tahun ${selectedYear}`;
    return 'Seluruh Periode Database';
  }, [periodTab, selectedDate, selectedMonth, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-neutral-900">
              Rekapitulasi Data Kejadian Bencana
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Periode aktif: <span className="font-semibold text-neutral-800">{periodDescription}</span> · Dihitung otomatis dari database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            {(
              [
                ['harian', 'Rekap Harian'],
                ['mingguan', 'Rekap Mingguan'],
                ['bulanan', 'Rekap Bulanan'],
                ['tahunan', 'Rekap Tahunan'],
                ['semua', 'Semua Data'],
              ] as [PeriodTab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriodTab(key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  periodTab === key
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {periodTab !== 'semua' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100">
            {(periodTab === 'harian' || periodTab === 'mingguan') && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-neutral-700">
                  {periodTab === 'harian' ? 'Pilih Tanggal:' : 'Tanggal dalam Minggu:'}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                />
              </div>
            )}

            {periodTab === 'bulanan' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-neutral-700">Pilih Bulan:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
                />
              </div>
            )}

            {periodTab === 'tahunan' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-neutral-700">Tahun:</label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg w-28"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Cards: Status Penanganan, Korban, Luas Lahan Terbakar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mb-3">
            Rekap Status Penanganan
          </h2>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-600">Total Kejadian Tercatat</span>
              <span className="font-mono font-bold text-neutral-900">{formatAngka(metrics.totalKejadian)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700 font-medium">Selesai Ditangani</span>
              <span className="font-mono font-bold text-emerald-700">{formatAngka(metrics.selesaiCount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#C2410C] font-medium">Dalam Penanganan</span>
              <span className="font-mono font-bold text-[#C2410C]">{formatAngka(metrics.dalamPenangananCount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 font-medium">Monitoring</span>
              <span className="font-mono font-bold text-blue-700">{formatAngka(metrics.monitoringCount)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mb-3">
            Rekap Jumlah Korban
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-600">Meninggal Dunia</span>
              <span className="font-mono font-bold text-neutral-900">{fmtAgg(metrics.meninggal, 'jiwa')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Luka-Luka</span>
              <span className="font-mono font-bold text-neutral-900">{fmtAgg(metrics.lukaLuka, 'jiwa')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Hilang</span>
              <span className="font-mono font-bold text-neutral-900">{fmtAgg(metrics.hilang, 'jiwa')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Mengungsi</span>
              <span className="font-mono font-bold text-neutral-900">{fmtAgg(metrics.mengungsi, 'jiwa')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Terdampak (Jiwa / KK)</span>
              <span className="font-mono font-bold text-neutral-900">
                {fmtAgg(metrics.terdampakJiwa, 'jiwa')} · {fmtAgg(metrics.kkTerdampak, 'KK')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 mb-3">
            Rekap Luas Lahan &amp; Kerusakan
          </h2>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-600">Luas Lahan Terbakar (Karhutla)</span>
              <span className="font-mono font-bold text-[#EA580C]">
                {metrics.luasLahanTerbakarHa.hasKnown
                  ? formatHektare(metrics.luasLahanTerbakarHa.total)
                  : 'Belum tersedia'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Total Luas Area Terdampak</span>
              <span className="font-mono font-bold text-neutral-900">
                {metrics.luasAreaTotalHa.hasKnown
                  ? formatHektare(metrics.luasAreaTotalHa.total)
                  : 'Belum tersedia'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Rumah Terdampak</span>
              <span className="font-mono font-bold text-neutral-900">{fmtAgg(metrics.rumahTerdampak, 'unit')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Fasilitas Umum Terdampak</span>
              <span className="font-mono font-bold text-neutral-900">{fmtAgg(metrics.fasumTerdampak, 'unit')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by Jenis Kejadian & 18 Kecamatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-neutral-900 mb-3">
            Rekap Berdasarkan Jenis Kejadian
          </h2>
          {metrics.byJenis.length === 0 ? (
            <p className="text-xs text-neutral-500 py-8 text-center">
              Tidak ada kejadian pada periode ini.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="py-2 text-left font-semibold">Jenis Kejadian</th>
                  <th className="py-2 text-right font-semibold">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {metrics.byJenis.map((j) => (
                  <tr key={j.name}>
                    <td className="py-2.5 text-neutral-800">{j.name}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-neutral-900">
                      {formatAngka(j.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-neutral-900 mb-3">
            Rekap Berdasarkan 18 Kecamatan Kota Palembang
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="py-2 text-left font-semibold">No.</th>
                  <th className="py-2 text-left font-semibold">Kecamatan</th>
                  <th className="py-2 text-right font-semibold">Jumlah Kejadian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {metrics.byKecamatan.map((k, idx) => (
                  <tr key={k.name}>
                    <td className="py-2 font-mono text-neutral-400 w-8">{idx + 1}</td>
                    <td className="py-2 text-neutral-800">{k.name}</td>
                    <td
                      className={`py-2 text-right font-mono font-bold ${
                        k.count > 0 ? 'text-[#EA580C]' : 'text-neutral-400'
                      }`}
                    >
                      {formatAngka(k.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
