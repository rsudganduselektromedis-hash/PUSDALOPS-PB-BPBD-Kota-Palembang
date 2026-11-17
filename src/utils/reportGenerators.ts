import { AgencySettings, Incident } from '../types/bpbd';
import {
  computeMetrics,
  isKarhutlaIncident,
  NullableAggregate,
  sortIncidentsNewest,
} from './aggregations';
import {
  formatAngka,
  formatHektare,
  formatTanggalIndonesia,
  getTodayIsoDate,
} from './formatters';

export type OfficialReportType =
  | 'Laporan Kejadian Harian'
  | 'Laporan Situasi Bencana'
  | 'Laporan Rekapitulasi Mingguan'
  | 'Laporan Rekapitulasi Bulanan'
  | 'Laporan Karhutla'
  | 'Laporan Banjir'
  | 'Laporan Penanganan dan Evakuasi'
  | 'Laporan Jumlah Korban'
  | 'Laporan Seluruh Kejadian';

export const OFFICIAL_REPORT_TYPES: OfficialReportType[] = [
  'Laporan Kejadian Harian',
  'Laporan Situasi Bencana',
  'Laporan Rekapitulasi Mingguan',
  'Laporan Rekapitulasi Bulanan',
  'Laporan Karhutla',
  'Laporan Banjir',
  'Laporan Penanganan dan Evakuasi',
  'Laporan Jumlah Korban',
  'Laporan Seluruh Kejadian',
];

export type WhatsAppFormat = 'format_1' | 'format_2' | 'format_3' | 'format_4';
export type WhatsAppStyle =
  | 'formal_kedinasan'
  | 'singkat_padat'
  | 'informatif'
  | 'situasi_lapangan';

