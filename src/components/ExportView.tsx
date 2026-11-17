import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Database,
  Printer,
  Calendar,
} from 'lucide-react';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { filterIncidentsByPeriod } from '../utils/aggregations';
import {
  exportFullDatabaseExcel,
  exportIncidentsTablePdf,
  exportIncidentsToExcel,
  exportMonthlyRecapExcel,
  exportOfficialReportPdf,
} from '../utils/exports';
import { formatTanggalIndonesia, getTodayIsoDate } from '../utils/formatters';
import { generateOfficialReportText } from '../utils/reportGenerators';

export function ExportView() {
  const { incidents, handlingLogs, reports, agencySettings, notify } = useFirebaseData();
  const today = getTodayIsoDate();
  const [dailyDate, setDailyDate] = useState(today);
  const [monthlyValue, setMonthlyValue] = useState(today.slice(0, 7));

  const dailyIncidents = filterIncidentsByPeriod(incidents, 'harian', { date: dailyDate });
  const monthlyIncidents = filterIncidentsByPeriod(incidents, 'bulanan', {
    month: monthlyValue,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h1 className="text-lg font-bold text-neutral-900">
          Pusat Export &amp; Cetak Data Pusdalops-PB
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Unduh data kejadian, rekapitulasi bulanan, laporan harian, dan cadangan seluruh database dalam format Excel, PDF, atau JSON.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Export Seluruh Data Kejadian (Excel & PDF) */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              Data Kejadian Bencana ({incidents.length} Record)
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Mengekspor seluruh daftar kejadian lengkap dengan identitas, korban, luas area, dan penanganan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                exportIncidentsToExcel(incidents);
                notify('success', 'Excel Diunduh', 'Tabel data kejadian diekspor ke Excel.');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Excel
            </button>
            <button
              type="button"
              onClick={() => {
                exportIncidentsTablePdf(
                  incidents,
                  'REKAPITULASI DATA KEJADIAN BENCANA BPBD KOTA PALEMBANG',
                  agencySettings
                );
                notify('success', 'PDF Diunduh', 'Tabel data kejadian diekspor ke PDF.');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* 2. Laporan Harian */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Download Laporan Harian</h2>
            <p className="text-xs text-neutral-600 mt-1">
              Laporan resmi Pusdalops-PB untuk tanggal terpilih ({dailyIncidents.length} kejadian).
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                const label = formatTanggalIndonesia(dailyDate, true);
                const text = generateOfficialReportText({
                  reportType: 'Laporan Kejadian Harian',
                  periodLabel: label,
                  incidents: dailyIncidents,
                  settings: agencySettings,
                });
                exportOfficialReportPdf({
                  reportType: 'Laporan Kejadian Harian',
                  periodLabel: label,
                  reportText: text,
                  incidents: dailyIncidents,
                  settings: agencySettings,
                  fileName: `Laporan_Harian_${dailyDate}.pdf`,
                });
                notify('success', 'PDF Harian Diunduh', `Laporan tanggal ${dailyDate} selesai diunduh.`);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Download Laporan Harian (PDF)
            </button>
          </div>
        </div>

        {/* 3. Rekapitulasi Bulanan */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Download Rekapitulasi Bulanan</h2>
            <p className="text-xs text-neutral-600 mt-1">
              Ringkasan per kecamatan, per jenis kejadian, korban, dan luas lahan ({monthlyIncidents.length} kejadian).
            </p>
            <div className="mt-3">
              <input
                type="month"
                value={monthlyValue}
                onChange={(e) => setMonthlyValue(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono border border-neutral-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                exportMonthlyRecapExcel(
                  monthlyIncidents,
                  monthlyValue,
                  `Rekapitulasi_Bulanan_${monthlyValue}.xlsx`
                );
                notify('success', 'Excel Bulanan Diunduh', `Rekap bulan ${monthlyValue} selesai diunduh.`);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Rekap Bulanan (Excel)
            </button>
          </div>
        </div>

        {/* 4. Download Seluruh Database & Cetak */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">
              Download Seluruh Database &amp; Cetak
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Mencakup tabel kejadian, rekap kecamatan, rekap jenis, log penanganan, dan arsip laporan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                exportFullDatabaseExcel({ incidents, logs: handlingLogs, reports });
                notify('success', 'Database Diekspor', 'Seluruh database berhasil diunduh sebagai Excel.');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Database className="w-4 h-4" />
              Seluruh Database (.xlsx)
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
