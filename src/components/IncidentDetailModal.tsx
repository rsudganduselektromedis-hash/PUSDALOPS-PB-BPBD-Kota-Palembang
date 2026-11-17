import React from 'react';
import { X, Edit3, MessageSquareShare, FileText, Download } from 'lucide-react';
import { DocumentationItem, HandlingLog, Incident } from '../types/bpbd';
import {
  formatHektare,
  formatNullableCount,
  formatTanggalIndonesia,
} from '../utils/formatters';
import { StatusLabel } from './StatusText';

interface IncidentDetailModalProps {
  incident: Incident;
  logs: HandlingLog[];
  docs: DocumentationItem[];
  canEdit: boolean;
  onClose: () => void;
  onEdit: (incident: Incident) => void;
  onGenerateWhatsApp: (incident: Incident) => void;
}

export function IncidentDetailModal({
  incident,
  logs,
  docs,
  canEdit,
  onClose,
  onEdit,
  onGenerateWhatsApp,
}: IncidentDetailModalProps) {
  const { identitas, dataKejadian, korban, penanganan } = incident;
  const incidentLogs = logs.filter((l) => l.incidentId === incident.id);
  const incidentDocs = docs.filter((d) => d.incidentId === incident.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto no-print">
      <div className="bg-white border border-neutral-200 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#EA580C] font-semibold">
              {identitas.nomorLaporan}
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mt-0.5">
              {identitas.jenisKejadian} — {identitas.lokasiKejadian}
            </h2>
            <div className="text-xs text-neutral-500 mt-1 flex flex-wrap items-center gap-2">
              <span>{formatTanggalIndonesia(identitas.tanggalKejadian, true)}</span>
              <span>·</span>
              <span>{identitas.waktuKejadian ? `${identitas.waktuKejadian} WIB` : '-'}</span>
              <span>·</span>
              <span>Kec. {identitas.kecamatan}</span>
              <span>·</span>
              <StatusLabel status={penanganan.statusPenanganan} />
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-800 rounded-lg cursor-pointer"
            aria-label="Tutup detail kejadian"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Identitas & Data Kejadian */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1.5">
                Identitas &amp; Lokasi
              </h3>
              <dl className="grid grid-cols-3 gap-y-1.5 text-xs">
                <dt className="text-neutral-500">Kecamatan</dt>
                <dd className="col-span-2 font-medium text-neutral-900">{identitas.kecamatan}</dd>
                <dt className="text-neutral-500">Kelurahan</dt>
                <dd className="col-span-2 text-neutral-900">{identitas.kelurahan || '-'}</dd>
                <dt className="text-neutral-500">Alamat</dt>
                <dd className="col-span-2 text-neutral-900">{identitas.alamatLengkap || '-'}</dd>
                <dt className="text-neutral-500">Koordinat</dt>
                <dd className="col-span-2 font-mono text-neutral-900">{identitas.titikKoordinat || '-'}</dd>
                <dt className="text-neutral-500">Sumber Info</dt>
                <dd className="col-span-2 text-neutral-900">{identitas.sumberInformasi || '-'}</dd>
                <dt className="text-neutral-500">Laporan Masuk</dt>
                <dd className="col-span-2 font-mono text-neutral-900">
                  {identitas.waktuLaporanDiterima || '-'}
                </dd>
              </dl>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1.5">
                Data Dampak &amp; Fisik
              </h3>
              <dl className="grid grid-cols-3 gap-y-1.5 text-xs">
                <dt className="text-neutral-500">Luas Area</dt>
                <dd className="col-span-2 font-mono font-semibold text-neutral-900">
                  {formatHektare(dataKejadian.luasAreaHa)}
                </dd>
                <dt className="text-neutral-500">Rumah Terdampak</dt>
                <dd className="col-span-2 font-mono text-neutral-900">
                  {formatNullableCount(dataKejadian.jumlahRumahTerdampak, 'unit')}
                </dd>
                <dt className="text-neutral-500">Fasum Terdampak</dt>
                <dd className="col-span-2 font-mono text-neutral-900">
                  {formatNullableCount(dataKejadian.jumlahFasumTerdampak, 'unit')}
                </dd>
                <dt className="text-neutral-500">Penyebab</dt>
                <dd className="col-span-2 text-neutral-900">{dataKejadian.penyebab || '-'}</dd>
                <dt className="text-neutral-500">Dampak</dt>
                <dd className="col-span-2 text-neutral-900">{dataKejadian.dampakKejadian || '-'}</dd>
                <dt className="text-neutral-500">Kondisi Terkini</dt>
                <dd className="col-span-2 font-medium text-neutral-900">
                  {dataKejadian.kondisiTerkini || '-'}
                </dd>
              </dl>
            </div>
          </div>

          {/* Kronologi */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1.5 mb-2">
              Kronologi Kejadian
            </h3>
            <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-line">
              {dataKejadian.kronologi || '-'}
            </p>
          </div>

          {/* Data Korban */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1.5 mb-2.5">
              Data Korban
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Meninggal', val: korban.meninggal, unit: 'jiwa' },
                { label: 'Luka-Luka', val: korban.lukaLuka, unit: 'jiwa' },
                { label: 'Hilang', val: korban.hilang, unit: 'jiwa' },
                { label: 'Mengungsi', val: korban.mengungsi, unit: 'jiwa' },
                { label: 'Terdampak', val: korban.terdampakJiwa, unit: 'jiwa' },
                { label: 'KK Terdampak', val: korban.kkTerdampak, unit: 'KK' },
              ].map((k) => (
                <div key={k.label} className="border border-neutral-200 rounded-lg p-2.5">
                  <div className="text-[11px] text-neutral-500">{k.label}</div>
                  <div className="text-sm font-bold font-mono text-neutral-900 mt-0.5">
                    {formatNullableCount(k.val, k.unit, 'Belum tersedia')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Penanganan */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1.5 mb-2">
              Upaya Penanganan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-2">
              <div>
                <span className="text-neutral-500">Instansi Terlibat: </span>
                <span className="font-medium text-neutral-900">{penanganan.instansiTerlibat || '-'}</span>
              </div>
              <div>
                <span className="text-neutral-500">Jumlah Personel: </span>
                <span className="font-mono font-semibold text-neutral-900">
                  {formatNullableCount(penanganan.jumlahPersonel, 'orang')}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Unsur Terlibat: </span>
                <span className="text-neutral-900">{penanganan.unsurTerlibat || '-'}</span>
              </div>
              <div>
                <span className="text-neutral-500">Peralatan: </span>
                <span className="text-neutral-900">{penanganan.peralatanDigunakan || '-'}</span>
              </div>
              <div>
                <span className="text-neutral-500">Waktu Penanganan: </span>
                <span className="font-mono text-neutral-900">
                  {penanganan.waktuMulai || '-'} s.d. {penanganan.waktuSelesai || '-'}
                </span>
              </div>
            </div>
            <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-line">
              {penanganan.tindakanPenanganan || '-'}
            </p>
            {penanganan.keteranganTambahan && (
              <p className="text-xs text-neutral-600 mt-1.5">
                Keterangan: {penanganan.keteranganTambahan}
              </p>
            )}
          </div>

          {/* Dokumentasi */}
          {incidentDocs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1.5 mb-2.5">
                Dokumentasi Lampiran ({incidentDocs.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {incidentDocs.map((doc) => (
                  <div key={doc.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                    {doc.mimeType.startsWith('image/') ? (
                      <img
                        src={doc.dataUrl}
                        alt={doc.caption || doc.fileName}
                        className="w-full h-36 object-cover bg-neutral-100"
                      />
                    ) : (
                      <div className="h-36 flex flex-col items-center justify-center bg-neutral-50 p-3">
                        <FileText className="w-8 h-8 text-neutral-500 mb-1" />
                        <span className="text-xs text-neutral-700 truncate max-w-full">
                          {doc.fileName}
                        </span>
                      </div>
                    )}
                    <div className="p-2 flex items-center justify-between gap-2 bg-white border-t border-neutral-100">
                      <span className="text-[11px] text-neutral-600 truncate">
                        {doc.caption || doc.fileName}
                      </span>
                      <a
                        href={doc.dataUrl}
                        download={doc.fileName}
                        className="text-[#EA580C] hover:text-[#C2410C] shrink-0"
                        title="Unduh berkas"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Riwayat Log Monitoring */}
          {incidentLogs.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-1.5 mb-2">
                Riwayat Monitoring Penanganan
              </h3>
              <div className="space-y-2">
                {incidentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="text-xs border border-neutral-200 rounded-lg p-2.5 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-neutral-900">{log.catatan}</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Petugas: {log.petugas}
                      </div>
                    </div>
                    <StatusLabel status={log.statusBaru} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onGenerateWhatsApp(incident)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <MessageSquareShare className="w-3.5 h-3.5" />
            Buat Status WhatsApp
          </button>

          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(incident)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Data
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
