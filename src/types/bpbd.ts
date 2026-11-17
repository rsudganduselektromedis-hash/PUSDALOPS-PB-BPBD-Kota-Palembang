export type UserRole = 'Admin' | 'Operator Pusdalops' | 'Petugas Input';

export type StatusPenanganan = 'Dalam Penanganan' | 'Selesai' | 'Monitoring';

export const JENIS_KEJADIAN_LIST = [
  'Banjir',
  'Genangan',
  'Tanah Longsor',
  'Kebakaran Permukiman',
  'Kebakaran Gedung',
  'Kebakaran Lahan',
  'Kebakaran Hutan dan Lahan (Karhutla)',
  'Angin Puting Beliung',
  'Pohon Tumbang',
  'Kekeringan',
  'Cuaca Ekstrem',
  'Orang Tenggelam',
  'Evakuasi',
  'Penyelamatan',
  'Kejadian lainnya',
] as const;

export type JenisKejadian = (typeof JENIS_KEJADIAN_LIST)[number];

export const KECAMATAN_PALEMBANG = [
  'Ilir Barat I',
  'Ilir Barat II',
  'Ilir Timur I',
  'Ilir Timur II',
  'Ilir Timur III',
  'Seberang Ulu I',
  'Seberang Ulu II',
  'Sukarami',
  'Sako',
  'Kemuning',
  'Kalidoni',
  'Bukit Kecil',
  'Gandus',
  'Kertapati',
  'Plaju',
  'Alang-Alang Lebar',
  'Sematang Borang',
  'Jakabaring',
] as const;

export type KecamatanPalembang = (typeof KECAMATAN_PALEMBANG)[number];

export const STATUS_PENANGANAN_LIST: StatusPenanganan[] = [
  'Dalam Penanganan',
  'Monitoring',
  'Selesai',
];

export interface IdentitasKejadian {
  nomorLaporan: string;
  tanggalKejadian: string; // YYYY-MM-DD
  hariKejadian: string;
  waktuKejadian: string; // HH:mm
  jenisKejadian: string;
  lokasiKejadian: string;
  kecamatan: string;
  kelurahan: string;
  alamatLengkap: string;
  titikKoordinat: string;
  sumberInformasi: string;
  waktuLaporanDiterima: string;
}

export interface DataKejadianDetail {
  kronologi: string;
  penyebab: string;
  kondisiTerkini: string;
  dampakKejadian: string;
  luasAreaHa: number | null;
  jumlahRumahTerdampak: number | null;
  jumlahFasumTerdampak: number | null;
}

export interface DataKorban {
  meninggal: number | null;
  lukaLuka: number | null;
  hilang: number | null;
  mengungsi: number | null;
  terdampakJiwa: number | null;
  kkTerdampak: number | null;
}

export interface DataPenanganan {
  instansiTerlibat: string;
  jumlahPersonel: number | null;
  unsurTerlibat: string;
  peralatanDigunakan: string;
  tindakanPenanganan: string;
  waktuMulai: string;
  waktuSelesai: string;
  statusPenanganan: StatusPenanganan;
  keteranganTambahan: string;
}

export interface Incident {
  id: string;
  agencyCode: 'BPBD-PLG';
  identitas: IdentitasKejadian;
  dataKejadian: DataKejadianDetail;
  korban: DataKorban;
  penanganan: DataPenanganan;
  docCount: number;
  createdBy: string;
  createdByName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HandlingLog {
  id: string;
  agencyCode: 'BPBD-PLG';
  incidentId: string;
  statusBaru: StatusPenanganan;
  catatan: string;
  petugas: string;
  createdBy: string;
  createdAt?: unknown;
}

export type DocCategory = 'foto_kejadian' | 'foto_penanganan' | 'dokumen_pendukung';

export interface DocumentationItem {
  id: string;
  agencyCode: 'BPBD-PLG';
  incidentId: string;
  category: DocCategory;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  caption: string;
  createdBy: string;
  createdAt?: unknown;
}

export interface ReportArchiveItem {
  id: string;
  agencyCode: 'BPBD-PLG';
  category: 'laporan_resmi' | 'status_whatsapp';
  reportType: string;
  title: string;
  periodLabel: string;
  content: string;
  incidentCount: number;
  createdBy: string;
  createdByName: string;
  createdAt?: unknown;
}

export interface AgencySettings {
  agencyName: string;
  subUnitName: string;
  cityGovernmentName: string;
  address: string;
  callCenter: string;
  email: string;
  kepalaPelaksana: string;
  nipKepala: string;
  logoPemkotDataUrl: string;
  logoBpbdDataUrl: string;
  updatedBy: string;
  updatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  jabatan: string;
  active: boolean;
  agencyCode: 'BPBD-PLG';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type MenuKey =
  | 'dashboard'
  | 'input'
  | 'data'
  | 'rekapitulasi'
  | 'monitoring'
  | 'laporan'
  | 'whatsapp'
  | 'export'
  | 'pengaturan';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}
