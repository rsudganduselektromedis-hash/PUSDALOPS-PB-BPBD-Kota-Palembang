import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Table2,
  BarChart3,
  Activity,
  FileText,
  MessageSquareShare,
  Download,
  Settings,
  X,
} from 'lucide-react';
import { MenuKey } from '../types/bpbd';
import { BpbdPalembangLogo, PemkotPalembangLogo } from './InstitutionalLogos';

interface SidebarProps {
  activeMenu: MenuKey;
  onSelectMenu: (menu: MenuKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  logoPemkotDataUrl?: string;
  logoBpbdDataUrl?: string;
  activeIncidentCount: number;
}

const MENU_ITEMS: { key: MenuKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'input', label: 'Input Data Kejadian', icon: PlusCircle },
  { key: 'data', label: 'Data Kejadian', icon: Table2 },
  { key: 'rekapitulasi', label: 'Rekapitulasi', icon: BarChart3 },
  { key: 'monitoring', label: 'Monitoring Penanganan', icon: Activity },
  { key: 'laporan', label: 'Laporan Otomatis', icon: FileText },
  { key: 'whatsapp', label: 'Status WhatsApp', icon: MessageSquareShare },
  { key: 'export', label: 'Export Data', icon: Download },
  { key: 'pengaturan', label: 'Pengaturan', icon: Settings },
];

export function Sidebar({
  activeMenu,
  onSelectMenu,
  mobileOpen,
  onCloseMobile,
  logoPemkotDataUrl,
  logoBpbdDataUrl,
  activeIncidentCount,
}: SidebarProps) {
  const navContent = (
    <div className="flex flex-col h-full bg-[#111827] text-neutral-100 w-[264px] border-r border-neutral-800">
      <div className="px-4 py-4 border-b border-neutral-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <PemkotPalembangLogo dataUrl={logoPemkotDataUrl} size="sm" />
          <BpbdPalembangLogo dataUrl={logoBpbdDataUrl} size="sm" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">PUSDALOPS-PB</div>
            <div className="text-[11px] text-neutral-400 truncate">BPBD Kota Palembang</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-neutral-400 hover:text-white rounded-md"
          aria-label="Tutup menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Navigasi Utama">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onSelectMenu(item.key);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#EA580C] text-white'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate whitespace-nowrap">{item.label}</span>
              </span>
              {item.key === 'monitoring' && activeIncidentCount > 0 && (
                <span
                  className={`text-xs font-mono tabular-nums px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-neutral-800 text-[#F97316]'
                  }`}
                >
                  {activeIncidentCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-neutral-800 text-[11px] text-neutral-400">
        <div className="font-semibold text-neutral-300">Pemerintah Kota Palembang</div>
        <div>Sistem Operasional Bencana</div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 no-print">{navContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{navContent}</div>
        </div>
      )}
    </>
  );
}
