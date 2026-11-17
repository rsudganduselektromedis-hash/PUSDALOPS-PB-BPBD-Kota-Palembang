import React, { useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet, Printer, Archive, Trash2 } from 'lucide-react';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { filterIncidentsByPeriod } from '../utils/aggregations';
import {
  exportOfficialReportExcel,
  exportOfficialReportPdf,
} from '../utils/exports';
import {
  formatTanggalIndonesia,
  getIsoWeekRange,
  getTodayIsoDate,
} from '../utils/formatters';
import {
  filterIncidentsForReportType,
  generateOfficialReportText,
  OFFICIAL_REPORT_TYPES,
  OfficialReportType,
} from '../utils/reportGenerators';
import { BpbdPalembangLogo, PemkotPalembangLogo } from './InstitutionalLogos';

export function ReportGeneratorView() {
  const { incidents, reports, agencySettings, archiveReport, deleteArchivedReport, notify } =
    useFirebaseData();
  const today = getTodayIsoDate();

  const [reportType, setReportType] = useState<OfficialReportType>('Laporan Kejadian Harian');
  const [periodMode, setPeriodMode] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'semua'>('harian');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(today.slice(0, 4));
  const [savingArchive, setSavingArchive] = useState(false);

  const handleReportTypeChange = (nextType: OfficialReportType) => {
    setReportType(nextType);
    if (nextType === 'Laporan Kejadian Harian') setPeriodMode('harian');
    else if (nextType === 'Laporan Rekapitulasi Mingguan') setPeriodMode('mingguan');
    else if (nextType === 'Laporan Rekapitulasi Bulanan') setPeriodMode('bulanan');
    else if (nextType === 'Laporan Seluruh Kejadian') setPeriodMode('semua');
  };

  const periodLabel = useMemo(() => {
    if (periodMode === 'harian') return formatTanggalIndonesia(selectedDate, true);
    if (periodMode === 'mingguan') {
      const { start, end } = getIsoWeekRange(selectedDate);
      return `${formatTanggalIndonesia(start)} s.d. ${formatTanggalIndonesia(end)}`;
    }
    if (periodMode === 'bulanan') return `Bulan ${selectedMonth}`;
    if (periodMode === 'tahunan') return `Tahun ${selectedYear}`;
    return 'Seluruh Periode Tercatat';
  }, [periodMode, selectedDate, selectedMonth, selectedYear]);

  const periodIncidents = useMemo(
    () =>
      filterIncidentsByPeriod(incidents, periodMode, {
        date: selectedDate,
        month: selectedMonth,
        year: selectedYear,
      }),
    [incidents, periodMode, selectedDate, selectedMonth, selectedYear]
  );

  const reportIncidents = useMemo(
    () => filterIncidentsForReportType(periodIncidents, reportType),
    [periodIncidents, reportType]
  );

  const reportText = useMemo(
    () =>
      generateOfficialReportText({
        reportType,
        periodLabel,
        incidents: periodIncidents,
        settings: agencySettings,
      }),
    [reportType, periodLabel, periodIncidents, agencySettings]
  );

  const savedOfficialReports = useMemo(
    () => reports.filter((r) => r.category === 'laporan_resmi'),
    [reports]
  );

  const handleArchive = async () => {
    setSavingArchive(true);
    try {
      await archiveReport({
        category: 'laporan_resmi',
        reportType,
        title: `${reportType} (${periodLabel})`,
        periodLabel,
        content: reportText,
        incidentCount: reportIncidents.length,
      });
    } catch {
      // Notifikasi error ditangani oleh FirebaseDataContext
    } finally {
      setSavingArchive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4 no-print">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">
            Generator Laporan Otomatis Pusdalops-PB
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Laporan resmi disusun otomatis langsung dari database kejadian tanpa rekayasa angka.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-neutral-100">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Jenis Laporan Resmi
            </label>
            <select
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value as OfficialReportType)}
              className="w-full px-3 py-2 text-xs font-semibold border border-neutral-300 rounded-lg bg-white"
            >
              {OFFICIAL_REPORT_TYPES.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Cakupan Periode
            </label>
            <select
              value={periodMode}
              onChange={(e) =>
                setPeriodMode(
                  e.target.value as 'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'semua'
                )
              }
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
            >
              <option value="harian">Harian</option>
              <option value="mingguan">Mingguan</option>
              <option value="bulanan">Bulanan</option>
              <option value="tahunan">Tahunan</option>
              <option value="semua">Seluruh Database</option>
            </select>
          </div>

          <div>
            {(periodMode === 'harian' || periodMode === 'mingguan') && (
              <>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Tanggal Referensi
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg"
                />
              </>
            )}
            {periodMode === 'bulanan' && (
              <>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Pilih Bulan
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg"
                />
              </>
            )}
            {periodMode === 'tahunan' && (
              <>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Pilih Tahun
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg"
                />
              </>
            )}
            {periodMode === 'semua' && (
              <>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Total Kejadian Tercakup
                </label>
                <div className="px-3 py-2 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-lg">
                  {reportIncidents.length} kejadian
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              exportOfficialReportPdf({
                reportType,
                periodLabel,
                reportText,
                incidents: reportIncidents,
                settings: agencySettings,
              });
              notify('success', 'PDF Diunduh', `${reportType} berhasil diekspor ke PDF.`);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Download PDF
          </button>

          <button
            type="button"
            onClick={() => {
              exportOfficialReportExcel({
                reportType,
                periodLabel,
                incidents: reportIncidents,
                settings: agencySettings,
              });
              notify('success', 'Excel Diunduh', `${reportType} berhasil diekspor ke Excel.`);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>

          <button
            type="button"
            onClick={handleArchive}
            disabled={savingArchive}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            Simpan ke Arsip Database
          </button>
        </div>
      </div>

      {/* Official Document Preview */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 md:p-10 max-w-4xl print-only-full">
        {/* Letterhead */}
        <div className="flex items-center justify-between gap-4 border-b-2 border-neutral-900 pb-4 mb-6">
          <PemkotPalembangLogo dataUrl={agencySettings.logoPemkotDataUrl} size="lg" />
          <div className="text-center flex-1">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-700">
              {agencySettings.cityGovernmentName}
            </div>
            <div className="text-base md:text-lg font-extrabold uppercase text-neutral-900">
              {agencySettings.agencyName}
            </div>
            <div className="text-xs font-semibold text-neutral-700">
              {agencySettings.subUnitName}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">{agencySettings.address}</div>
          </div>
          <BpbdPalembangLogo dataUrl={agencySettings.logoBpbdDataUrl} size="lg" />
        </div>

        <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm leading-relaxed text-neutral-900">
          {reportText}
        </pre>

        <div className="mt-10 flex justify-end">
          <div className="text-xs text-neutral-800 w-64">
            <div>Palembang, {formatTanggalIndonesia(today)}</div>
            <div className="mt-0.5">Kepala Pelaksana BPBD Kota Palembang,</div>
            <div className="h-14" />
            <div className="font-bold underline">{agencySettings.kepalaPelaksana}</div>
            {agencySettings.nipKepala && <div>NIP. {agencySettings.nipKepala}</div>}
          </div>
        </div>
      </div>

      {/* Saved Archive List */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 no-print">
        <h2 className="text-sm font-bold text-neutral-900 mb-3">
          Arsip Laporan Resmi Tersimpan ({savedOfficialReports.length})
        </h2>
        {savedOfficialReports.length === 0 ? (
          <p className="text-xs text-neutral-500">
            Belum ada laporan resmi yang diarsipkan ke database.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {savedOfficialReports.map((rep) => (
              <div key={rep.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-semibold text-neutral-900">{rep.title}</div>
                  <div className="text-[11px] text-neutral-500">
                    {rep.reportType} · {rep.incidentCount} kejadian · Disusun oleh {rep.createdByName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteArchivedReport(rep.id);
                    } catch {
                      // Notifikasi error ditangani oleh FirebaseDataContext
                    }
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                  title="Hapus arsip"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