function formatAggCount(agg: NullableAggregate, unit: string): string {
  if (!agg.hasKnown) return '-';
  const suffix = agg.unknownCount > 0 ? ` (${agg.unknownCount} kejadian belum terdata)` : '';
  return `${formatAngka(agg.total)} ${unit}${suffix}`;
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const trimmed = v.trim();
    if (trimmed && trimmed !== '-' && !seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

export function filterIncidentsForReportType(
  incidents: Incident[],
  reportType: OfficialReportType
): Incident[] {
  const sorted = sortIncidentsNewest(incidents);
  switch (reportType) {
    case 'Laporan Karhutla':
      return sorted.filter(isKarhutlaIncident);
    case 'Laporan Banjir':
      return sorted.filter(
        (i) =>
          i.identitas.jenisKejadian === 'Banjir' ||
          i.identitas.jenisKejadian === 'Genangan'
      );
    case 'Laporan Penanganan dan Evakuasi':
      return sorted.filter(
        (i) =>
          i.identitas.jenisKejadian === 'Evakuasi' ||
          i.identitas.jenisKejadian === 'Penyelamatan' ||
          Boolean(i.penanganan.tindakanPenanganan.trim())
      );
    case 'Laporan Situasi Bencana':
      return sorted;
    default:
      return sorted;
  }
}

export function generateOfficialReportText(params: {
  reportType: OfficialReportType;
  periodLabel: string;
  incidents: Incident[];
  settings?: AgencySettings | null;
}): string {
  const { reportType, periodLabel, incidents } = params;
  const filtered = filterIncidentsForReportType(incidents, reportType);
  const metrics = computeMetrics(filtered);
  const todayFormatted = formatTanggalIndonesia(getTodayIsoDate(), true);

  if (filtered.length === 0) {
    return [
      'LAPORAN KEJADIAN BENCANA',
      'PUSDALOPS-PB BPBD KOTA PALEMBANG',
      '',
      `Jenis Laporan: ${reportType}`,
      `Hari/Tanggal Cetak: ${todayFormatted}`,
      `Periode Laporan: ${periodLabel}`,
      '',
      'I. REKAPITULASI KEJADIAN',
      'Total kejadian: 0 kejadian',
      'Jenis kejadian: -',
      'Lokasi kejadian: -',
      'Jumlah kecamatan terdampak: 0 kecamatan',
      '',
      'II. DATA DAMPAK',
      'Korban meninggal dunia: -',
      'Korban luka-luka: -',
      'Korban hilang: -',
      'Korban mengungsi: -',
      'Korban terdampak: -',
      'Jumlah rumah terdampak: -',
      '',
      'III. UPAYA PENANGANAN',
      'Uraian kegiatan penanganan: Tidak terdapat data kejadian pada periode/kategori yang dipilih.',
      'Jumlah personel: -',
      'Unsur yang terlibat: -',
      'Status penanganan: -',
      '',
      'IV. KETERANGAN',
      'Situasi Kota Palembang dalam kondisi nihil kejadian tercatat pada periode ini.',
    ].join('\n');
  }

  const jenisSummary = metrics.byJenis
    .map((j) => `${j.name} (${formatAngka(j.count)})`)
    .join(', ');

  const lokasiList = uniqueNonEmpty(
    filtered.map(
      (i) =>
        `${i.identitas.lokasiKejadian}${
          i.identitas.kelurahan ? `, Kel. ${i.identitas.kelurahan}` : ''
        }, Kec. ${i.identitas.kecamatan}`
    )
  );
  const lokasiSummary =
    lokasiList.length > 0 ? lokasiList.slice(0, 12).join('; ') + (lokasiList.length > 12 ? `; dan ${lokasiList.length - 12} lokasi lainnya` : '') : '-';

  const tindakanList = uniqueNonEmpty(
    filtered.map((i) =>
      i.penanganan.tindakanPenanganan
        ? `[${i.identitas.nomorLaporan}] ${i.penanganan.tindakanPenanganan}`
        : ''
    )
  );
  const uraianPenanganan =
    tindakanList.length > 0 ? tindakanList.join('\n  - ') : '-';

  const unsurList = uniqueNonEmpty(
    filtered.flatMap((i) =>
      [i.penanganan.instansiTerlibat, i.penanganan.unsurTerlibat]
        .join(',')
        .split(/[,;]+/)
    )
  );

  const kondisiList = uniqueNonEmpty(
    filtered.map((i) =>
      i.dataKejadian.kondisiTerkini
        ? `${i.identitas.jenisKejadian} (${i.identitas.kecamatan}): ${i.dataKejadian.kondisiTerkini}`
        : ''
    )
  );

  const extraSections: string[] = [];
  if (reportType === 'Laporan Karhutla') {
    extraSections.push(
      `Luas lahan terbakar (Karhutla/Lahan): ${
        metrics.luasLahanTerbakarHa.hasKnown
          ? formatHektare(metrics.luasLahanTerbakarHa.total)
          : '-'
      }`
    );
  }
  if (reportType === 'Laporan Jumlah Korban') {
    extraSections.push(
      `Kepala keluarga terdampak: ${formatAggCount(metrics.kkTerdampak, 'KK')}`
    );
    extraSections.push(
      `Fasilitas umum terdampak: ${formatAggCount(metrics.fasumTerdampak, 'unit')}`
    );
  }

  const statusSummary = `Selesai: ${metrics.selesaiCount} | Dalam Penanganan: ${metrics.dalamPenangananCount} | Monitoring: ${metrics.monitoringCount}`;

  return [
    'LAPORAN KEJADIAN BENCANA',
    'PUSDALOPS-PB BPBD KOTA PALEMBANG',
    '',
    `Jenis Laporan: ${reportType}`,
    `Hari/Tanggal: ${todayFormatted}`,
    `Periode Laporan: ${periodLabel}`,
    '',
    'I. REKAPITULASI KEJADIAN',
    `Total kejadian: ${formatAngka(metrics.totalKejadian)} kejadian`,
    `Jenis kejadian: ${jenisSummary || '-'}`,
    `Lokasi kejadian: ${lokasiSummary}`,
    `Jumlah kecamatan terdampak: ${formatAngka(metrics.kecamatanTerdampakCount)} kecamatan`,
    ...extraSections,
    '',
    'II. DATA DAMPAK',
    `Korban meninggal dunia: ${formatAggCount(metrics.meninggal, 'jiwa')}`,
    `Korban luka-luka: ${formatAggCount(metrics.lukaLuka, 'jiwa')}`,
    `Korban hilang: ${formatAggCount(metrics.hilang, 'jiwa')}`,
    `Korban mengungsi: ${formatAggCount(metrics.mengungsi, 'jiwa')}`,
    `Korban terdampak: ${formatAggCount(metrics.terdampakJiwa, 'jiwa')}`,
    `Jumlah rumah terdampak: ${formatAggCount(metrics.rumahTerdampak, 'unit')}`,
    '',
    'III. UPAYA PENANGANAN',
    `Uraian kegiatan penanganan:\n  - ${uraianPenanganan}`,
    `Jumlah personel: ${formatAggCount(metrics.totalPersonel, 'personel')}`,
    `Unsur yang terlibat: ${unsurList.length > 0 ? unsurList.join(', ') : '-'}`,
    `Status penanganan: ${statusSummary}`,
    '',
    'IV. KETERANGAN',
    kondisiList.length > 0
      ? kondisiList.join('\n')
      : 'Seluruh data bersumber dari catatan operasional Pusdalops-PB BPBD Kota Palembang.',
  ].join('\n');
}

function applyStyleTone(
  baseText: string,
  style: WhatsAppStyle,
  maxLength?: number
): string {
  let result = baseText;
  if (style === 'singkat_padat') {
    result = result
      .replace(/📝 Kronologi:\n[^\n]*\n\n/g, '')
      .replace(/🏘️ Kelurahan: -\n/g, '');
  }
  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength - 3).trimEnd() + '...';
  }
  return result;
}

