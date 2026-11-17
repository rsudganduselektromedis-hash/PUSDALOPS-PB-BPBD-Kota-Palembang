import {
  Incident,
  JENIS_KEJADIAN_LIST,
  KECAMATAN_PALEMBANG,
} from '../types/bpbd';
import { getBulanSingkat, getIsoWeekRange, getTodayIsoDate } from './formatters';

export interface NullableAggregate {
  total: number;
  knownCount: number;
  unknownCount: number;
  hasKnown: boolean;
}

export function sumNullable(values: (number | null | undefined)[]): NullableAggregate {
  let total = 0;
  let knownCount = 0;
  let unknownCount = 0;

  for (const v of values) {
    if (v === null || v === undefined) {
      unknownCount += 1;
    } else {
      total += v;
      knownCount += 1;
    }
  }

  return {
    total: Math.round(total * 100) / 100,
    knownCount,
    unknownCount,
    hasKnown: knownCount > 0,
  };
}

export function deduplicateIncidents(incidents: Incident[]): Incident[] {
  const seen = new Set<string>();
  const unique: Incident[] = [];
  for (const item of incidents) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      unique.push(item);
    }
  }
  return unique;
}

export function sortIncidentsNewest(incidents: Incident[]): Incident[] {
  return [...deduplicateIncidents(incidents)].sort((a, b) => {
    const dateCompare = b.identitas.tanggalKejadian.localeCompare(a.identitas.tanggalKejadian);
    if (dateCompare !== 0) return dateCompare;
    const timeCompare = (b.identitas.waktuKejadian || '').localeCompare(a.identitas.waktuKejadian || '');
    if (timeCompare !== 0) return timeCompare;
    return b.identitas.nomorLaporan.localeCompare(a.identitas.nomorLaporan);
  });
}

export function isKarhutlaIncident(inc: Incident): boolean {
  const jenis = inc.identitas.jenisKejadian;
  return (
    jenis === 'Kebakaran Hutan dan Lahan (Karhutla)' ||
    jenis === 'Kebakaran Lahan'
  );
}

export interface DashboardMetrics {
  totalKejadian: number;
  kejadianHariIni: number;
  kejadianBulanIni: number;
  selesaiCount: number;
  dalamPenangananCount: number;
  monitoringCount: number;
  meninggal: NullableAggregate;
  lukaLuka: NullableAggregate;
  hilang: NullableAggregate;
  terdampakJiwa: NullableAggregate;
  mengungsi: NullableAggregate;
  kkTerdampak: NullableAggregate;
  rumahTerdampak: NullableAggregate;
  fasumTerdampak: NullableAggregate;
  luasLahanTerbakarHa: NullableAggregate;
  luasAreaTotalHa: NullableAggregate;
  totalPersonel: NullableAggregate;
  byJenis: { name: string; count: number }[];
  byKecamatan: { name: string; count: number }[];
  byStatus: { name: string; count: number; color: string }[];
  byBulan: { bulan: string; count: number }[];
  kecamatanTerdampakCount: number;
}

