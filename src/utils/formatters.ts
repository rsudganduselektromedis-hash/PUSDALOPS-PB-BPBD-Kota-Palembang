const HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const BULAN_SINGKAT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const BULAN_ROMAWI = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
];

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function getHariFromIsoDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '-';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return '-';
  return HARI_INDONESIA[dt.getDay()];
}

export function formatTanggalIndonesia(isoDate: string, includeHari = false): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || '-';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return isoDate;
  const tanggal = `${d} ${BULAN_INDONESIA[m - 1]} ${y}`;
  if (includeHari) {
    return `${HARI_INDONESIA[dt.getDay()]}, ${tanggal}`;
  }
  return tanggal;
}

export function formatTanggalSingkat(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || '-';
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${BULAN_SINGKAT[m - 1]} ${y}`;
}

export function getNamaBulan(monthIndex1Based: number): string {
  return BULAN_INDONESIA[monthIndex1Based - 1] || '-';
}

export function getBulanSingkat(monthIndex1Based: number): string {
  return BULAN_SINGKAT[monthIndex1Based - 1] || '-';
}

export function formatAngka(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatHektare(val: number | null): string {
  if (val === null || val === undefined) return 'Belum tersedia';
  return `${new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val)} Ha`;
}

export function formatNullableCount(
  val: number | null,
  unit = '',
  emptyLabel = 'Belum tersedia'
): string {
  if (val === null || val === undefined) return emptyLabel;
  const formatted = formatAngka(val);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function parseNullableIntInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
}

export function parseNullableFloatInput(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed === '') return null;
  const parsed = Number.parseFloat(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function generateNomorLaporan(existingNumbers: string[], isoDate: string): string {
  const [yearStr, monthStr] = /^\d{4}-\d{2}-\d{2}$/.test(isoDate)
    ? isoDate.split('-')
    : getTodayIsoDate().split('-');
  const monthIdx = Math.max(1, Math.min(12, Number.parseInt(monthStr, 10))) - 1;
  const romawi = BULAN_ROMAWI[monthIdx];

  let maxSeq = 0;
  for (const no of existingNumbers) {
    const match = /^LP-(\d+)\//.exec(no);
    if (match) {
      const seq = Number.parseInt(match[1], 10);
      if (!Number.isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `LP-${nextSeq}/PUSDALOPS-BPBD/PLG/${romawi}/${yearStr}`;
}

export function generateDocId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${rand}`;
}

export function sanitizeString(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

export async function fileToCompressedDataUrl(
  file: File,
  maxWidth = 1024,
  quality = 0.78
): Promise<{ dataUrl: string; sizeBytes: number; mimeType: string }> {
  if (!file.type.startsWith('image/')) {
    if (file.size > 350 * 1024) {
      throw new Error('Ukuran dokumen non-gambar maksimal 350 KB agar tersimpan di database.');
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Gagal membaca berkas dokumen.'));
      reader.readAsDataURL(file);
    });
    return {
      dataUrl,
      sizeBytes: dataUrl.length,
      mimeType: file.type || 'application/octet-stream',
    };
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal memproses berkas gambar.'));
      el.src = imageUrl;
    });

    const maxBytes = maxWidth <= 512 ? 380000 : 550000;
    let currentWidth = Math.min(img.width, maxWidth);
    let currentQuality = quality;
    const usePngInitially = file.type === 'image/png' && maxWidth <= 512;
    let outputMime = usePngInitially ? 'image/png' : 'image/jpeg';
    let dataUrl = '';

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const scale = img.width > currentWidth ? currentWidth / img.width : 1;
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Kanvas kompresi gambar tidak tersedia.');
      ctx.drawImage(img, 0, 0, targetW, targetH);

      dataUrl = canvas.toDataURL(outputMime, currentQuality);
      if (dataUrl.length <= maxBytes) break;

      outputMime = 'image/jpeg';
      currentQuality = Math.max(0.42, currentQuality - 0.14);
      currentWidth = Math.round(currentWidth * 0.78);
    }

    if (dataUrl.length > maxBytes) {
      throw new Error(
        'Ukuran gambar masih terlalu besar setelah dikompresi. Gunakan gambar beresolusi lebih kecil.'
      );
    }

    return {
      dataUrl,
      sizeBytes: dataUrl.length,
      mimeType: outputMime,
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function getIsoWeekRange(isoDate: string): { start: string; end: string } {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay(); // 0=Sun .. 6=Sat
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(dt);
  mon.setDate(dt.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  return { start: fmt(mon), end: fmt(sun) };
}