function getHeaderIntro(style: WhatsAppStyle): string {
  switch (style) {
    case 'formal_kedinasan':
      return 'Izin melaporkan kejadian kebencanaan wilayah Kota Palembang:';
    case 'singkat_padat':
      return 'Update ringkas Pusdalops-PB:';
    case 'informatif':
      return 'Informasi Terkini Penanggulangan Bencana Kota Palembang:';
    case 'situasi_lapangan':
      return 'Laporan Situasi Lapangan TRC BPBD Kota Palembang:';
  }
}

export function generateWhatsAppStatusText(params: {
  format: WhatsAppFormat;
  style: WhatsAppStyle;
  dateIso: string;
  selectedIncident: Incident | null;
  incidentsForDate: Incident[];
}): string {
  const { format, style, dateIso, selectedIncident, incidentsForDate } = params;
  const tanggalFormatted = formatTanggalIndonesia(dateIso, true);

  // FORMAT 1 - LAPORAN KEJADIAN HARIAN
  if (format === 'format_1') {
    const inc = selectedIncident || incidentsForDate[0];
    if (!inc) {
      return [
        '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
        '',
        '📋 INFORMASI KEJADIAN',
        '',
        `📅 Hari/Tanggal: ${tanggalFormatted}`,
        'Belum terdapat data kejadian tercatat pada tanggal/pilihan ini.',
        '',
        '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
      ].join('\n');
    }

    const tglInc = formatTanggalIndonesia(inc.identitas.tanggalKejadian, true);
    const waktu = inc.identitas.waktuKejadian ? `${inc.identitas.waktuKejadian} WIB` : '-';
    const lokasi = inc.identitas.lokasiKejadian || '-';
    const kelurahan = inc.identitas.kelurahan || '-';
    const kecamatan = inc.identitas.kecamatan || '-';
    const jenis = inc.identitas.jenisKejadian || '-';
    const kronologi = inc.dataKejadian.kronologi.trim() || '-';
    const penanganan = inc.penanganan.tindakanPenanganan.trim() || '-';
    const unsur = inc.penanganan.unsurTerlibat.trim()
      ? ` (${inc.penanganan.unsurTerlibat.trim()})`
      : '';
    const personel =
      inc.penanganan.jumlahPersonel !== null
        ? `${formatAngka(inc.penanganan.jumlahPersonel)} personel${unsur}`
        : '-';
    const kondisi = inc.dataKejadian.kondisiTerkini.trim()
      ? `${inc.penanganan.statusPenanganan} — ${inc.dataKejadian.kondisiTerkini.trim()}`
      : inc.penanganan.statusPenanganan;

    const lines = [
      '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
      '',
      style !== 'formal_kedinasan' ? getHeaderIntro(style) : null,
      '📋 INFORMASI KEJADIAN',
      '',
      `📅 Hari/Tanggal: ${tglInc}`,
      `⏰ Waktu: ${waktu}`,
      '',
      `📍 Lokasi: ${lokasi}`,
      `🏘️ Kelurahan: ${kelurahan}`,
      `🏙️ Kecamatan: ${kecamatan}`,
      '',
      `🔥 Jenis Kejadian: ${jenis}`,
      '',
      '📝 Kronologi:',
      kronologi,
      '',
      '🚒 Penanganan:',
      penanganan,
      '',
      '👥 Personel:',
      personel,
      '',
      '📊 Kondisi Terkini:',
      kondisi,
      '',
      '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
    ].filter((l): l is string => l !== null);

    return applyStyleTone(lines.join('\n'), style);
  }

  // FORMAT 2 - REKAPITULASI KEJADIAN HARIAN
  if (format === 'format_2') {
    const metrics = computeMetrics(incidentsForDate);
    if (incidentsForDate.length === 0) {
      return [
        '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
        '',
        '📊 REKAPITULASI KEJADIAN BENCANA',
        '',
        `📅 Hari/Tanggal: ${tanggalFormatted}`,
        'Jumlah kejadian: 0 kejadian (Nihil)',
        '',
        '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
      ].join('\n');
    }

    const rincianLines =
      metrics.byJenis.length > 0
        ? metrics.byJenis.map(
            (j, idx) => `${idx + 1}. ${j.name} - ${formatAngka(j.count)}`
          )
        : ['-'];

    const kecList = metrics.byKecamatan
      .filter((k) => k.count > 0)
      .map((k) => k.name);

    const fmtKorban = (agg: NullableAggregate) =>
      agg.hasKnown ? formatAngka(agg.total) : '-';

    const lines = [
      '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
      '',
      style !== 'formal_kedinasan' ? getHeaderIntro(style) : null,
      '📊 REKAPITULASI KEJADIAN BENCANA',
      '',
      `📅 Hari/Tanggal: ${tanggalFormatted}`,
      '',
      `Jumlah kejadian: ${formatAngka(metrics.totalKejadian)}`,
      '',
      'Rincian kejadian:',
      ...rincianLines,
      '',
      '📍 Wilayah terdampak:',
      kecList.length > 0 ? kecList.join(', ') : '-',
      '',
      '👥 Korban:',
      `- Meninggal: ${fmtKorban(metrics.meninggal)}`,
      `- Luka-luka: ${fmtKorban(metrics.lukaLuka)}`,
      `- Mengungsi: ${fmtKorban(metrics.mengungsi)}`,
      `- Terdampak: ${fmtKorban(metrics.terdampakJiwa)}`,
      '',
      '🚒 Status Penanganan:',
      `- Selesai: ${formatAngka(metrics.selesaiCount)}`,
      `- Dalam penanganan: ${formatAngka(metrics.dalamPenangananCount)}`,
      `- Monitoring: ${formatAngka(metrics.monitoringCount)}`,
    ].filter((l): l is string => l !== null);

    return lines.join('\n');
  }

  // FORMAT 3 - LAPORAN KARHUTLA
  if (format === 'format_3') {
    const karhutlaList =
      selectedIncident && isKarhutlaIncident(selectedIncident)
        ? [selectedIncident]
        : incidentsForDate.filter(isKarhutlaIncident);

    if (karhutlaList.length === 0) {
      return [
        '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
        '',
        '🔥 LAPORAN KEJADIAN KEBAKARAN HUTAN DAN LAHAN (KARHUTLA)',
        '',
        `📅 Hari/Tanggal: ${tanggalFormatted}`,
        'Tidak terdapat kejadian Karhutla / Kebakaran Lahan tercatat pada tanggal ini.',
        '',
        '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
      ].join('\n');
    }

    const target = karhutlaList[0];
    const tgl = formatTanggalIndonesia(target.identitas.tanggalKejadian, true);
    const luasText =
      target.dataKejadian.luasAreaHa !== null
        ? formatHektare(target.dataKejadian.luasAreaHa)
        : '-';
    const waktuMulai = target.penanganan.waktuMulai || '-';
    const waktuSelesai =
      target.penanganan.waktuSelesai ||
      (target.penanganan.statusPenanganan === 'Selesai' ? 'Selesai' : 'Masih berlangsung');
    const waktuRentang =
      waktuMulai === '-' && waktuSelesai === '-'
        ? '-'
        : `${waktuMulai} s.d. ${waktuSelesai}`;
    const personelText =
      target.penanganan.jumlahPersonel !== null
        ? `${formatAngka(target.penanganan.jumlahPersonel)} personel`
        : '-';
    const kondisiText = target.dataKejadian.kondisiTerkini.trim()
      ? `${target.penanganan.statusPenanganan} (${target.dataKejadian.kondisiTerkini.trim()})`
      : target.penanganan.statusPenanganan;

    const lines = [
      '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
      '',
      '🔥 LAPORAN KEJADIAN KEBAKARAN HUTAN DAN LAHAN (KARHUTLA)',
      '',
      `📅 Hari/Tanggal: ${tgl}`,
      '',
      '📍 Lokasi:',
      `${target.identitas.lokasiKejadian}${
        target.identitas.kelurahan ? `, Kel. ${target.identitas.kelurahan}` : ''
      }`,
      '',
      '🏙️ Kecamatan:',
      target.identitas.kecamatan || '-',
      '',
      '🌿 Luas lahan terbakar:',
      luasText,
      '',
      '🚒 Penanganan:',
      target.penanganan.tindakanPenanganan.trim() || '-',
      '',
      '👨‍🚒 Jumlah personel:',
      personelText,
      '',
      '⏰ Waktu penanganan:',
      waktuRentang,
      '',
      '📌 Kondisi:',
      kondisiText,
      '',
      '*PUSDALOPS-PB BPBD KOTA PALEMBANG*',
    ];

    return lines.join('\n');
  }

  // FORMAT 4 - LAPORAN SINGKAT STATUS WHATSAPP (MAKS 700 KARAKTER)
  const inc = selectedIncident || incidentsForDate[0];
  if (!inc) {
    return `*PUSDALOPS-PB BPBD KOTA PALEMBANG*\n📅 ${tanggalFormatted}\nSituasi wilayah Kota Palembang nihil kejadian bencana tercatat.\nKondisi: Aman & Terkendali.`;
  }

  const tgl = formatTanggalIndonesia(inc.identitas.tanggalKejadian, true);
  const jenis = inc.identitas.jenisKejadian;
  const lokasi = `${inc.identitas.lokasiKejadian}${
    inc.identitas.kelurahan ? `, Kel. ${inc.identitas.kelurahan}` : ''
  }, Kec. ${inc.identitas.kecamatan}`;
  const rawPenanganan = inc.penanganan.tindakanPenanganan.trim() || '-';
  const kondisi = inc.dataKejadian.kondisiTerkini.trim()
    ? `${inc.penanganan.statusPenanganan} — ${inc.dataKejadian.kondisiTerkini.trim()}`
    : inc.penanganan.statusPenanganan;

  const prefix =
    style === 'situasi_lapangan'
      ? '*LAPORAN SITUASI PUSDALOPS-PB BPBD PALEMBANG*'
      : '*PUSDALOPS-PB BPBD KOTA PALEMBANG*';

  const fixedBase = [
    prefix,
    `📅 ${tgl}`,
    `🚨 Kejadian: ${jenis}`,
    `📍 Lokasi: ${lokasi}`,
    `📌 Kondisi: ${kondisi}`,
  ].join('\n');

  const overheadForPenanganan = '\n🚒 Penanganan: '.length;
  const remaining = Math.max(40, 700 - fixedBase.length - overheadForPenanganan);
  const trimmedPenanganan =
    rawPenanganan.length > remaining
      ? rawPenanganan.slice(0, remaining - 3).trimEnd() + '...'
      : rawPenanganan;

  const concise = [
    prefix,
    `📅 ${tgl}`,
    `🚨 Kejadian: ${jenis}`,
    `📍 Lokasi: ${lokasi}`,
    `🚒 Penanganan: ${trimmedPenanganan}`,
    `📌 Kondisi: ${kondisi}`,
  ].join('\n');

  return concise.length > 700 ? concise.slice(0, 697).trimEnd() + '...' : concise;
}
