import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock, Eye, Send } from 'lucide-react';
import { Incident, STATUS_PENANGANAN_LIST, StatusPenanganan } from '../types/bpbd';
import { sortIncidentsNewest } from '../utils/aggregations';
import { formatTanggalSingkat, getCurrentTimeHHMM } from '../utils/formatters';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { StatusLabel } from './StatusText';

export function MonitoringView({
  onInspectIncident,
}: {
  onInspectIncident: (incident: Incident) => void;
}) {
  const { incidents, handlingLogs, userProfile, addHandlingUpdate } = useFirebaseData();
  const [filterTab, setFilterTab] = useState<'aktif' | 'semua'>('aktif');
  const [selectedId, setSelectedId] = useState<string>('');
  const [nextStatus, setNextStatus] = useState<StatusPenanganan>('Monitoring');
  const [catatan, setCatatan] = useState('');
  const [kondisiTerkini, setKondisiTerkini] = useState('');
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const sorted = useMemo(() => sortIncidentsNewest(incidents), [incidents]);
  const displayed = useMemo(
    () =>
      filterTab === 'aktif'
        ? sorted.filter((i) => i.penanganan.statusPenanganan !== 'Selesai')
        : sorted,
    [sorted, filterTab]
  );

  const activeIncident = useMemo(
    () => sorted.find((i) => i.id === selectedId) || displayed[0] || null,
    [sorted, displayed, selectedId]
  );

  useEffect(() => {
    if (activeIncident) {
      setNextStatus(activeIncident.penanganan.statusPenanganan);
      setKondisiTerkini(activeIncident.dataKejadian.kondisiTerkini);
      setWaktuSelesai(activeIncident.penanganan.waktuSelesai || getCurrentTimeHHMM());
      setUpdateError('');
    }
  }, [activeIncident?.id]);

  const canUpdateStatus =
    userProfile?.role === 'Admin' || userProfile?.role === 'Operator Pusdalops';

  const handleSelect = (inc: Incident) => {
    setSelectedId(inc.id);
    setNextStatus(inc.penanganan.statusPenanganan);
    setKondisiTerkini(inc.dataKejadian.kondisiTerkini);
    setWaktuSelesai(inc.penanganan.waktuSelesai || getCurrentTimeHHMM());
    setCatatan('');
    setUpdateError('');
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    if (!activeIncident) return;
    if (!catatan.trim()) {
      setUpdateError('Catatan progres penanganan wajib diisi sebelum menyimpan update.');
      return;
    }
    setSaving(true);
    try {
      await addHandlingUpdate({
        incident: activeIncident,
        statusBaru: nextStatus,
        catatan,
        kondisiTerkini,
        waktuSelesai: nextStatus === 'Selesai' ? waktuSelesai || getCurrentTimeHHMM() : activeIncident.penanganan.waktuSelesai,
      });
      setCatatan('');
    } catch (err) {
      let msg = 'Gagal menyimpan pembaruan monitoring.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) msg = parsed.error;
        } catch {
          msg = err.message;
        }
      }
      setUpdateError(msg);
    } finally {
      setSaving(false);
    }
  };

  const activeLogs = activeIncident
    ? handlingLogs.filter((l) => l.incidentId === activeIncident.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">
            Monitoring Penanganan Kejadian Bencana
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Pembaruan status penanganan tercatat dalam log operasional tanpa menggandakan jumlah korban.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterTab('aktif')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
              filterTab === 'aktif' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
            }`}
          >
            Aktif &amp; Monitoring ({sorted.filter((i) => i.penanganan.statusPenanganan !== 'Selesai').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('semua')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
              filterTab === 'semua' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
            }`}
          >
            Semua ({sorted.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incident Queue */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-700">
            Daftar Kejadian ({displayed.length})
          </div>
          {displayed.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              Tidak ada kejadian aktif dalam penanganan atau monitoring.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 max-h-[540px] overflow-y-auto">
              {displayed.map((inc) => {
                const isSelected = activeIncident?.id === inc.id;
                return (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => handleSelect(inc)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer ${
                      isSelected ? 'bg-orange-50/70' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-neutral-500">
                        {inc.identitas.nomorLaporan}
                      </span>
                      <StatusLabel status={inc.penanganan.statusPenanganan} />
                    </div>
                    <div className="text-sm font-bold text-neutral-900 mt-1">
                      {inc.identitas.jenisKejadian}
                    </div>
                    <div className="text-xs text-neutral-600 mt-0.5 truncate">
                      {inc.identitas.lokasiKejadian} · Kec. {inc.identitas.kecamatan}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-1">
                      {formatTanggalSingkat(inc.identitas.tanggalKejadian)} · {inc.identitas.waktuKejadian || '-'} WIB
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Monitoring Detail & Status Transition Panel */}
        <div className="lg:col-span-7 space-y-5">
          {!activeIncident ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center text-xs text-neutral-500">
              Pilih kejadian di sebelah kiri untuk memantau atau memperbarui progres penanganan.
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <div className="text-xs font-mono text-[#EA580C]">
                    {activeIncident.identitas.nomorLaporan}
                  </div>
                  <h2 className="text-base font-bold text-neutral-900 mt-0.5">
                    {activeIncident.identitas.jenisKejadian} — {activeIncident.identitas.lokasiKejadian}
                  </h2>
                  <div className="text-xs text-neutral-500 mt-1">
                    Kec. {activeIncident.identitas.kecamatan} · Unsur: {activeIncident.penanganan.unsurTerlibat || '-'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectIncident(activeIncident)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Detail Lengkap
                </button>
              </div>

              {canUpdateStatus ? (
                <form onSubmit={handleSubmitUpdate} noValidate className="space-y-4">
                  {updateError && (
                    <div
                      role="alert"
                      className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-red-800 text-xs"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{updateError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        Ubah Status Penanganan
                      </label>
                      <select
                        value={nextStatus}
                        onChange={(e) => setNextStatus(e.target.value as StatusPenanganan)}
                        className="w-full px-3 py-2 text-sm font-semibold border border-neutral-300 rounded-lg bg-white"
                      >
                        {STATUS_PENANGANAN_LIST.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {nextStatus === 'Selesai' && (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          Waktu Selesai (WIB)
                        </label>
                        <input
                          type="time"
                          value={waktuSelesai}
                          onChange={(e) => setWaktuSelesai(e.target.value)}
                          className="w-full px-3 py-2 text-sm font-mono border border-neutral-300 rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Kondisi Terkini Lapangan
                    </label>
                    <input
                      type="text"
                      value={kondisiTerkini}
                      onChange={(e) => setKondisiTerkini(e.target.value)}
                      placeholder="Perbarui kondisi terkini..."
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Catatan Progres Penanganan (Wajib)
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Contoh: Tim TRC tiba di lokasi, melakukan penyedotan genangan / pendinginan titik api..."
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Simpan Update Monitoring
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-600">
                  Perubahan status monitoring hanya dapat dilakukan oleh <strong>Operator Pusdalops</strong> atau <strong>Admin</strong>.
                </div>
              )}

              {/* Log Timeline */}
              <div className="pt-4 border-t border-neutral-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#EA580C]" />
                  Riwayat Log Penanganan ({activeLogs.length})
                </h3>
                {activeLogs.length === 0 ? (
                  <p className="text-xs text-neutral-400">
                    Belum ada catatan pembaruan monitoring untuk kejadian ini.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {activeLogs.map((log) => (
                      <div
                        key={log.id}
                        className="border border-neutral-200 rounded-lg p-3 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-semibold text-neutral-900">{log.catatan}</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            Oleh: {log.petugas}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 shrink-0">
                          {log.statusBaru === 'Selesai' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                          )}
                          {log.statusBaru}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
