import React, { useEffect, useState } from 'react';
import {
  Save,
  RotateCcw,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import {
  DocCategory,
  DocumentationItem,
  Incident,
  JENIS_KEJADIAN_LIST,
  KECAMATAN_PALEMBANG,
  STATUS_PENANGANAN_LIST,
  StatusPenanganan,
} from '../types/bpbd';
import {
  generateDocId,
  generateNomorLaporan,
  getCurrentTimeHHMM,
  getHariFromIsoDate,
  getTodayIsoDate,
  parseNullableFloatInput,
  parseNullableIntInput,
} from '../utils/formatters';
import { useFirebaseData } from '../context/FirebaseDataContext';

interface IncidentFormViewProps {
  editingIncident: Incident | null;
  onCancelEdit: () => void;
  onSaved: () => void;
}

interface PendingUpload {
  id: string;
  category: DocCategory;
  file: File;
  caption: string;
  previewUrl: string;
}

export function IncidentFormView({
  editingIncident,
  onCancelEdit,
  onSaved,
}: IncidentFormViewProps) {
  const {
    incidents,
    documentations,
    userProfile,
    saveIncident,
    deleteIncident,
    uploadDocumentation,
    deleteDocumentation,
    notify,
  } = useFirebaseData();

  const today = getTodayIsoDate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [nomorManuallyEdited, setNomorManuallyEdited] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  // Section A: Identitas
  const [nomorLaporan, setNomorLaporan] = useState('');
  const [tanggalKejadian, setTanggalKejadian] = useState(today);
  const [hariKejadian, setHariKejadian] = useState(getHariFromIsoDate(today));
  const [waktuKejadian, setWaktuKejadian] = useState(getCurrentTimeHHMM());
  const [jenisKejadian, setJenisKejadian] = useState<string>(JENIS_KEJADIAN_LIST[0]);
  const [lokasiKejadian, setLokasiKejadian] = useState('');
  const [kecamatan, setKecamatan] = useState<string>(KECAMATAN_PALEMBANG[0]);
  const [kelurahan, setKelurahan] = useState('');
  const [alamatLengkap, setAlamatLengkap] = useState('');
  const [titikKoordinat, setTitikKoordinat] = useState('');
  const [sumberInformasi, setSumberInformasi] = useState('');
  const [waktuLaporanDiterima, setWaktuLaporanDiterima] = useState(getCurrentTimeHHMM());

  // Section B: Data Kejadian
  const [kronologi, setKronologi] = useState('');
  const [penyebab, setPenyebab] = useState('');
  const [kondisiTerkini, setKondisiTerkini] = useState('');
  const [dampakKejadian, setDampakKejadian] = useState('');
  const [luasAreaStr, setLuasAreaStr] = useState('');
  const [rumahStr, setRumahStr] = useState('');
  const [fasumStr, setFasumStr] = useState('');

  // Section C: Data Korban (empty string = null/belum tersedia, "0" = 0)
  const [meninggalStr, setMeninggalStr] = useState('');
  const [lukaStr, setLukaStr] = useState('');
  const [hilangStr, setHilangStr] = useState('');
  const [mengungsiStr, setMengungsiStr] = useState('');
  const [terdampakStr, setTerdampakStr] = useState('');
  const [kkStr, setKkStr] = useState('');

  // Section D: Data Penanganan
  const [instansiTerlibat, setInstansiTerlibat] = useState('BPBD Kota Palembang');
  const [personelStr, setPersonelStr] = useState('');
  const [unsurTerlibat, setUnsurTerlibat] = useState('TRC BPBD Kota Palembang');
  const [peralatanDigunakan, setPeralatanDigunakan] = useState('');
  const [tindakanPenanganan, setTindakanPenanganan] = useState('');
  const [waktuMulai, setWaktuMulai] = useState('');
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [statusPenanganan, setStatusPenanganan] = useState<StatusPenanganan>('Dalam Penanganan');
  const [keteranganTambahan, setKeteranganTambahan] = useState('');

  // Section E: Dokumentasi
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [docCaption, setDocCaption] = useState('');

  const resetForm = (targetDate = getTodayIsoDate()) => {
    setTanggalKejadian(targetDate);
    setHariKejadian(getHariFromIsoDate(targetDate));
    setNomorLaporan(
      generateNomorLaporan(
        incidents.map((i) => i.identitas.nomorLaporan),
        targetDate
      )
    );
    setWaktuKejadian(getCurrentTimeHHMM());
    setJenisKejadian(JENIS_KEJADIAN_LIST[0]);
    setLokasiKejadian('');
    setKecamatan(KECAMATAN_PALEMBANG[0]);
    setKelurahan('');
    setAlamatLengkap('');
    setTitikKoordinat('');
    setSumberInformasi('');
    setWaktuLaporanDiterima(getCurrentTimeHHMM());

    setKronologi('');
    setPenyebab('');
    setKondisiTerkini('');
    setDampakKejadian('');
    setLuasAreaStr('');
    setRumahStr('');
    setFasumStr('');

    setMeninggalStr('');
    setLukaStr('');
    setHilangStr('');
    setMengungsiStr('');
    setTerdampakStr('');
    setKkStr('');

    setInstansiTerlibat('BPBD Kota Palembang');
    setPersonelStr('');
    setUnsurTerlibat('TRC BPBD Kota Palembang');
    setPeralatanDigunakan('');
    setTindakanPenanganan('');
    setWaktuMulai('');
    setWaktuSelesai('');
    setStatusPenanganan('Dalam Penanganan');
    setKeteranganTambahan('');
    setPendingUploads((prev) => {
      prev.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
      return [];
    });
    setDocCaption('');
    setFormError('');
    setNomorManuallyEdited(false);
    setJustCreatedId(null);
  };

  useEffect(() => {
    if (!editingIncident && !nomorManuallyEdited) {
      setNomorLaporan(
        generateNomorLaporan(
          incidents.map((i) => i.identitas.nomorLaporan),
          tanggalKejadian
        )
      );
    }
  }, [incidents, tanggalKejadian, editingIncident, nomorManuallyEdited]);

  useEffect(() => {
    if (editingIncident) {
      const { identitas, dataKejadian, korban, penanganan } = editingIncident;
      setNomorLaporan(identitas.nomorLaporan);
      setTanggalKejadian(identitas.tanggalKejadian);
      setHariKejadian(identitas.hariKejadian);
      setWaktuKejadian(identitas.waktuKejadian);
      setJenisKejadian(identitas.jenisKejadian);
      setLokasiKejadian(identitas.lokasiKejadian);
      setKecamatan(identitas.kecamatan);
      setKelurahan(identitas.kelurahan);
      setAlamatLengkap(identitas.alamatLengkap);
      setTitikKoordinat(identitas.titikKoordinat);
      setSumberInformasi(identitas.sumberInformasi);
      setWaktuLaporanDiterima(identitas.waktuLaporanDiterima);

      setKronologi(dataKejadian.kronologi);
      setPenyebab(dataKejadian.penyebab);
      setKondisiTerkini(dataKejadian.kondisiTerkini);
      setDampakKejadian(dataKejadian.dampakKejadian);
      setLuasAreaStr(dataKejadian.luasAreaHa !== null ? String(dataKejadian.luasAreaHa) : '');
      setRumahStr(
        dataKejadian.jumlahRumahTerdampak !== null ? String(dataKejadian.jumlahRumahTerdampak) : ''
      );
      setFasumStr(
        dataKejadian.jumlahFasumTerdampak !== null ? String(dataKejadian.jumlahFasumTerdampak) : ''
      );

      setMeninggalStr(korban.meninggal !== null ? String(korban.meninggal) : '');
      setLukaStr(korban.lukaLuka !== null ? String(korban.lukaLuka) : '');
      setHilangStr(korban.hilang !== null ? String(korban.hilang) : '');
      setMengungsiStr(korban.mengungsi !== null ? String(korban.mengungsi) : '');
      setTerdampakStr(korban.terdampakJiwa !== null ? String(korban.terdampakJiwa) : '');
      setKkStr(korban.kkTerdampak !== null ? String(korban.kkTerdampak) : '');

      setInstansiTerlibat(penanganan.instansiTerlibat);
      setPersonelStr(penanganan.jumlahPersonel !== null ? String(penanganan.jumlahPersonel) : '');
      setUnsurTerlibat(penanganan.unsurTerlibat);
      setPeralatanDigunakan(penanganan.peralatanDigunakan);
      setTindakanPenanganan(penanganan.tindakanPenanganan);
      setWaktuMulai(penanganan.waktuMulai);
      setWaktuSelesai(penanganan.waktuSelesai);
      setStatusPenanganan(penanganan.statusPenanganan);
      setKeteranganTambahan(penanganan.keteranganTambahan);
      setPendingUploads([]);
    } else {
      resetForm(getTodayIsoDate());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingIncident?.id]);

  const handleDateChange = (nextDate: string) => {
    setTanggalKejadian(nextDate);
    setHariKejadian(getHariFromIsoDate(nextDate));
    if (!editingIncident && !nomorManuallyEdited) {
      setNomorLaporan(
        generateNomorLaporan(
          incidents.map((i) => i.identitas.nomorLaporan),
          nextDate
        )
      );
    }
  };

  const handleSelectFiles = (category: DocCategory, fileList: FileList | null) => {
    if (!fileList) return;
    const added: PendingUpload[] = [];
    for (let i = 0; i < fileList.length; i += 1) {
      const file = fileList[i];
      added.push({
        id: generateDocId('pend'),
        category,
        file,
        caption: docCaption || file.name,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      });
    }
    setPendingUploads((prev) => [...prev, ...added]);
  };

  const existingDocsForIncident: DocumentationItem[] = editingIncident
    ? documentations.filter((d) => d.incidentId === editingIncident.id)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (nomorLaporan.trim().length < 5) {
      const msg = 'Nomor laporan minimal 5 karakter.';
      setFormError(msg);
      notify('error', 'Validasi Formulir', msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalKejadian)) {
      const msg = 'Tanggal kejadian wajib diisi dengan format yang valid.';
      setFormError(msg);
      notify('error', 'Validasi Formulir', msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!lokasiKejadian.trim()) {
      const msg = 'Lokasi kejadian wajib diisi sebelum menyimpan data.';
      setFormError(msg);
      notify('error', 'Validasi Formulir', msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    let incidentPersisted = Boolean(editingIncident || justCreatedId);
    try {
      const targetId = editingIncident
        ? editingIncident.id
        : justCreatedId || generateDocId('inc');
      const isEditMode = Boolean(editingIncident || justCreatedId);
      const existingDocCount = editingIncident ? existingDocsForIncident.length : 0;

      await saveIncident(
        {
          id: targetId,
          identitas: {
            nomorLaporan: nomorLaporan.trim().slice(0, 64),
            tanggalKejadian,
            hariKejadian: hariKejadian || getHariFromIsoDate(tanggalKejadian),
            waktuKejadian: waktuKejadian.trim().slice(0, 16),
            jenisKejadian,
            lokasiKejadian: lokasiKejadian.trim().slice(0, 200),
            kecamatan,
            kelurahan: kelurahan.trim().slice(0, 80),
            alamatLengkap: alamatLengkap.trim().slice(0, 500),
            titikKoordinat: titikKoordinat.trim().slice(0, 80),
            sumberInformasi: sumberInformasi.trim().slice(0, 160),
            waktuLaporanDiterima: waktuLaporanDiterima.trim().slice(0, 32),
          },
          dataKejadian: {
            kronologi: kronologi.trim().slice(0, 4000),
            penyebab: penyebab.trim().slice(0, 1000),
            kondisiTerkini: kondisiTerkini.trim().slice(0, 1500),
            dampakKejadian: dampakKejadian.trim().slice(0, 1500),
            luasAreaHa: parseNullableFloatInput(luasAreaStr),
            jumlahRumahTerdampak: parseNullableIntInput(rumahStr),
            jumlahFasumTerdampak: parseNullableIntInput(fasumStr),
          },
          korban: {
            meninggal: parseNullableIntInput(meninggalStr),
            lukaLuka: parseNullableIntInput(lukaStr),
            hilang: parseNullableIntInput(hilangStr),
            mengungsi: parseNullableIntInput(mengungsiStr),
            terdampakJiwa: parseNullableIntInput(terdampakStr),
            kkTerdampak: parseNullableIntInput(kkStr),
          },
          penanganan: {
            instansiTerlibat: instansiTerlibat.trim().slice(0, 400),
            jumlahPersonel: parseNullableIntInput(personelStr),
            unsurTerlibat: unsurTerlibat.trim().slice(0, 500),
            peralatanDigunakan: peralatanDigunakan.trim().slice(0, 500),
            tindakanPenanganan: tindakanPenanganan.trim().slice(0, 3000),
            waktuMulai: waktuMulai.trim().slice(0, 32),
            waktuSelesai: waktuSelesai.trim().slice(0, 32),
            statusPenanganan,
            keteranganTambahan: keteranganTambahan.trim().slice(0, 1500),
          },
          docCount: existingDocCount,
        },
        isEditMode
      );

      incidentPersisted = true;
      if (!editingIncident && !justCreatedId) {
        setJustCreatedId(targetId);
      }

      let runningCount = existingDocCount;
      for (const item of pendingUploads) {
        await uploadDocumentation({
          incidentId: targetId,
          category: item.category,
          file: item.file,
          caption: item.caption,
          currentDocCount: runningCount,
        });
        runningCount += 1;
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        setPendingUploads((prev) => prev.filter((p) => p.id !== item.id));
      }

      if (editingIncident) {
        onCancelEdit();
      } else {
        resetForm(getTodayIsoDate());
      }
      onSaved();
    } catch (err) {
      let readable = 'Gagal menyimpan data ke database Firestore.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) readable = parsed.error;
        } catch {
          readable = err.message;
        }
      }
      const prefix = incidentPersisted && pendingUploads.length > 0
        ? 'Data kejadian sudah tersimpan di database, tetapi unggahan lampiran gagal: '
        : '';
      setFormError(`${prefix}${readable}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCurrent = async () => {
    if (!editingIncident) return;
    setFormError('');
    setSubmitting(true);
    try {
      await deleteIncident(editingIncident.id);
      onCancelEdit();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menghapus data kejadian.');
    } finally {
      setSubmitting(false);
    }
  };

  const canDelete =
    userProfile?.role === 'Admin' || userProfile?.role === 'Operator Pusdalops';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-6xl">
      {formError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <div className="font-bold">Data Belum Tersimpan</div>
            <div className="mt-0.5">{formError}</div>
          </div>
        </div>
      )}
      {/* Top Form Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">
            {editingIncident
              ? `Edit Data Kejadian — ${editingIncident.identitas.nomorLaporan}`
              : 'Formulir Input Data Kejadian Bencana'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Kosongkan kolom angka apabila data belum diketahui (jangan diisi 0 kecuali benar-benar nihil/0).
          </p>
        </div>
        {editingIncident && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer self-start sm:self-auto"
          >
            Batal Edit / Buat Baru
          </button>
        )}
      </div>

      {/* A. IDENTITAS KEJADIAN */}
      <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2.5">
          A. Identitas Kejadian
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Nomor Laporan (Otomatis)
            </label>
            <input
              type="text"
              value={nomorLaporan}
              onChange={(e) => {
                setNomorLaporan(e.target.value);
                setNomorManuallyEdited(true);
              }}
              required
              className="w-full px-3 py-2 text-sm font-mono bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Tanggal Kejadian
            </label>
            <input
              type="date"
              value={tanggalKejadian}
              onChange={(e) => handleDateChange(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Hari Kejadian (Otomatis)
            </label>
            <input
              type="text"
              value={hariKejadian}
              readOnly
              className="w-full px-3 py-2 text-sm bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Waktu Kejadian (WIB)
            </label>
            <input
              type="time"
              value={waktuKejadian}
              onChange={(e) => setWaktuKejadian(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Jenis Kejadian
            </label>
            <select
              value={jenisKejadian}
              onChange={(e) => setJenisKejadian(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:border-[#EA580C]"
            >
              {JENIS_KEJADIAN_LIST.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Lokasi Kejadian
            </label>
            <input
              type="text"
              placeholder="Contoh: Jl. Demang Lebar Daun / Kawasan Lahan Gambut"
              value={lokasiKejadian}
              onChange={(e) => setLokasiKejadian(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Kecamatan (Kota Palembang)
            </label>
            <select
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:border-[#EA580C]"
            >
              {KECAMATAN_PALEMBANG.map((kec) => (
                <option key={kec} value={kec}>
                  {kec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Kelurahan
            </label>
            <input
              type="text"
              placeholder="Nama kelurahan"
              value={kelurahan}
              onChange={(e) => setKelurahan(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Titik Koordinat (Opsional)
            </label>
            <input
              type="text"
              placeholder="-2.976074, 104.775431"
              value={titikKoordinat}
              onChange={(e) => setTitikKoordinat(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Alamat Lengkap
            </label>
            <input
              type="text"
              placeholder="Alamat lengkap lokasi kejadian (RT/RW, patokan jalan)"
              value={alamatLengkap}
              onChange={(e) => setAlamatLengkap(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Sumber Informasi
              </label>
              <input
                type="text"
                placeholder="Warga / Camat / Call 112"
                value={sumberInformasi}
                onChange={(e) => setSumberInformasi(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Laporan Diterima
              </label>
              <input
                type="time"
                value={waktuLaporanDiterima}
                onChange={(e) => setWaktuLaporanDiterima(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* B. DATA KEJADIAN */}
      <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2.5">
          B. Data Kejadian &amp; Dampak Fisik
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Kronologi Kejadian
            </label>
            <textarea
              rows={3}
              placeholder="Uraikan kronologi kejadian secara ringkas dan faktual..."
              value={kronologi}
              onChange={(e) => setKronologi(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Penyebab Kejadian
            </label>
            <input
              type="text"
              placeholder="Contoh: Hujan deras intensitas tinggi / Korsleting listrik"
              value={penyebab}
              onChange={(e) => setPenyebab(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Kondisi Terkini
            </label>
            <input
              type="text"
              placeholder="Contoh: Api sudah padam / Air mulai surut"
              value={kondisiTerkini}
              onChange={(e) => setKondisiTerkini(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Dampak Kejadian
            </label>
            <input
              type="text"
              placeholder="Ringkasan dampak pada permukiman, akses jalan, atau lahan"
              value={dampakKejadian}
              onChange={(e) => setDampakKejadian(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Luas Area Terdampak (Ha)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Kosongkan jika belum diketahui"
                value={luasAreaStr}
                onChange={(e) => setLuasAreaStr(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Jumlah Rumah Terdampak (Unit)
              </label>
              <input
                type="number"
                min="0"
                placeholder="Kosongkan jika belum diketahui"
                value={rumahStr}
                onChange={(e) => setRumahStr(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Jumlah Fasilitas Umum Terdampak
              </label>
              <input
                type="number"
                min="0"
                placeholder="Kosongkan jika belum diketahui"
                value={fasumStr}
                onChange={(e) => setFasumStr(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* C. DATA KORBAN */}
      <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="border-b border-neutral-100 pb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">C. Data Korban</h2>
          <span className="text-xs text-neutral-500">
            Isi 0 jika dipastikan nihil; kosongkan jika data belum tersedia.
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { label: 'Meninggal Dunia (Orang)', val: meninggalStr, set: setMeninggalStr },
            { label: 'Luka-Luka (Orang)', val: lukaStr, set: setLukaStr },
            { label: 'Hilang (Orang)', val: hilangStr, set: setHilangStr },
            { label: 'Mengungsi (Orang)', val: mengungsiStr, set: setMengungsiStr },
            { label: 'Terdampak (Jiwa)', val: terdampakStr, set: setTerdampakStr },
            { label: 'Kepala Keluarga (KK)', val: kkStr, set: setKkStr },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                {field.label}
              </label>
              <input
                type="number"
                min="0"
                placeholder="-"
                value={field.val}
                onChange={(e) => field.set(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          ))}
        </div>
      </section>

      {/* D. DATA PENANGANAN */}
      <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2.5">
          D. Data Penanganan Lapangan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Instansi yang Terlibat
            </label>
            <input
              type="text"
              value={instansiTerlibat}
              onChange={(e) => setInstansiTerlibat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Jumlah Personel Penanganan (Orang)
            </label>
            <input
              type="number"
              min="0"
              placeholder="Kosongkan jika belum diketahui"
              value={personelStr}
              onChange={(e) => setPersonelStr(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Status Penanganan
            </label>
            <select
              value={statusPenanganan}
              onChange={(e) => setStatusPenanganan(e.target.value as StatusPenanganan)}
              className="w-full px-3 py-2 text-sm font-semibold border border-neutral-300 rounded-lg bg-white focus:outline-none focus:border-[#EA580C]"
            >
              {STATUS_PENANGANAN_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Unsur yang Terlibat
            </label>
            <input
              type="text"
              placeholder="TRC BPBD, Damkar, TNI, Polri, Relawan"
              value={unsurTerlibat}
              onChange={(e) => setUnsurTerlibat(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Peralatan yang Digunakan
            </label>
            <input
              type="text"
              placeholder="Mesin pompa, perahu karet, chainsaw, APD"
              value={peralatanDigunakan}
              onChange={(e) => setPeralatanDigunakan(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Waktu Mulai
              </label>
              <input
                type="time"
                value={waktuMulai}
                onChange={(e) => setWaktuMulai(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Waktu Selesai
              </label>
              <input
                type="time"
                value={waktuSelesai}
                onChange={(e) => setWaktuSelesai(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Tindakan Penanganan
            </label>
            <textarea
              rows={3}
              placeholder="Uraikan langkah pemadaman, evakuasi, atau penanganan oleh TRC BPBD dan unsur terkait..."
              value={tindakanPenanganan}
              onChange={(e) => setTindakanPenanganan(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Keterangan Tambahan
            </label>
            <input
              type="text"
              placeholder="Catatan tambahan lapangan atau kebutuhan mendesak"
              value={keteranganTambahan}
              onChange={(e) => setKeteranganTambahan(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
            />
          </div>
        </div>
      </section>

      {/* E. DOKUMENTASI */}
      <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="border-b border-neutral-100 pb-2.5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">E. Dokumentasi Kejadian &amp; Penanganan</h2>
          <span className="text-xs text-neutral-500">
            Foto otomatis dikompresi agar tersimpan aman di Firestore.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="border border-dashed border-neutral-300 hover:border-[#EA580C] rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
            <ImageIcon className="w-5 h-5 text-[#EA580C] mb-1.5" />
            <span className="text-xs font-semibold text-neutral-800">Upload Foto Kejadian</span>
            <span className="text-[11px] text-neutral-500 mt-0.5">JPG / PNG</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleSelectFiles('foto_kejadian', e.target.files)}
            />
          </label>

          <label className="border border-dashed border-neutral-300 hover:border-[#EA580C] rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
            <Upload className="w-5 h-5 text-[#EA580C] mb-1.5" />
            <span className="text-xs font-semibold text-neutral-800">Upload Foto Penanganan</span>
            <span className="text-[11px] text-neutral-500 mt-0.5">JPG / PNG</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleSelectFiles('foto_penanganan', e.target.files)}
            />
          </label>

          <label className="border border-dashed border-neutral-300 hover:border-[#EA580C] rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
            <FileText className="w-5 h-5 text-neutral-700 mb-1.5" />
            <span className="text-xs font-semibold text-neutral-800">Upload Dokumen Pendukung</span>
            <span className="text-[11px] text-neutral-500 mt-0.5">PDF / Dokumen (Maks 450 KB)</span>
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              className="hidden"
              onChange={(e) => handleSelectFiles('dokumen_pendukung', e.target.files)}
            />
          </label>
        </div>

        <input
          type="text"
          placeholder="Keterangan / caption lampiran (opsional)"
          value={docCaption}
          onChange={(e) => setDocCaption(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-[#EA580C]"
        />

        {(pendingUploads.length > 0 || existingDocsForIncident.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {existingDocsForIncident.map((d) => (
              <div
                key={d.id}
                className="border border-neutral-200 rounded-lg p-2.5 flex items-center justify-between gap-2 bg-neutral-50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {d.mimeType.startsWith('image/') ? (
                    <img
                      src={d.dataUrl}
                      alt={d.fileName}
                      className="w-10 h-10 object-cover rounded shrink-0"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-neutral-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-neutral-800 truncate">
                      {d.fileName}
                    </div>
                    <div className="text-[11px] text-neutral-500">{d.category}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteDocumentation(d, existingDocsForIncident.length);
                    } catch {
                      // Notifikasi error ditangani oleh FirebaseDataContext
                    }
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                  aria-label="Hapus lampiran"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {pendingUploads.map((p) => (
              <div
                key={p.id}
                className="border border-orange-200 rounded-lg p-2.5 flex items-center justify-between gap-2 bg-orange-50/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {p.previewUrl ? (
                    <img
                      src={p.previewUrl}
                      alt={p.file.name}
                      className="w-10 h-10 object-cover rounded shrink-0"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-[#EA580C] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-neutral-800 truncate">
                      {p.file.name}
                    </div>
                    <div className="text-[11px] text-[#C2410C]">Siap diunggah ({p.category})</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
                    setPendingUploads((prev) => prev.filter((item) => item.id !== p.id));
                  }}
                  className="p-1.5 text-neutral-500 hover:text-red-600 rounded cursor-pointer"
                  aria-label="Batalkan lampiran"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action Buttons: SIMPAN, EDIT, HAPUS, RESET */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
          >
            {editingIncident ? <Edit3 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>
              {submitting
                ? 'Menyimpan ke Database...'
                : editingIncident
                ? 'EDIT / SIMPAN PERUBAHAN'
                : 'SIMPAN DATA'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => resetForm(getTodayIsoDate())}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET</span>
          </button>
        </div>

        {editingIncident && canDelete && (
          <button
            type="button"
            onClick={handleDeleteCurrent}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>HAPUS</span>
          </button>
        )}
      </div>
    </form>
  );
}
