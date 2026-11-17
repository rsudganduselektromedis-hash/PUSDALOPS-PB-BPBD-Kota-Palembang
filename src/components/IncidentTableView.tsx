import React, { useMemo, useState } from 'react';
import { Search, Eye, Edit3, Trash2, PlusCircle, RotateCcw } from 'lucide-react';
import {
  Incident,
  JENIS_KEJADIAN_LIST,
  KECAMATAN_PALEMBANG,
  STATUS_PENANGANAN_LIST,
} from '../types/bpbd';
import { sortIncidentsNewest } from '../utils/aggregations';
import {
  formatHektare,
  formatNullableCount,
  formatTanggalSingkat,
} from '../utils/formatters';
import { StatusLabel } from './StatusText';

interface IncidentTableViewProps {
  incidents: Incident[];
  userRole: string;
  userUid: string;
  onInspect: (incident: Incident) => void;
  onEdit: (incident: Incident) => void;
  onDelete: (incidentId: string) => Promise<void>;
  onCreateNew: () => void;
}

export function IncidentTableView({
  incidents,
  userRole,
  userUid,
  onInspect,
  onEdit,
  onDelete,
  onCreateNew,
}: IncidentTableViewProps) {
  const [searchLokasi, setSearchLokasi] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    const yrs = new Set<string>();
    for (const i of incidents) {
      yrs.add(i.identitas.tanggalKejadian.slice(0, 4));
    }
    return Array.from(yrs).sort((a, b) => b.localeCompare(a));
  }, [incidents]);

  const filtered = useMemo(() => {
    const sorted = sortIncidentsNewest(incidents);
    const q = searchLokasi.trim().toLowerCase();

    return sorted.filter((inc) => {
      if (q) {
        const hay = `${inc.identitas.lokasiKejadian} ${inc.identitas.kelurahan} ${inc.identitas.alamatLengkap} ${inc.identitas.nomorLaporan}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterDate && inc.identitas.tanggalKejadian !== filterDate) return false;
      if (filterYear && !inc.identitas.tanggalKejadian.startsWith(filterYear)) return false;
      if (filterMonth && inc.identitas.tanggalKejadian.slice(5, 7) !== filterMonth) return false;
      if (filterJenis && inc.identitas.jenisKejadian !== filterJenis) return false;
      if (filterKecamatan && inc.identitas.kecamatan !== filterKecamatan) return false;
      if (filterStatus && inc.penanganan.statusPenanganan !== filterStatus) return false;
      return true;
    });
  }, [
    incidents,
    searchLokasi,
    filterDate,
    filterMonth,
    filterYear,
    filterJenis,
    filterKecamatan,
    filterStatus,
  ]);

  const resetFilters = () => {
    setSearchLokasi('');
    setFilterDate('');
    setFilterMonth('');
    setFilterYear('');
    setFilterJenis('');
    setFilterKecamatan('');
    setFilterStatus('');
  };

  const formatKorbanRingkas = (inc: Incident) => {
    const { meninggal, lukaLuka, terdampakJiwa } = inc.korban;
    if (meninggal === null && lukaLuka === null && terdampakJiwa === null) {
      return 'Belum tersedia';
    }
    const parts: string[] = [];
    if (meninggal !== null) parts.push(`M:${meninggal}`);
    if (lukaLuka !== null) parts.push(`L:${lukaLuka}`);
    if (terdampakJiwa !== null) parts.push(`T:${terdampakJiwa}`);
    return parts.join(' · ');
  };

  const canEditRow = (inc: Incident) =>
    userRole === 'Admin' ||
    userRole === 'Operator Pusdalops' ||
    (inc.createdBy === userUid && inc.penanganan.statusPenanganan !== 'Selesai');

  const canDeleteRow = userRole === 'Admin' || userRole === 'Operator Pusdalops';

  return (
    <div className="space-y-5">
      {/* Header & Filter Panel */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-neutral-900">Tabel Data Kejadian Bencana</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Menampilkan {filtered.length} dari {incidents.length} kejadian (diurutkan terbaru).
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Input Kejadian
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-neutral-100">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari lokasi, kelurahan, nomor..."
              value={searchLokasi}
              onChange={(e) => setSearchLokasi(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            aria-label="Filter tanggal"
            className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              aria-label="Filter bulan"
              className="w-full px-2.5 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
            >
              <option value="">Semua Bulan</option>
              {[
                ['01', 'Januari'], ['02', 'Februari'], ['03', 'Maret'], ['04', 'April'],
                ['05', 'Mei'], ['06', 'Juni'], ['07', 'Juli'], ['08', 'Agustus'],
                ['09', 'September'], ['10', 'Oktober'], ['11', 'November'], ['12', 'Desember'],
              ].map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              aria-label="Filter tahun"
              className="w-full px-2.5 py-2 text-xs font-mono border border-neutral-300 rounded-lg bg-white"
            >
              <option value="">Semua Tahun</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            aria-label="Filter jenis kejadian"
            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
          >
            <option value="">Semua Jenis Kejadian</option>
            {JENIS_KEJADIAN_LIST.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>

          <select
            value={filterKecamatan}
            onChange={(e) => setFilterKecamatan(e.target.value)}
            aria-label="Filter kecamatan"
            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
          >
            <option value="">Semua Kecamatan (18)</option>
            {KECAMATAN_PALEMBANG.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter status penanganan"
            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
          >
            <option value="">Semua Status Penanganan</option>
            {STATUS_PENANGANAN_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-neutral-800">
              Tidak ada data kejadian yang sesuai filter.
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Ubah kata kunci filter atau tambahkan laporan kejadian baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  <th className="py-3 px-3">No.</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Jenis Kejadian</th>
                  <th className="py-3 px-3">Lokasi</th>
                  <th className="py-3 px-3">Kecamatan</th>
                  <th className="py-3 px-3">Kelurahan</th>
                  <th className="py-3 px-3">Korban</th>
                  <th className="py-3 px-3 text-right">Luas Area (Ha)</th>
                  <th className="py-3 px-3">Status Penanganan</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filtered.map((inc, index) => (
                  <tr key={inc.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono tabular-nums text-neutral-500">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-mono text-neutral-900">
                        {formatTanggalSingkat(inc.identitas.tanggalKejadian)}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {inc.identitas.waktuKejadian || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-neutral-900">
                      <div>{inc.identitas.jenisKejadian}</div>
                      <div className="text-[11px] font-mono font-normal text-neutral-500">
                        {inc.identitas.nomorLaporan}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-neutral-800 max-w-[200px]">
                      <div className="truncate" title={inc.identitas.lokasiKejadian}>
                        {inc.identitas.lokasiKejadian}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-neutral-800">
                      {inc.identitas.kecamatan}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-neutral-600">
                      {inc.identitas.kelurahan || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap text-neutral-800">
                      {formatKorbanRingkas(inc)}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-right whitespace-nowrap text-neutral-800">
                      {inc.dataKejadian.luasAreaHa !== null
                        ? formatHektare(inc.dataKejadian.luasAreaHa)
                        : formatNullableCount(null, '', '-')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusLabel status={inc.penanganan.statusPenanganan} />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {confirmDeleteId === inc.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={deletingId === inc.id}
                            onClick={async () => {
                              setDeletingId(inc.id);
                              try {
                                await onDelete(inc.id);
                              } catch {
                                // Notifikasi error ditangani oleh FirebaseDataContext
                              } finally {
                                setDeletingId(null);
                                setConfirmDeleteId(null);
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-bold bg-red-600 disabled:opacity-60 text-white rounded cursor-pointer"
                          >
                            {deletingId === inc.id ? 'Menghapus...' : 'Ya, Hapus'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-[11px] font-semibold bg-neutral-200 text-neutral-800 rounded cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onInspect(inc)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded cursor-pointer"
                            title="Detail kejadian"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEditRow(inc) && (
                            <button
                              type="button"
                              onClick={() => onEdit(inc)}
                              className="p-1.5 text-[#EA580C] hover:bg-orange-50 rounded cursor-pointer"
                              title="Edit kejadian"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteRow && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(inc.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title="Hapus kejadian"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
