import React, { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Download,
  Sparkles,
  Archive,
} from 'lucide-react';
import { Incident } from '../types/bpbd';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { isKarhutlaIncident, sortIncidentsNewest } from '../utils/aggregations';
import { downloadTextFile } from '../utils/exports';
import { formatTanggalIndonesia, getTodayIsoDate } from '../utils/formatters';
import {
  generateWhatsAppStatusText,
  WhatsAppFormat,
  WhatsAppStyle,
} from '../utils/reportGenerators';

interface WhatsAppGeneratorViewProps {
  preselectedIncident: Incident | null;
}

const FORMAT_OPTIONS: { value: WhatsAppFormat; label: string; desc: string }[] = [
  {
    value: 'format_1',
    label: 'FORMAT 1 - Laporan Kejadian Harian',
    desc: 'Narasi lengkap satu kejadian (waktu, lokasi, kronologi, penanganan, personel, kondisi).',
  },
  {
    value: 'format_2',
    label: 'FORMAT 2 - Rekapitulasi Kejadian Harian',
    desc: 'Ringkasan total kejadian, jenis, wilayah kecamatan, korban, dan status penanganan.',
  },
  {
    value: 'format_3',
    label: 'FORMAT 3 - Laporan Karhutla',
    desc: 'Format khusus Kebakaran Hutan dan Lahan (luas hektare, pemadaman, personel).',
  },
  {
    value: 'format_4',
    label: 'FORMAT 4 - Laporan Singkat Status WhatsApp',
    desc: 'Narasi sangat ringkas maksimal 700 karakter siap tempel ke WhatsApp Status.',
  },
];

const STYLE_OPTIONS: { value: WhatsAppStyle; label: string }[] = [
  { value: 'formal_kedinasan', label: '1. Formal kedinasan' },
  { value: 'singkat_padat', label: '2. Singkat dan padat' },
  { value: 'informatif', label: '3. Informatif' },
  { value: 'situasi_lapangan', label: '4. Laporan situasi lapangan' },
];

