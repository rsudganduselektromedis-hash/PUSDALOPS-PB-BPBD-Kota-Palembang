import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  AGENCY_CODE,
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  AgencySettings,
  DocCategory,
  DocumentationItem,
  HandlingLog,
  Incident,
  ReportArchiveItem,
  StatusPenanganan,
  ToastMessage,
  UserProfile,
  UserRole,
} from '../types/bpbd';
import { fileToCompressedDataUrl, generateDocId } from '../utils/formatters';

const OLD_DEFAULT_ADDRESS = 'Jl. Gubernur H. Bastari, Jakabaring, Kota Palembang, Sumatera Selatan';

export const DEFAULT_AGENCY_SETTINGS: AgencySettings = {
  agencyName: 'BPBD Kota Palembang',
  subUnitName: 'Pusat Pengendalian Operasi Penanggulangan Bencana (Pusdalops-PB)',
  cityGovernmentName: 'Pemerintah Kota Palembang',
  address:
    'Jl. R. Sukamto Jl. Rawasari, 20 Ilir D II, Kec. Ilir Tim. II, Kota Palembang, Sumatera Selatan 30114',
  callCenter: '0711-510011 / 112',
  email: 'pusdalops.bpbd@palembang.go.id',
  kepalaPelaksana: 'Kepala Pelaksana BPBD Kota Palembang',
  nipKepala: '',
  logoPemkotDataUrl: '',
  logoBpbdDataUrl: '',
  updatedBy: '',
};

function getReadableFirestoreMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('permission-denied') || raw.includes('Missing or insufficient permissions')) {
    return 'Izin akses ditolak Firestore. Pastikan akun Anda aktif dan memiliki peran yang sesuai.';
  }
  if (raw.includes('offline') || raw.includes('unavailable') || raw.includes('Failed to fetch')) {
    return 'Koneksi ke server Firestore terganggu atau sedang offline. Periksa jaringan internet Anda.';
  }
  if (raw.includes('Quota exceeded')) {
    return 'Kuota harian baca/tulis Firestore terlampaui.';
  }
  return raw;
}

interface FirebaseContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  authReady: boolean;
  dataLoading: boolean;
  incidents: Incident[];
  handlingLogs: HandlingLog[];
  documentations: DocumentationItem[];
  reports: ReportArchiveItem[];
  usersList: UserProfile[];
  agencySettings: AgencySettings;
  toasts: ToastMessage[];
  notify: (type: ToastMessage['type'], title: string, description?: string) => void;
  dismissToast: (id: string) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  saveIncident: (incident: Omit<Incident, 'agencyCode' | 'createdBy' | 'createdByName' | 'createdAt' | 'updatedAt'>, isEdit: boolean) => Promise<void>;
  deleteIncident: (incidentId: string) => Promise<void>;
  addHandlingUpdate: (params: {
    incident: Incident;
    statusBaru: StatusPenanganan;
    catatan: string;
    waktuSelesai?: string;
    kondisiTerkini?: string;
  }) => Promise<void>;
  uploadDocumentation: (params: {
    incidentId: string;
    category: DocCategory;
    file: File;
    caption: string;
    currentDocCount: number;
  }) => Promise<void>;
  deleteDocumentation: (docItem: DocumentationItem, currentDocCount: number) => Promise<void>;
  archiveReport: (params: {
    category: 'laporan_resmi' | 'status_whatsapp';
    reportType: string;
    title: string;
    periodLabel: string;
    content: string;
    incidentCount: number;
  }) => Promise<void>;
  deleteArchivedReport: (reportId: string) => Promise<void>;
  saveAgencySettings: (nextSettings: Omit<AgencySettings, 'updatedBy' | 'updatedAt'>) => Promise<void>;
  updateUserRole: (targetUid: string, role: UserRole, active: boolean) => Promise<void>;
  updateOwnProfile: (displayName: string, jabatan: string) => Promise<void>;
  restoreBackupData: (incidentsBackup: Incident[]) => Promise<number>;
}

const FirebaseDataContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseDataProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [handlingLogs, setHandlingLogs] = useState<HandlingLog[]>([]);
  const [documentations, setDocumentations] = useState<DocumentationItem[]>([]);
  const [reports, setReports] = useState<ReportArchiveItem[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [agencySettings, setAgencySettings] = useState<AgencySettings>(DEFAULT_AGENCY_SETTINGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = generateDocId('toast');
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auth & Profile bootstrap
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setIncidents([]);
        setHandlingLogs([]);
        setDocumentations([]);
        setReports([]);
        setUsersList([]);
        setDataLoading(false);
        setAuthReady(true);
        return;
      }

      const userPath = `users/${user.uid}`;
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const isBootstrapped =
            user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
          const newProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Petugas Pusdalops',
            email: user.email || '',
            role: isBootstrapped ? 'Admin' : 'Petugas Input',
            jabatan: isBootstrapped ? 'Administrator Pusdalops-PB' : 'Petugas Input Lapangan',
            active: true,
            agencyCode: AGENCY_CODE,
          };
          await setDoc(userRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setUserProfile(newProfile);
        } else {
          const loaded = snap.data() as UserProfile;
          const isBootstrapped =
            user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
          if (isBootstrapped && (loaded.role !== 'Admin' || !loaded.active)) {
            const promoted: UserProfile = {
              ...loaded,
              role: 'Admin',
              active: true,
            };
            await updateDoc(userRef, {
              role: 'Admin',
              active: true,
              updatedAt: serverTimestamp(),
            }).catch(() => undefined);
            setUserProfile(promoted);
          } else {
            setUserProfile(loaded);
          }
        }
      } catch (err) {
        console.error('Auth profile bootstrap error:', err);
        notify('error', 'Gagal Memuat Profil Petugas', getReadableFirestoreMessage(err));
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  // Real-time Firestore listeners once authenticated
  useEffect(() => {
    if (!authReady || !firebaseUser || !userProfile) return;

    setDataLoading(true);
    let loadedIncidents = false;
    const markReady = () => {
      if (loadedIncidents) setDataLoading(false);
    };

    const qIncidents = query(
      collection(db, 'incidents'),
      where('agencyCode', '==', AGENCY_CODE)
    );
    const unsubIncidents = onSnapshot(
      qIncidents,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Incident);
        setIncidents(list);
        loadedIncidents = true;
        markReady();
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'incidents');
      }
    );

    const qLogs = query(
      collection(db, 'handling_logs'),
      where('agencyCode', '==', AGENCY_CODE)
    );
    const unsubLogs = onSnapshot(
      qLogs,
      (snap) => {
        setHandlingLogs(snap.docs.map((d) => d.data() as HandlingLog));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'handling_logs');
      }
    );

    const qDocs = query(
      collection(db, 'documentations'),
      where('agencyCode', '==', AGENCY_CODE)
    );
    const unsubDocs = onSnapshot(
      qDocs,
      (snap) => {
        setDocumentations(snap.docs.map((d) => d.data() as DocumentationItem));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'documentations');
      }
    );

    const qReports = query(
      collection(db, 'reports'),
      where('agencyCode', '==', AGENCY_CODE)
    );
    const unsubReports = onSnapshot(
      qReports,
      (snap) => {
        setReports(snap.docs.map((d) => d.data() as ReportArchiveItem));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reports');
      }
    );

    const settingsRef = doc(db, 'settings', 'agency');
    const unsubSettings = onSnapshot(
      settingsRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AgencySettings;
          const resolvedAddress =
            !data.address || data.address === OLD_DEFAULT_ADDRESS
              ? DEFAULT_AGENCY_SETTINGS.address
              : data.address;
          setAgencySettings({
            ...DEFAULT_AGENCY_SETTINGS,
            ...data,
            address: resolvedAddress,
          });
        } else {
          setAgencySettings(DEFAULT_AGENCY_SETTINGS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/agency');
      }
    );

    const isBootstrappedAdmin =
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
    const qUsers = isBootstrappedAdmin
      ? query(collection(db, 'users'))
      : query(collection(db, 'users'), where('uid', '==', firebaseUser.uid));

    const unsubUsers = onSnapshot(
      qUsers,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as UserProfile);
        setUsersList(list);
        const self = list.find((u) => u.uid === firebaseUser.uid);
        if (self) setUserProfile(self);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    );

    return () => {
      unsubIncidents();
      unsubLogs();
      unsubDocs();
      unsubReports();
      unsubSettings();
      unsubUsers();
    };
  }, [authReady, firebaseUser, userProfile?.uid]);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      notify('success', 'Berhasil Masuk', 'Selamat datang di Sistem Pusdalops-PB BPBD Kota Palembang.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan akun Google.';
      notify('error', 'Autentikasi Gagal', msg);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      notify('info', 'Keluar Sistem', 'Sesi petugas telah diakhiri.');
    } catch (err) {
      notify('error', 'Gagal Keluar', getReadableFirestoreMessage(err));
    }
  };

  const saveIncident: FirebaseContextValue['saveIncident'] = async (payload, isEdit) => {
    if (!firebaseUser || !userProfile) {
      notify('error', 'Sesi Belum Siap', 'Silakan login ulang terlebih dahulu sebelum menyimpan.');
      throw new Error('Sesi pengguna belum siap.');
    }
    const path = `incidents/${payload.id}`;
    const ref = doc(db, 'incidents', payload.id);
    const safeCreatorName =
      (userProfile.displayName || firebaseUser.email || 'Petugas Pusdalops').trim().slice(0, 120) ||
      'Petugas Pusdalops';

    try {
      if (isEdit) {
        await updateDoc(ref, {
          identitas: payload.identitas,
          dataKejadian: payload.dataKejadian,
          korban: payload.korban,
          penanganan: payload.penanganan,
          docCount: payload.docCount,
          updatedAt: serverTimestamp(),
        });
        notify('success', 'Data Kejadian Diperbarui', `Laporan ${payload.identitas.nomorLaporan} berhasil disimpan.`);
      } else {
        await setDoc(ref, {
          ...payload,
          agencyCode: AGENCY_CODE,
          createdBy: firebaseUser.uid,
          createdByName: safeCreatorName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        notify('success', 'Kejadian Baru Tersimpan', `Nomor Laporan ${payload.identitas.nomorLaporan} masuk ke database.`);
      }
    } catch (err) {
      notify('error', 'Gagal Menyimpan Data Kejadian', getReadableFirestoreMessage(err));
      handleFirestoreError(err, isEdit ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const deleteIncident = async (incidentId: string) => {
    const path = `incidents/${incidentId}`;
    try {
      await deleteDoc(doc(db, 'incidents', incidentId));
      notify('success', 'Data Dihapus', 'Data kejadian telah dihapus dari database.');
    } catch (err) {
      notify('error', 'Gagal Menghapus Data', getReadableFirestoreMessage(err));
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const addHandlingUpdate: FirebaseContextValue['addHandlingUpdate'] = async ({
    incident,
    statusBaru,
    catatan,
    waktuSelesai,
    kondisiTerkini,
  }) => {
    if (!firebaseUser || !userProfile) return;
    const logId = generateDocId('log');
    const incPath = `incidents/${incident.id}`;
    const logPath = `handling_logs/${logId}`;

    try {
      const batch = writeBatch(db);
      const incRef = doc(db, 'incidents', incident.id);
      const nextPenanganan = {
        ...incident.penanganan,
        statusPenanganan: statusBaru,
        waktuSelesai: waktuSelesai !== undefined ? waktuSelesai : incident.penanganan.waktuSelesai,
      };
      const nextDataKejadian = {
        ...incident.dataKejadian,
        kondisiTerkini:
          kondisiTerkini !== undefined ? kondisiTerkini : incident.dataKejadian.kondisiTerkini,
      };

      batch.update(incRef, {
        penanganan: nextPenanganan,
        dataKejadian: nextDataKejadian,
        updatedAt: serverTimestamp(),
      });

      const logRef = doc(db, 'handling_logs', logId);
      batch.set(logRef, {
        id: logId,
        agencyCode: AGENCY_CODE,
        incidentId: incident.id,
        statusBaru,
        catatan: catatan.trim().slice(0, 1500),
        petugas: userProfile.displayName.slice(0, 120),
        createdBy: firebaseUser.uid,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      notify('success', 'Monitoring Diperbarui', `Status berubah menjadi "${statusBaru}".`);
    } catch (err) {
      notify('error', 'Gagal Memperbarui Monitoring', getReadableFirestoreMessage(err));
      handleFirestoreError(err, OperationType.WRITE, `${incPath} & ${logPath}`);
    }
  };

  const uploadDocumentation: FirebaseContextValue['uploadDocumentation'] = async ({
    incidentId,
    category,
    file,
    caption,
    currentDocCount,
  }) => {
    if (!firebaseUser) return;
    const docId = generateDocId('doc');
    const path = `documentations/${docId}`;
    try {
      const compressed = await fileToCompressedDataUrl(file, 1024, 0.76);
      const batch = writeBatch(db);
      batch.set(doc(db, 'documentations', docId), {
        id: docId,
        agencyCode: AGENCY_CODE,
        incidentId,
        category,
        fileName: file.name.slice(0, 180),
        mimeType: compressed.mimeType.slice(0, 100),
        sizeBytes: compressed.sizeBytes,
        dataUrl: compressed.dataUrl,
        caption: caption.trim().slice(0, 240),
        createdBy: firebaseUser.uid,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'incidents', incidentId), {
        docCount: Math.min(200, currentDocCount + 1),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      notify('success', 'Dokumentasi Terunggah', `${file.name} berhasil disimpan.`);
    } catch (err) {
      notify('error', 'Gagal Mengunggah Dokumentasi', getReadableFirestoreMessage(err));
      if (err instanceof Error && !err.message.includes('permission')) {
        throw err;
      }
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const deleteDocumentation: FirebaseContextValue['deleteDocumentation'] = async (
    docItem,
    currentDocCount
  ) => {
    const path = `documentations/${docItem.id}`;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'documentations', docItem.id));
      batch.update(doc(db, 'incidents', docItem.incidentId), {
        docCount: Math.max(0, currentDocCount - 1),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      notify('success', 'Dokumentasi Dihapus', `${docItem.fileName} telah dihapus.`);
    } catch (err) {
      notify('error', 'Gagal Menghapus Dokumentasi', getReadableFirestoreMessage(err));
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const archiveReport: FirebaseContextValue['archiveReport'] = async (params) => {
    if (!firebaseUser || !userProfile) return;
    const reportId = generateDocId('rep');
    const path = `reports/${reportId}`;
    try {
      await setDoc(doc(db, 'reports', reportId), {
        id: reportId,
        agencyCode: AGENCY_CODE,
        category: params.category,
        reportType: params.reportType.slice(0, 120),
        title: params.title.slice(0, 200),
        periodLabel: params.periodLabel.slice(0, 120),
        content: params.content.slice(0, 25000),
        incidentCount: params.incidentCount,
        createdBy: firebaseUser.uid,
        createdByName: userProfile.displayName.slice(0, 120),
        createdAt: serverTimestamp(),
      });
      notify('success', 'Laporan Diarsipkan', 'Laporan telah tersimpan ke arsip database.');
    } catch (err) {
      notify('error', 'Gagal Mengarsipkan Laporan', getReadableFirestoreMessage(err));
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const deleteArchivedReport = async (reportId: string) => {
    const path = `reports/${reportId}`;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      notify('success', 'Arsip Dihapus', 'Laporan berhasil dihapus dari arsip.');
    } catch (err) {
      notify('error', 'Gagal Menghapus Arsip', getReadableFirestoreMessage(err));
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveAgencySettings: FirebaseContextValue['saveAgencySettings'] = async (nextSettings) => {
    if (!firebaseUser) return;
    const path = 'settings/agency';
    try {
      await setDoc(doc(db, 'settings', 'agency'), {
        ...nextSettings,
        updatedBy: firebaseUser.uid,
        updatedAt: serverTimestamp(),
      });
      notify('success', 'Pengaturan Disimpan', 'Identitas instansi, alamat, dan logo resmi telah diperbarui.');
    } catch (err) {
      notify('error', 'Gagal Menyimpan Pengaturan', getReadableFirestoreMessage(err));
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const updateUserRole = async (targetUid: string, role: UserRole, active: boolean) => {
    if (!firebaseUser) return;
    const path = `users/${targetUid}`;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', targetUid), {
        role,
        active,
        updatedAt: serverTimestamp(),
      });
      if (role === 'Admin') {
        batch.set(doc(db, 'admins', targetUid), {
          uid: targetUid,
          grantedBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
        });
      } else {
        batch.delete(doc(db, 'admins', targetUid));
      }
      await batch.commit();
      notify('success', 'Peran Pengguna Diperbarui', `Hak akses diubah menjadi ${role}.`);
    } catch (err) {
      notify('error', 'Gagal Memperbarui Peran', getReadableFirestoreMessage(err));
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateOwnProfile = async (displayName: string, jabatan: string) => {
    if (!firebaseUser) return;
    const path = `users/${firebaseUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        displayName: displayName.trim().slice(0, 120) || 'Petugas Pusdalops',
        jabatan: jabatan.trim().slice(0, 120),
        updatedAt: serverTimestamp(),
      });
      notify('success', 'Profil Diperbarui', 'Nama petugas dan jabatan berhasil disimpan.');
    } catch (err) {
      notify('error', 'Gagal Memperbarui Profil', getReadableFirestoreMessage(err));
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const restoreBackupData = async (incidentsBackup: Incident[]): Promise<number> => {
    if (!firebaseUser || !userProfile) return 0;
    let restored = 0;
    try {
      // Chunk into Firestore batch limits (max 450 writes per batch)
      for (let i = 0; i < incidentsBackup.length; i += 400) {
        const chunk = incidentsBackup.slice(i, i + 400);
        const batch = writeBatch(db);
        for (const item of chunk) {
          if (!item.id || !item.identitas?.tanggalKejadian) continue;
          const cleanId = item.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
          batch.set(doc(db, 'incidents', cleanId), {
            id: cleanId,
            agencyCode: AGENCY_CODE,
            identitas: item.identitas,
            dataKejadian: item.dataKejadian,
            korban: item.korban,
            penanganan: item.penanganan,
            docCount: item.docCount || 0,
            createdBy: firebaseUser.uid,
            createdByName: item.createdByName || userProfile.displayName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          restored += 1;
        }
        await batch.commit();
      }
      notify('success', 'Restore Selesai', `${restored} data kejadian dipulihkan ke Firestore.`);
      return restored;
    } catch (err) {
      notify('error', 'Gagal Memulihkan Backup', getReadableFirestoreMessage(err));
      handleFirestoreError(err, OperationType.WRITE, 'incidents');
    }
  };

  return (
    <FirebaseDataContext.Provider
      value={{
        firebaseUser,
        userProfile,
        authReady,
        dataLoading,
        incidents,
        handlingLogs,
        documentations,
        reports,
        usersList,
        agencySettings,
        toasts,
        notify,
        dismissToast,
        loginWithGoogle,
        logout,
        saveIncident,
        deleteIncident,
        addHandlingUpdate,
        uploadDocumentation,
        deleteDocumentation,
        archiveReport,
        deleteArchivedReport,
        saveAgencySettings,
        updateUserRole,
        updateOwnProfile,
        restoreBackupData,
      }}
    >
      {children}
    </FirebaseDataContext.Provider>
  );
}

export function useFirebaseData(): FirebaseContextValue {
  const ctx = useContext(FirebaseDataContext);
  if (!ctx) throw new Error('useFirebaseData must be used inside FirebaseDataProvider');
  return ctx;
}
