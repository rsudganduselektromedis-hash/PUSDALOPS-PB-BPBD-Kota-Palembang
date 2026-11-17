import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  AgencySettings,
  HandlingLog,
  Incident,
  ReportArchiveItem,
} from '../types/bpbd';
import { computeMetrics, sortIncidentsNewest } from './aggregations';
import {
  formatAngka,
  formatHektare,
  formatNullableCount,
  formatTanggalIndonesia,
  getTodayIsoDate,
} from './formatters';
import { generateOfficialReportText, OfficialReportType } from './reportGenerators';

export function exportIncidentsToExcel(
  incidents: Incident[],
  fileName = `Data_Kejadian_BPBD_Palembang_${getTodayIsoDate()}.xlsx`
): void {
  const sorted = sortIncidentsNewest(incidents);
  const rows = sorted.map((inc, idx) => ({
    No: idx + 1,
    'Nomor Laporan': inc.identitas.nomorLaporan,
    'Tanggal Kejadian': inc.identitas.tanggalKejadian,
    'Hari Kejadian': inc.identitas.hariKejadian,
    'Waktu Kejadian': inc.identitas.waktuKejadian || '-',
    'Jenis Kejadian': inc.identitas.jenisKejadian,
    'Lokasi Kejadian': inc.identitas.lokasiKejadian,
    Kecamatan: inc.identitas.kecamatan,
    Kelurahan: inc.identitas.kelurahan || '-',
    'Alamat Lengkap': inc.identitas.alamatLengkap || '-',
    'Titik Koordinat': inc.identitas.titikKoordinat || '-',
    'Sumber Informasi': inc.identitas.sumberInformasi || '-',
    'Waktu Diterima Pusdalops': inc.identitas.waktuLaporanDiterima || '-',
    Kronologi: inc.dataKejadian.kronologi || '-',
    Penyebab: inc.dataKejadian.penyebab || '-',
    'Kondisi Terkini': inc.dataKejadian.kondisiTerkini || '-',
    'Dampak Kejadian': inc.dataKejadian.dampakKejadian || '-',
    'Luas Area (Ha)': inc.dataKejadian.luasAreaHa !== null ? inc.dataKejadian.luasAreaHa : 'Belum tersedia',
    'Rumah Terdampak': inc.dataKejadian.jumlahRumahTerdampak !== null ? inc.dataKejadian.jumlahRumahTerdampak : 'Belum tersedia',
    'Fasum Terdampak': inc.dataKejadian.jumlahFasumTerdampak !== null ? inc.dataKejadian.jumlahFasumTerdampak : 'Belum tersedia',
    'Korban Meninggal': inc.korban.meninggal !== null ? inc.korban.meninggal : 'Belum tersedia',
    'Korban Luka-Luka': inc.korban.lukaLuka !== null ? inc.korban.lukaLuka : 'Belum tersedia',
    'Korban Hilang': inc.korban.hilang !== null ? inc.korban.hilang : 'Belum tersedia',
    'Korban Mengungsi': inc.korban.mengungsi !== null ? inc.korban.mengungsi : 'Belum tersedia',
    'Korban Terdampak (Jiwa)': inc.korban.terdampakJiwa !== null ? inc.korban.terdampakJiwa : 'Belum tersedia',
    'KK Terdampak': inc.korban.kkTerdampak !== null ? inc.korban.kkTerdampak : 'Belum tersedia',
    'Instansi Terlibat': inc.penanganan.instansiTerlibat || '-',
    'Jumlah Personel': inc.penanganan.jumlahPersonel !== null ? inc.penanganan.jumlahPersonel : 'Belum tersedia',
    'Unsur Terlibat': inc.penanganan.unsurTerlibat || '-',
    'Peralatan Digunakan': inc.penanganan.peralatanDigunakan || '-',
    'Tindakan Penanganan': inc.penanganan.tindakanPenanganan || '-',
    'Waktu Mulai': inc.penanganan.waktuMulai || '-',
    'Waktu Selesai': inc.penanganan.waktuSelesai || '-',
    'Status Penanganan': inc.penanganan.statusPenanganan,
    'Keterangan Tambahan': inc.penanganan.keteranganTambahan || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Kejadian');
  XLSX.writeFile(wb, fileName);
}

export function exportFullDatabaseExcel(params: {
  incidents: Incident[];
  logs: HandlingLog[];
  reports: ReportArchiveItem[];
}): void {
  const wb = XLSX.utils.book_new();
  const sorted = sortIncidentsNewest(params.incidents);
  const metrics = computeMetrics(sorted);

  const incidentRows = sorted.map((inc, idx) => ({
    No: idx + 1,
    ID: inc.id,
    'Nomor Laporan': inc.identitas.nomorLaporan,
    Tanggal: inc.identitas.tanggalKejadian,
    Hari: inc.identitas.hariKejadian,
    Waktu: inc.identitas.waktuKejadian || '-',
    Jenis: inc.identitas.jenisKejadian,
    Lokasi: inc.identitas.lokasiKejadian,
    Kecamatan: inc.identitas.kecamatan,
    Kelurahan: inc.identitas.kelurahan || '-',
    'Luas (Ha)': inc.dataKejadian.luasAreaHa ?? 'Belum tersedia',
    Meninggal: inc.korban.meninggal ?? 'Belum tersedia',
    'Luka-Luka': inc.korban.lukaLuka ?? 'Belum tersedia',
    Hilang: inc.korban.hilang ?? 'Belum tersedia',
    Mengungsi: inc.korban.mengungsi ?? 'Belum tersedia',
    Terdampak: inc.korban.terdampakJiwa ?? 'Belum tersedia',
    KK: inc.korban.kkTerdampak ?? 'Belum tersedia',
    Personel: inc.penanganan.jumlahPersonel ?? 'Belum tersedia',
    Status: inc.penanganan.statusPenanganan,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incidentRows), 'Kejadian');

  const kecRows = metrics.byKecamatan.map((k, idx) => ({
    No: idx + 1,
    Kecamatan: k.name,
    'Jumlah Kejadian': k.count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kecRows), 'Rekap_Kecamatan');

  const jenisRows = metrics.byJenis.map((j, idx) => ({
    No: idx + 1,
    'Jenis Kejadian': j.name,
    'Jumlah Kejadian': j.count,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(jenisRows), 'Rekap_Jenis');

  const logRows = params.logs.map((l, idx) => ({
    No: idx + 1,
    'ID Kejadian': l.incidentId,
    Status: l.statusBaru,
    Catatan: l.catatan,
    Petugas: l.petugas,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logRows), 'Log_Penanganan');

  const reportRows = params.reports.map((r, idx) => ({
    No: idx + 1,
    Kategori: r.category,
    Jenis: r.reportType,
    Judul: r.title,
    Periode: r.periodLabel,
    'Jumlah Kejadian': r.incidentCount,
    Pembuat: r.createdByName,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportRows), 'Arsip_Laporan');

  XLSX.writeFile(wb, `Database_Pusdalops_BPBD_Palembang_${getTodayIsoDate()}.xlsx`);
}

export function exportMonthlyRecapExcel(
  incidents: Incident[],
  monthLabel: string,
  fileName: string
): void {
  const metrics = computeMetrics(incidents);
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    { Indikator: 'Periode Rekapitulasi', Nilai: monthLabel },
    { Indikator: 'Total Kejadian', Nilai: metrics.totalKejadian },
    { Indikator: 'Selesai Ditangani', Nilai: metrics.selesaiCount },
    { Indikator: 'Dalam Penanganan', Nilai: metrics.dalamPenangananCount },
    { Indikator: 'Monitoring', Nilai: metrics.monitoringCount },
    { Indikator: 'Korban Meninggal', Nilai: metrics.meninggal.hasKnown ? metrics.meninggal.total : 'Belum tersedia' },
    { Indikator: 'Korban Luka-Luka', Nilai: metrics.lukaLuka.hasKnown ? metrics.lukaLuka.total : 'Belum tersedia' },
    { Indikator: 'Korban Hilang', Nilai: metrics.hilang.hasKnown ? metrics.hilang.total : 'Belum tersedia' },
    { Indikator: 'Pengungsi', Nilai: metrics.mengungsi.hasKnown ? metrics.mengungsi.total : 'Belum tersedia' },
    { Indikator: 'Korban Terdampak (Jiwa)', Nilai: metrics.terdampakJiwa.hasKnown ? metrics.terdampakJiwa.total : 'Belum tersedia' },
    { Indikator: 'Luas Lahan Terbakar (Ha)', Nilai: metrics.luasLahanTerbakarHa.hasKnown ? metrics.luasLahanTerbakarHa.total : 'Belum tersedia' },
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Ringkasan');
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(metrics.byKecamatan.map((k, i) => ({ No: i + 1, Kecamatan: k.name, Kejadian: k.count }))),
    'Per_Kecamatan'
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(metrics.byJenis.map((j, i) => ({ No: i + 1, Jenis: j.name, Kejadian: j.count }))),
    'Per_Jenis'
  );
  XLSX.writeFile(wb, fileName);
}

const DEFAULT_PEMKOT_LOGO_PATH =
  '/assets/aistudio/Logo_Palembang__1__5e3c77b2.png';
const DEFAULT_BPBD_LOGO_PATH =
  '/assets/aistudio/file_00000000c4f472069eff5fe65b2955d7_7aea0719.png';
let cachedDefaultPemkotLogoDataUrl = '';
let cachedDefaultBpbdLogoDataUrl = '';

function preloadLogoDataUrl(url: string, onLoaded: (dataUrl: string) => void) {
  fetch(url)
    .then((res) => (res.ok ? res.blob() : null))
    .then((blob) => {
      if (!blob) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onLoaded(reader.result);
        }
      };
      reader.readAsDataURL(blob);
    })
    .catch(() => {
      // ignore preload failure
    });
}

if (typeof window !== 'undefined') {
  preloadLogoDataUrl(DEFAULT_PEMKOT_LOGO_PATH, (d) => {
    cachedDefaultPemkotLogoDataUrl = d;
  });
  preloadLogoDataUrl(DEFAULT_BPBD_LOGO_PATH, (d) => {
    cachedDefaultBpbdLogoDataUrl = d;
  });
}

function addOfficialLetterheadToPdf(doc: jsPDF, settings?: AgencySettings | null): number {
  const pageW = doc.internal.pageSize.getWidth();

  const pemkotLogoSrc =
    settings?.logoPemkotDataUrl && settings.logoPemkotDataUrl.startsWith('data:image/')
      ? settings.logoPemkotDataUrl
      : cachedDefaultPemkotLogoDataUrl;

  if (pemkotLogoSrc && pemkotLogoSrc.startsWith('data:image/')) {
    try {
      const fmt = pemkotLogoSrc.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(pemkotLogoSrc, fmt, 14, 10, 18, 18);
    } catch {
      // ignore invalid image
    }
  }
  const bpbdLogoSrc =
    settings?.logoBpbdDataUrl && settings.logoBpbdDataUrl.startsWith('data:image/')
      ? settings.logoBpbdDataUrl
      : cachedDefaultBpbdLogoDataUrl;

  if (bpbdLogoSrc && bpbdLogoSrc.startsWith('data:image/')) {
    try {
      const fmt = bpbdLogoSrc.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(bpbdLogoSrc, fmt, pageW - 32, 10, 18, 18);
    } catch {
      // ignore invalid image
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    (settings?.cityGovernmentName || 'PEMERINTAH KOTA PALEMBANG').toUpperCase(),
    pageW / 2,
    14,
    { align: 'center' }
  );
  doc.setFontSize(13);
  doc.text(
    (settings?.agencyName || 'BADAN PENANGGULANGAN BENCANA DAERAH (BPBD)').toUpperCase(),
    pageW / 2,
    20,
    { align: 'center' }
  );
  doc.setFontSize(10);
  doc.text(
    (settings?.subUnitName || 'PUSAT PENGENDALIAN OPERASI PENANGGULANGAN BENCANA (PUSDALOPS-PB)').toUpperCase(),
    pageW / 2,
    25.5,
    { align: 'center' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    settings?.address ||
      'Jl. R. Sukamto Jl. Rawasari, 20 Ilir D II, Kec. Ilir Tim. II, Kota Palembang, Sumatera Selatan 30114',
    pageW / 2,
    30.5,
    { align: 'center' }
  );

  doc.setLineWidth(0.8);
  doc.line(14, 33.5, pageW - 14, 33.5);
  doc.setLineWidth(0.25);
  doc.line(14, 34.7, pageW - 14, 34.7);

  return 41;
}

export function exportOfficialReportPdf(params: {
  reportType: OfficialReportType;
  periodLabel: string;
  reportText: string;
  incidents: Incident[];
  settings?: AgencySettings | null;
  fileName?: string;
}): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = addOfficialLetterheadToPdf(doc, params.settings);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(params.reportType.toUpperCase(), pageW / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const splitLines = doc.splitTextToSize(params.reportText, pageW - 28);
  for (const line of splitLines) {
    if (y > 272) {
      doc.addPage();
      y = 18;
    }
    doc.text(line, 14, y);
    y += 4.6;
  }

  if (params.incidents.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 18;
    } else {
      y += 4;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('LAMPIRAN RINCIAN DATA KEJADIAN', 14, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      styles: { fontSize: 7.8, cellPadding: 2 },
      headStyles: { fillColor: [234, 88, 12], textColor: 255 },
      head: [['No', 'Tanggal', 'Jenis Kejadian', 'Lokasi / Kecamatan', 'Korban (M/L/T)', 'Luas', 'Status']],
      body: sortIncidentsNewest(params.incidents).map((inc, idx) => [
        idx + 1,
        formatTanggalIndonesia(inc.identitas.tanggalKejadian),
        inc.identitas.jenisKejadian,
        `${inc.identitas.lokasiKejadian} (${inc.identitas.kecamatan})`,
        `${formatNullableCount(inc.korban.meninggal, '', '-')} / ${formatNullableCount(
          inc.korban.lukaLuka,
          '',
          '-'
        )} / ${formatNullableCount(inc.korban.terdampakJiwa, '', '-')}`,
        inc.dataKejadian.luasAreaHa !== null ? formatHektare(inc.dataKejadian.luasAreaHa) : '-',
        inc.penanganan.statusPenanganan,
      ]),
    });
  }

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || y;
  let sigY = finalY + 12;
  if (sigY > 258) {
    doc.addPage();
    sigY = 22;
  }

  const sigX = pageW - 78;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Palembang, ${formatTanggalIndonesia(getTodayIsoDate())}`, sigX, sigY);
  doc.text('Kepala Pelaksana BPBD Kota Palembang,', sigX, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.text(params.settings?.kepalaPelaksana || 'Kepala Pelaksana BPBD', sigX, sigY + 23);
  doc.setFont('helvetica', 'normal');
  doc.text(params.settings?.nipKepala ? `NIP. ${params.settings.nipKepala}` : 'PUSDALOPS-PB BPBD Kota Palembang', sigX, sigY + 28);

  const safeName =
    params.fileName ||
    `${params.reportType.replace(/\s+/g, '_')}_${getTodayIsoDate()}.pdf`;
  doc.save(safeName);
}

export function exportIncidentsTablePdf(
  incidents: Incident[],
  title: string,
  settings?: AgencySettings | null,
  fileName = `Rekap_Kejadian_BPBD_Palembang_${getTodayIsoDate()}.pdf`
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = addOfficialLetterheadToPdf(doc, settings);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), pageW / 2, y, { align: 'center' });
  y += 5;

  const sorted = sortIncidentsNewest(incidents);
  autoTable(doc, {
    startY: y,
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [17, 24, 39], textColor: 255 },
    head: [
      [
        'No',
        'No. Laporan',
        'Tanggal',
        'Jenis Kejadian',
        'Lokasi',
        'Kecamatan',
        'Kelurahan',
        'Meninggal',
        'Luka',
        'Terdampak',
        'Luas (Ha)',
        'Status',
      ],
    ],
    body: sorted.map((inc, idx) => [
      idx + 1,
      inc.identitas.nomorLaporan,
      inc.identitas.tanggalKejadian,
      inc.identitas.jenisKejadian,
      inc.identitas.lokasiKejadian,
      inc.identitas.kecamatan,
      inc.identitas.kelurahan || '-',
      formatNullableCount(inc.korban.meninggal, '', '-'),
      formatNullableCount(inc.korban.lukaLuka, '', '-'),
      formatNullableCount(inc.korban.terdampakJiwa, '', '-'),
      inc.dataKejadian.luasAreaHa !== null ? formatAngka(inc.dataKejadian.luasAreaHa) : '-',
      inc.penanganan.statusPenanganan,
    ]),
  });

  doc.save(fileName);
}

export function exportOfficialReportExcel(params: {
  reportType: OfficialReportType;
  periodLabel: string;
  incidents: Incident[];
  settings?: AgencySettings | null;
}): void {
  const text = generateOfficialReportText(params);
  const wb = XLSX.utils.book_new();
  const lines = text.split('\n').map((line, i) => ({ Baris: i + 1, Uraian: line }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lines), 'Laporan_Resmi');
  const sorted = sortIncidentsNewest(params.incidents);
  if (sorted.length > 0) {
    const rows = sorted.map((inc, idx) => ({
      No: idx + 1,
      'Nomor Laporan': inc.identitas.nomorLaporan,
      Tanggal: inc.identitas.tanggalKejadian,
      Jenis: inc.identitas.jenisKejadian,
      Lokasi: inc.identitas.lokasiKejadian,
      Kecamatan: inc.identitas.kecamatan,
      Status: inc.penanganan.statusPenanganan,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Rincian_Kejadian');
  }
  XLSX.writeFile(
    wb,
    `${params.reportType.replace(/\s+/g, '_')}_${getTodayIsoDate()}.xlsx`
  );
}

export function downloadTextFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
