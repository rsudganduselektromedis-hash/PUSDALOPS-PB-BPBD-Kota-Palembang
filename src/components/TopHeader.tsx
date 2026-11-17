import React from 'react';
import { LogOut, Menu, User } from 'lucide-react';
import { AgencySettings, MenuKey, UserProfile } from '../types/bpbd';
import { BpbdPalembangLogo, PemkotPalembangLogo } from './InstitutionalLogos';

interface TopHeaderProps {
  activeMenu: MenuKey;
  agencySettings: AgencySettings;
  userProfile: UserProfile;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

const MENU_TITLES: Record<MenuKey, string> = {
  dashboard: 'Dashboard Operasional',
  input: 'Input Data Kejadian',
  data: 'Data Kejadian Bencana',
  rekapitulasi: 'Rekapitulasi Data Otomatis',
  monitoring: 'Monitoring Penanganan',
  laporan: 'Generator Laporan Otomatis',
  whatsapp: 'Buat Laporan Status WhatsApp',
  export: 'Export & Cetak Data',
  pengaturan: 'Pengaturan Sistem & Pengguna',
};

export function TopHeader({
  activeMenu,
  agencySettings,
  userProfile,
  onOpenMobileMenu,
  onLogout,
}: TopHeaderProps) {
  return (
    <header className="bg-white border-b border-neutral-200 px-4 md:px-6 py-3 flex items-center justify-between gap-4 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          aria-label="Buka menu navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <PemkotPalembangLogo dataUrl={agencySettings.logoPemkotDataUrl} size="md" />
          <BpbdPalembangLogo dataUrl={agencySettings.logoBpbdDataUrl} size="md" />
        </div>

        <div className="min-w-0">
          <div className="text-sm md:text-base font-bold text-neutral-900 truncate">
            BPBD Kota Palembang — {MENU_TITLES[activeMenu]}
          </div>
          <div className="text-xs text-neutral-500 truncate">
            {agencySettings.subUnitName}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="hidden md:flex items-center gap-2 text-right">
          <User className="w-4 h-4 text-neutral-400 shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-neutral-900 truncate max-w-[180px]">
              {userProfile.displayName}
            </div>
            <div className="text-neutral-500">{userProfile.role}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
}
