import React, { useEffect, useState } from 'react';
import {
  Save,
  Upload,
  Download,
  Shield,
  Database,
  Trash2,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { FIREBASE_META } from '../lib/firebase';
import { Incident, UserRole } from '../types/bpbd';
import { fileToCompressedDataUrl, getTodayIsoDate } from '../utils/formatters';
import { BpbdPalembangLogo, PemkotPalembangLogo } from './InstitutionalLogos';

export function SettingsView() {
  const {
    userProfile,
    usersList,
    agencySettings,
    incidents,
    saveAgencySettings,
    updateUserRole,
    updateOwnProfile,
    restoreBackupData,
    notify,
  } = useFirebaseData();

  const isAdmin = userProfile?.role === 'Admin';

  // Own profile
  const [myName, setMyName] = useState(userProfile?.displayName || '');
  const [myJabatan, setMyJabatan] = useState(userProfile?.jabatan || '');

  // Agency settings
  const [agencyName, setAgencyName] = useState(agencySettings.agencyName);
  const [subUnitName, setSubUnitName] = useState(agencySettings.subUnitName);
  const [cityGovernmentName, setCityGovernmentName] = useState(agencySettings.cityGovernmentName);
  const [address, setAddress] = useState(agencySettings.address);
  const [callCenter, setCallCenter] = useState(agencySettings.callCenter);
  const [email, setEmail] = useState(agencySettings.email);
  const [kepalaPelaksana, setKepalaPelaksana] = useState(agencySettings.kepalaPelaksana);
  const [nipKepala, setNipKepala] = useState(agencySettings.nipKepala);
  const [logoPemkot, setLogoPemkot] = useState(agencySettings.logoPemkotDataUrl);
  const [logoBpbd, setLogoBpbd] = useState(agencySettings.logoBpbdDataUrl);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    setMyName(userProfile?.displayName || '');
    setMyJabatan(userProfile?.jabatan || '');
  }, [userProfile]);

  useEffect(() => {
    setAgencyName(agencySettings.agencyName);
    setSubUnitName(agencySettings.subUnitName);
    setCityGovernmentName(agencySettings.cityGovernmentName);
    setAddress(agencySettings.address);
    setCallCenter(agencySettings.callCenter);
    setEmail(agencySettings.email);
    setKepalaPelaksana(agencySettings.kepalaPelaksana);
    setNipKepala(agencySettings.nipKepala);
    setLogoPemkot(agencySettings.logoPemkotDataUrl);
    setLogoBpbd(agencySettings.logoBpbdDataUrl);
  }, [agencySettings]);

  const handleLogoUpload = async (
    target: 'pemkot' | 'bpbd',
    file: File | undefined
  ) => {
    if (!file) return;
    try {
      const res = await fileToCompressedDataUrl(file, 400, 0.85);
      if (target === 'pemkot') setLogoPemkot(res.dataUrl);
      else setLogoBpbd(res.dataUrl);
      notify('info', 'Logo Siap Disimpan', 'Klik Simpan Pengaturan Instansi untuk menerapkan logo.');
    } catch (err) {
      notify(
        'error',
        'Gagal Memuat Logo',
        err instanceof Error ? err.message : 'Format gambar tidak didukung.'
      );
    }
  };

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    if (!agencyName.trim()) {
      setSettingsError('Nama instansi tidak boleh kosong.');
      notify('error', 'Validasi Pengaturan', 'Nama instansi wajib diisi.');
      return;
    }
    setSavingSettings(true);
    try {
      await saveAgencySettings({
        agencyName: agencyName.trim(),
        subUnitName: subUnitName.trim(),
        cityGovernmentName: cityGovernmentName.trim(),
        address: address.trim(),
        callCenter: callCenter.trim(),
        email: email.trim(),
        kepalaPelaksana: kepalaPelaksana.trim(),
        nipKepala: nipKepala.trim(),
        logoPemkotDataUrl: logoPemkot,
        logoBpbdDataUrl: logoBpbd,
      });
    } catch (err) {
      let msg = 'Gagal menyimpan pengaturan ke Firestore.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) msg = parsed.error;
        } catch {
          msg = err.message;
        }
      }
      setSettingsError(msg);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDownloadBackupJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      agency: 'BPBD Kota Palembang',
      version: 1,
      incidents,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Pusdalops_BPBD_${getTodayIsoDate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('success', 'Backup Diunduh', `${incidents.length} data kejadian dicadangkan ke berkas JSON.`);
  };

  const handleRestoreJsonFile = async (file: File | undefined) => {
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { incidents?: Incident[] };
      if (!Array.isArray(parsed.incidents)) {
        notify('error', 'Format Backup Tidak Valid', 'Berkas JSON harus memiliki array incidents.');
        return;
      }
      await restoreBackupData(parsed.incidents);
    } catch (err) {
      notify(
        'error',
        'Gagal Restore Backup',
        err instanceof Error ? err.message : 'Berkas JSON rusak atau tidak sesuai.'
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Profil Petugas Aktif */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-2.5">
          <UserCheck className="w-4 h-4 text-[#EA580C]" />
          <h2 className="text-sm font-bold text-neutral-900">Profil Petugas Aktif</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Nama Petugas
            </label>
            <input
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Jabatan / Regu Piket
            </label>
            <input
              type="text"
              value={myJabatan}
              onChange={(e) => setMyJabatan(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs">
              <div className="text-neutral-500">Peran Anda</div>
              <div className="font-bold text-[#EA580C]">{userProfile?.role}</div>
            </div>
            <button
              type="button"
              disabled={savingProfile}
              onClick={async () => {
                setSavingProfile(true);
                try {
                  await updateOwnProfile(myName, myJabatan);
                } catch {
                  // Notifikasi error ditangani oleh FirebaseDataContext
                } finally {
                  setSavingProfile(false);
                }
              }}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Logo Instansi & Identitas BPBD Kota Palembang */}
      <form
        onSubmit={handleSaveAgency}
        noValidate
        className="bg-white border border-neutral-200 rounded-xl p-5 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <h2 className="text-sm font-bold text-neutral-900">
            Identitas Instansi &amp; Slot Logo Resmi
          </h2>
          {!isAdmin && (
            <span className="text-xs text-neutral-500">Hanya Admin yang dapat mengubah</span>
          )}
        </div>

        {settingsError && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2.5 text-red-800 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Pengaturan Belum Tersimpan</div>
              <div className="mt-0.5">{settingsError}</div>
            </div>
          </div>
        )}

        {/* Logo Upload Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border border-neutral-200 rounded-xl p-4 flex items-center gap-4">
            <PemkotPalembangLogo dataUrl={logoPemkot} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-neutral-900">
                Logo Pemerintah Kota Palembang
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5 mb-2">
                Ditampilkan pada Header, Sidebar, dan Kop Laporan PDF.
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Unggah Logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => handleLogoUpload('pemkot', e.target.files?.[0])}
                    />
                  </label>
                  {logoPemkot && (
                    <button
                      type="button"
                      onClick={() => setLogoPemkot('')}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      title="Hapus logo kustom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border border-neutral-200 rounded-xl p-4 flex items-center gap-4">
            <BpbdPalembangLogo dataUrl={logoBpbd} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-neutral-900">
                Logo BPBD Kota Palembang
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5 mb-2">
                Ditampilkan pada Header, Sidebar, dan Kop Laporan PDF.
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Unggah Logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => handleLogoUpload('bpbd', e.target.files?.[0])}
                    />
                  </label>
                  {logoBpbd && (
                    <button
                      type="button"
                      onClick={() => setLogoBpbd('')}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      title="Hapus logo kustom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agency Text Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Nama Pemerintah Daerah
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={cityGovernmentName}
              onChange={(e) => setCityGovernmentName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg disabled:bg-neutral-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Nama Instansi
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg disabled:bg-neutral-50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Unit Pengendali Operasi
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={subUnitName}
              onChange={(e) => setSubUnitName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg disabled:bg-neutral-50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Alamat Posko Pusdalops
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg disabled:bg-neutral-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Kepala Pelaksana (Tanda Tangan Laporan)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={kepalaPelaksana}
              onChange={(e) => setKepalaPelaksana(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg disabled:bg-neutral-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              NIP Kepala Pelaksana
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={nipKepala}
              onChange={(e) => setNipKepala(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-neutral-300 rounded-lg disabled:bg-neutral-50"
            />
          </div>
        </div>

        {isAdmin && (
          <button
            type="submit"
            disabled={savingSettings}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Simpan Pengaturan Instansi
          </button>
        )}
      </form>

      {/* 3. Manajemen Peran Pengguna (Admin Only) */}
      {isAdmin && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-2.5">
            <Shield className="w-4 h-4 text-[#EA580C]" />
            <h2 className="text-sm font-bold text-neutral-900">
              Manajemen Peran Pengguna (Admin · Operator Pusdalops · Petugas Input)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="py-2 text-left font-semibold">Nama</th>
                  <th className="py-2 text-left font-semibold">Email</th>
                  <th className="py-2 text-left font-semibold">Peran</th>
                  <th className="py-2 text-left font-semibold">Status Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {usersList.map((u) => (
                  <tr key={u.uid}>
                    <td className="py-2.5 font-semibold text-neutral-900">{u.displayName}</td>
                    <td className="py-2.5 font-mono text-neutral-600">{u.email}</td>
                    <td className="py-2.5">
                      <select
                        value={u.role}
                        onChange={async (e) => {
                          try {
                            await updateUserRole(u.uid, e.target.value as UserRole, u.active);
                          } catch {
                            // Notifikasi error ditangani oleh FirebaseDataContext
                          }
                        }}
                        className="px-2.5 py-1 text-xs border border-neutral-300 rounded-md bg-white"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Operator Pusdalops">Operator Pusdalops</option>
                        <option value="Petugas Input">Petugas Input</option>
                      </select>
                    </td>
                    <td className="py-2.5">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateUserRole(u.uid, u.role, !u.active);
                          } catch {
                            // Notifikasi error ditangani oleh FirebaseDataContext
                          }
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {u.active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Backup & Restore Data */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-2.5">
          <Database className="w-4 h-4 text-[#EA580C]" />
          <h2 className="text-sm font-bold text-neutral-900">
            Backup &amp; Restore Database Firestore
          </h2>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">
          Cadangkan seluruh data kejadian dalam format JSON dan pulihkan kembali kapan saja jika diperlukan.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadBackupJson}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download Backup JSON ({incidents.length} Kejadian)
          </button>

          {isAdmin && (
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg cursor-pointer">
              <Upload className="w-4 h-4" />
              {restoring ? 'Memulihkan...' : 'Restore dari Berkas JSON'}
              <input
                type="file"
                accept=".json,application/json"
                disabled={restoring}
                className="hidden"
                onChange={(e) => handleRestoreJsonFile(e.target.files?.[0])}
              />
            </label>
          )}
        </div>
      </div>

      {/* 5. Petunjuk Konfigurasi Firebase */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-bold text-neutral-900">
          Informasi Integrasi &amp; Konfigurasi Firebase Firestore
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono">
          <div>
            <span className="text-neutral-500">Project ID: </span>
            <span className="text-neutral-900 font-semibold">{FIREBASE_META.projectId}</span>
          </div>
          <div>
            <span className="text-neutral-500">Firestore Database ID: </span>
            <span className="text-neutral-900 font-semibold">{FIREBASE_META.firestoreDatabaseId}</span>
          </div>
        </div>
        <ol className="list-decimal list-inside text-xs text-neutral-600 space-y-1.5 leading-relaxed">
          <li>
            Konfigurasi proyek Firebase tersimpan pada berkas <code className="font-mono text-neutral-900">firebase-applet-config.json</code> dan aturan keamanan pada <code className="font-mono text-neutral-900">firestore.rules</code>.
          </li>
          <li>
            Koleksi Firestore aktif meliputi <code className="font-mono">incidents</code> (kejadian, korban, penanganan), <code className="font-mono">handling_logs</code>, <code className="font-mono">documentations</code>, <code className="font-mono">reports</code>, <code className="font-mono">settings</code>, dan <code className="font-mono">users</code>.
          </li>
          <li>
            Autentikasi menggunakan Google Sign-In terverifikasi dengan pembagian peran Admin, Operator Pusdalops, dan Petugas Input.
          </li>
        </ol>
      </div>
    </div>
  );
}