export function computeMetrics(
  rawIncidents: Incident[],
  referenceYear?: number
): DashboardMetrics {
  const incidents = deduplicateIncidents(rawIncidents);
  const today = getTodayIsoDate();
  const currentMonthPrefix = today.slice(0, 7);
  const targetYear = referenceYear || Number.parseInt(today.slice(0, 4), 10);

  let kejadianHariIni = 0;
  let kejadianBulanIni = 0;
  let selesaiCount = 0;
  let dalamPenangananCount = 0;
  let monitoringCount = 0;

  const jenisMap = new Map<string, number>();
  for (const j of JENIS_KEJADIAN_LIST) jenisMap.set(j, 0);

  const kecMap = new Map<string, number>();
  for (const k of KECAMATAN_PALEMBANG) kecMap.set(k, 0);

  const monthCounts = new Array<number>(12).fill(0);

  for (const inc of incidents) {
    const tgl = inc.identitas.tanggalKejadian;
    if (tgl === today) kejadianHariIni += 1;
    if (tgl.startsWith(currentMonthPrefix)) kejadianBulanIni += 1;

    if (tgl.startsWith(`${targetYear}-`)) {
      const m = Number.parseInt(tgl.slice(5, 7), 10);
      if (m >= 1 && m <= 12) monthCounts[m - 1] += 1;
    }

    const st = inc.penanganan.statusPenanganan;
    if (st === 'Selesai') selesaiCount += 1;
    else if (st === 'Dalam Penanganan') dalamPenangananCount += 1;
    else if (st === 'Monitoring') monitoringCount += 1;

    const jenis = inc.identitas.jenisKejadian;
    jenisMap.set(jenis, (jenisMap.get(jenis) || 0) + 1);

    const kec = inc.identitas.kecamatan;
    kecMap.set(kec, (kecMap.get(kec) || 0) + 1);
  }

  const karhutlaIncidents = incidents.filter(isKarhutlaIncident);

  const byJenis = Array.from(jenisMap.entries())
    .map(([name, count]) => ({ name, count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const byKecamatan = Array.from(kecMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const byStatus = [
    { name: 'Selesai', count: selesaiCount, color: '#16A34A' },
    { name: 'Dalam Penanganan', count: dalamPenangananCount, color: '#EA580C' },
    { name: 'Monitoring', count: monitoringCount, color: '#2563EB' },
  ];

  const byBulan = monthCounts.map((count, idx) => ({
    bulan: getBulanSingkat(idx + 1),
    count,
  }));

  const kecamatanTerdampakCount = byKecamatan.filter((k) => k.count > 0).length;

  return {
    totalKejadian: incidents.length,
    kejadianHariIni,
    kejadianBulanIni,
    selesaiCount,
    dalamPenangananCount,
    monitoringCount,
    meninggal: sumNullable(incidents.map((i) => i.korban.meninggal)),
    lukaLuka: sumNullable(incidents.map((i) => i.korban.lukaLuka)),
    hilang: sumNullable(incidents.map((i) => i.korban.hilang)),
    terdampakJiwa: sumNullable(incidents.map((i) => i.korban.terdampakJiwa)),
    mengungsi: sumNullable(incidents.map((i) => i.korban.mengungsi)),
    kkTerdampak: sumNullable(incidents.map((i) => i.korban.kkTerdampak)),
    rumahTerdampak: sumNullable(incidents.map((i) => i.dataKejadian.jumlahRumahTerdampak)),
    fasumTerdampak: sumNullable(incidents.map((i) => i.dataKejadian.jumlahFasumTerdampak)),
    luasLahanTerbakarHa: sumNullable(karhutlaIncidents.map((i) => i.dataKejadian.luasAreaHa)),
    luasAreaTotalHa: sumNullable(incidents.map((i) => i.dataKejadian.luasAreaHa)),
    totalPersonel: sumNullable(incidents.map((i) => i.penanganan.jumlahPersonel)),
    byJenis,
    byKecamatan,
    byStatus,
    byBulan,
    kecamatanTerdampakCount,
  };
}

export function filterIncidentsByPeriod(
  incidents: Incident[],
  mode: 'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'semua',
  opts: { date?: string; month?: string; year?: string }
): Incident[] {
  const unique = sortIncidentsNewest(incidents);
  const targetDate = opts.date || getTodayIsoDate();
  const targetMonth = opts.month || targetDate.slice(0, 7);
  const targetYear = opts.year || targetDate.slice(0, 4);

  if (mode === 'harian') {
    return unique.filter((i) => i.identitas.tanggalKejadian === targetDate);
  }
  if (mode === 'mingguan') {
    const { start, end } = getIsoWeekRange(targetDate);
    return unique.filter(
      (i) => i.identitas.tanggalKejadian >= start && i.identitas.tanggalKejadian <= end
    );
  }
  if (mode === 'bulanan') {
    return unique.filter((i) => i.identitas.tanggalKejadian.startsWith(targetMonth));
  }
  if (mode === 'tahunan') {
    return unique.filter((i) => i.identitas.tanggalKejadian.startsWith(targetYear));
  }
  return unique;
}