export function WhatsAppGeneratorView({
  preselectedIncident,
}: WhatsAppGeneratorViewProps) {
  const { incidents, archiveReport, notify } = useFirebaseData();
  const sortedIncidents = useMemo(() => sortIncidentsNewest(incidents), [incidents]);

  const [format, setFormat] = useState<WhatsAppFormat>('format_1');
  const [style, setStyle] = useState<WhatsAppStyle>('formal_kedinasan');
  const [selectedDate, setSelectedDate] = useState<string>(
    preselectedIncident?.identitas.tanggalKejadian || getTodayIsoDate()
  );
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    preselectedIncident?.id || ''
  );

  const [narrative, setNarrative] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savingArchive, setSavingArchive] = useState(false);

  useEffect(() => {
    if (preselectedIncident) {
      setSelectedIncidentId(preselectedIncident.id);
      setSelectedDate(preselectedIncident.identitas.tanggalKejadian);
      if (isKarhutlaIncident(preselectedIncident)) {
        setFormat('format_3');
      } else {
        setFormat('format_1');
      }
    } else if (!selectedIncidentId && sortedIncidents.length > 0) {
      setSelectedIncidentId(sortedIncidents[0].id);
      setSelectedDate(sortedIncidents[0].identitas.tanggalKejadian);
    }
  }, [preselectedIncident, sortedIncidents, selectedIncidentId]);

  const selectedIncident = useMemo(
    () => sortedIncidents.find((i) => i.id === selectedIncidentId) || null,
    [sortedIncidents, selectedIncidentId]
  );

  const incidentsForDate = useMemo(
    () => sortedIncidents.filter((i) => i.identitas.tanggalKejadian === selectedDate),
    [sortedIncidents, selectedDate]
  );

  const buildReport = () => {
    const generated = generateWhatsAppStatusText({
      format,
      style,
      dateIso: selectedDate,
      selectedIncident,
      incidentsForDate,
    });
    setNarrative(generated);
    setIsEditing(false);
  };

  useEffect(() => {
    buildReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, style, selectedDate, selectedIncidentId, incidents]);

  const handleCopyText = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      notify(
        'success',
        'Teks Disalin ke Clipboard',
        'Narasi laporan beserta emoji & format baris siap ditempel ke WhatsApp Status.'
      );
      setTimeout(() => setCopied(false), 2500);
    } catch {
      notify('error', 'Gagal Menyalin', 'Silakan blok teks secara manual dan salin.');
    }
  };

  const handleSaveArchive = async () => {
    setSavingArchive(true);
    try {
      await archiveReport({
        category: 'status_whatsapp',
        reportType: FORMAT_OPTIONS.find((f) => f.value === format)?.label || format,
        title: `Status WA — ${formatTanggalIndonesia(selectedDate)}`,
        periodLabel: formatTanggalIndonesia(selectedDate, true),
        content: narrative,
        incidentCount: format === 'format_2' ? incidentsForDate.length : selectedIncident ? 1 : 0,
      });
    } catch {
      // Notifikasi error ditangani oleh FirebaseDataContext
    } finally {
      setSavingArchive(false);
    }
  };

  const charCount = narrative.length;
  const overLimitFormat4 = format === 'format_4' && charCount > 700;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h1 className="text-lg font-bold text-neutral-900">
          BUAT LAPORAN STATUS WHATSAPP
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          Konversi otomatis data kejadian tersimpan menjadi narasi rapi dengan emoji dan baris baru siap tempel ke WhatsApp Status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Configuration & Action Panel */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-xl p-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-neutral-800 mb-2">
              Pilih Format Status WhatsApp
            </label>
            <div className="space-y-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    format === opt.value
                      ? 'border-[#EA580C] bg-orange-50/60'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="text-xs font-bold text-neutral-900">{opt.label}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Gaya Bahasa
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as WhatsAppStyle)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
              >
                {STYLE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Tanggal Kejadian / Rekap
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg"
              />
            </div>
          </div>

          {format !== 'format_2' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Pilih Data Kejadian Sumber ({sortedIncidents.length} tersimpan)
              </label>
              <select
                value={selectedIncidentId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setSelectedIncidentId(nextId);
                  const found = sortedIncidents.find((i) => i.id === nextId);
                  if (found) setSelectedDate(found.identitas.tanggalKejadian);
                }}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white"
              >
                <option value="">-- Gunakan kejadian tanggal terpilih --</option>
                {sortedIncidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.identitas.tanggalKejadian} · {inc.identitas.jenisKejadian} ({inc.identitas.kecamatan})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 border-t border-neutral-100 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={buildReport}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              GENERATE LAPORAN
            </button>

            <button
              type="button"
              onClick={buildReport}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              GENERATE ULANG
            </button>
          </div>
        </div>

        {/* Right Output, Editor & WhatsApp Preview Panel */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                Pratinjau &amp; Editor Narasi WhatsApp Status
              </h2>
              <div className="text-xs text-neutral-500 mt-0.5 font-mono">
                Panjang teks: <strong className={overLimitFormat4 ? 'text-red-600' : 'text-neutral-900'}>{charCount}</strong> karakter
                {format === 'format_4' && ' (batas maksimal 700 karakter)'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                isEditing
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'SELESAI EDIT' : 'EDIT NARASI'}
            </button>
          </div>

          {isEditing ? (
            <textarea
              rows={18}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              className="w-full p-4 text-xs md:text-sm font-sans leading-relaxed border border-[#EA580C] rounded-xl focus:outline-none bg-neutral-50"
            />
          ) : (
            <div className="bg-[#ECE5DD] border border-neutral-200 rounded-xl p-4 md:p-6">
              <div className="bg-white rounded-xl p-4 shadow-sm max-w-xl">
                <pre className="whitespace-pre-wrap font-sans text-xs md:text-[13px] leading-relaxed text-neutral-900">
                  {narrative}
                </pre>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => handleCopyText(narrative)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'TERSALIN' : 'COPY TEKS'}
            </button>

            <button
              type="button"
              onClick={() => handleCopyText(narrative)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              SALIN SEMUA
            </button>

            <button
              type="button"
              onClick={() => {
                downloadTextFile(
                  narrative,
                  `Status_WA_BPBD_Palembang_${selectedDate}.txt`
                );
                notify('success', 'TXT Diunduh', 'Berkas narasi WhatsApp berhasil diunduh.');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg cursor-pointer"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD TXT
            </button>

            <button
              type="button"
              onClick={handleSaveArchive}
              disabled={savingArchive}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-60 text-neutral-800 text-xs font-semibold rounded-lg cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              {savingArchive ? 'MENYIMPAN...' : 'SIMPAN ARSIP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
