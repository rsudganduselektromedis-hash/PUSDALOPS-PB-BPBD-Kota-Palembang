/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { AuthGate } from './components/AuthGate';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExportView } from './components/ExportView';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { IncidentFormView } from './components/IncidentFormView';
import { IncidentTableView } from './components/IncidentTableView';
import { MonitoringView } from './components/MonitoringView';
import { RecapView } from './components/RecapView';
import { ReportGeneratorView } from './components/ReportGeneratorView';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { TopHeader } from './components/TopHeader';
import { WhatsAppGeneratorView } from './components/WhatsAppGeneratorView';
import { FirebaseDataProvider, useFirebaseData } from './context/FirebaseDataContext';
import { Incident, MenuKey } from './types/bpbd';

function AppShell() {
  const {
    firebaseUser,
    userProfile,
    authReady,
    dataLoading,
    incidents,
    handlingLogs,
    documentations,
    agencySettings,
    toasts,
    dismissToast,
    logout,
    deleteIncident,
  } = useFirebaseData();

  const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [inspectingIncident, setInspectingIncident] = useState<Incident | null>(null);
  const [waPreselectedIncident, setWaPreselectedIncident] = useState<Incident | null>(null);

  const activeIncidentCount = useMemo(
    () => incidents.filter((i) => i.penanganan.statusPenanganan !== 'Selesai').length,
    [incidents]
  );

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-medium text-neutral-300">
            Memuat Sistem Pusdalops-PB BPBD Kota Palembang...
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !userProfile) {
    return (
      <>
        <AuthGate />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  if (!userProfile.active) {
    return (
      <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-xl p-6 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
          <h1 className="text-lg font-bold text-neutral-900">Akun Dinonaktifkan</h1>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Akun Anda ({userProfile.email}) saat ini berstatus nonaktif. Hubungi Administrator
            Pusdalops-PB BPBD Kota Palembang untuk mengaktifkan kembali akses.
          </p>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>
    );
  }

  const handleEditIncident = (incident: Incident) => {
    setInspectingIncident(null);
    setEditingIncident(incident);
    setActiveMenu('input');
  };

  const handleJumpToWhatsApp = (incident: Incident) => {
    setInspectingIncident(null);
    setWaPreselectedIncident(incident);
    setActiveMenu('whatsapp');
  };

  const canEditInspected = (inc: Incident) =>
    userProfile.role === 'Admin' ||
    userProfile.role === 'Operator Pusdalops' ||
    (inc.createdBy === userProfile.uid && inc.penanganan.statusPenanganan !== 'Selesai');

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex">
      <Sidebar
        activeMenu={activeMenu}
        onSelectMenu={(menu) => {
          if (menu !== 'input') setEditingIncident(null);
          setActiveMenu(menu);
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        logoPemkotDataUrl={agencySettings.logoPemkotDataUrl}
        logoBpbdDataUrl={agencySettings.logoBpbdDataUrl}
        activeIncidentCount={activeIncidentCount}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          activeMenu={activeMenu}
          agencySettings={agencySettings}
          userProfile={userProfile}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onLogout={logout}
        />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeMenu === 'dashboard' && (
            <DashboardView
              incidents={incidents}
              dataLoading={dataLoading}
              onNavigate={(m) => {
                if (m === 'input') setEditingIncident(null);
                setActiveMenu(m);
              }}
              onInspectIncident={(inc) => setInspectingIncident(inc)}
            />
          )}

          {activeMenu === 'input' && (
            <IncidentFormView
              editingIncident={editingIncident}
              onCancelEdit={() => setEditingIncident(null)}
              onSaved={() => setActiveMenu('data')}
            />
          )}

          {activeMenu === 'data' && (
            <IncidentTableView
              incidents={incidents}
              userRole={userProfile.role}
              userUid={userProfile.uid}
              onInspect={(inc) => setInspectingIncident(inc)}
              onEdit={handleEditIncident}
              onDelete={deleteIncident}
              onCreateNew={() => {
                setEditingIncident(null);
                setActiveMenu('input');
              }}
            />
          )}

          {activeMenu === 'rekapitulasi' && <RecapView incidents={incidents} />}

          {activeMenu === 'monitoring' && (
            <MonitoringView onInspectIncident={(inc) => setInspectingIncident(inc)} />
          )}

          {activeMenu === 'laporan' && <ReportGeneratorView />}

          {activeMenu === 'whatsapp' && (
            <WhatsAppGeneratorView preselectedIncident={waPreselectedIncident} />
          )}

          {activeMenu === 'export' && <ExportView />}

          {activeMenu === 'pengaturan' && <SettingsView />}
        </main>
      </div>

      {inspectingIncident && (
        <IncidentDetailModal
          incident={inspectingIncident}
          logs={handlingLogs}
          docs={documentations}
          canEdit={canEditInspected(inspectingIncident)}
          onClose={() => setInspectingIncident(null)}
          onEdit={handleEditIncident}
          onGenerateWhatsApp={handleJumpToWhatsApp}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseDataProvider>
        <AppShell />
      </FirebaseDataProvider>
    </ErrorBoundary>
  );
}
