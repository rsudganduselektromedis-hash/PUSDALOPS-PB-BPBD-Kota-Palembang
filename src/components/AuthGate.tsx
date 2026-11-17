import React from 'react';
import { ShieldCheck, LogIn, Database, FileText, Radio } from 'lucide-react';
import { useFirebaseData } from '../context/FirebaseDataContext';
import { BpbdPalembangLogo, PemkotPalembangLogo } from './InstitutionalLogos';

export function AuthGate() {
  const { loginWithGoogle, agencySettings } = useFirebaseData();

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col justify-between p-6 md:p-10">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <PemkotPalembangLogo dataUrl={agencySettings.logoPemkotDataUrl} size="md" />
          <BpbdPalembangLogo dataUrl={agencySettings.logoBpbdDataUrl} size="md" />
          <div>
            <div className="text-sm font-bold text-white tracking-tight">
              BPBD KOTA PALEMBANG
            </div>
            <div className="text-xs text-neutral-400">
              Pusat Pengendalian Operasi Penanggulangan Bencana (Pusdalops-PB)
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-xs font-mono text-neutral-400">
          Call Center 112 · Kota Palembang
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch my-8">
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl p-8 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wider text-[#F97316] uppercase mb-3">
              Sistem Informasi Operasional Instansi Pemerintah
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4 [text-wrap:balance]">
              SISTEM INFORMASI PUSDALOPS-PB BPBD KOTA PALEMBANG
            </h1>
            <p className="text-sm text-neutral-300 leading-relaxed mb-8 max-w-xl">
              Sistem Rekapitulasi Data Kejadian, Monitoring Penanganan Bencana, dan Laporan
              Operasional terintegrasi untuk 18 wilayah kecamatan di Kota Palembang.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-neutral-800 pt-6">
            <div>
              <div className="flex items-center gap-2 text-white text-sm font-semibold mb-1">
                <Database className="w-4 h-4 text-[#F97316]" />
                Basis Data Cloud
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Tersimpan persisten di Firebase Firestore secara real-time.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-white text-sm font-semibold mb-1">
                <Radio className="w-4 h-4 text-[#F97316]" />
                Monitoring TRC
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Pemantauan penanganan kejadian hingga status selesai.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-white text-sm font-semibold mb-1">
                <FileText className="w-4 h-4 text-[#F97316]" />
                Laporan & WA Status
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Otomatisasi PDF, Excel, dan narasi Status WhatsApp.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-lg mb-2">
              <ShieldCheck className="w-5 h-5 text-[#EA580C]" />
              Masuk Portal Petugas
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              Silakan masuk menggunakan akun Google terverifikasi untuk mengakses data kejadian,
              melakukan input laporan, dan mengelola monitoring operasional.
            </p>

            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Masuk dengan Akun Google
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-neutral-200 text-xs text-neutral-500 space-y-1.5">
            <div className="font-semibold text-neutral-700">Hak Akses Sistem (RBAC):</div>
            <div>Admin · Operator Pusdalops · Petugas Input</div>
            <div>
              Akun baru otomatis terdaftar sebagai Petugas Input dan dapat disesuaikan oleh Admin
              melalui menu Pengaturan.
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl w-full mx-auto text-center text-xs text-neutral-500 border-t border-neutral-800 pt-4">
        Badan Penanggulangan Bencana Daerah (BPBD) Kota Palembang · Provinsi Sumatera Selatan
      </div>
    </div>
  );
}
