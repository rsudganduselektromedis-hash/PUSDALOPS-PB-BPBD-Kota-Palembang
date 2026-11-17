import React from 'react';

interface LogoProps {
  dataUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

export const DEFAULT_PEMKOT_LOGO_SRC =
  '/assets/aistudio/Logo_Palembang__1__5e3c77b2.png';

export function PemkotPalembangLogo({ dataUrl, size = 'md' }: LogoProps) {
  const cls = SIZE_CLASSES[size];
  const src = dataUrl || DEFAULT_PEMKOT_LOGO_SRC;

  return (
    <img
      src={src}
      alt="Logo Pemerintah Kota Palembang"
      referrerPolicy="no-referrer"
      className={`${cls} object-contain shrink-0 rounded bg-white p-0.5 border border-neutral-200`}
    />
  );
}

export const DEFAULT_BPBD_LOGO_SRC =
  '/assets/aistudio/file_00000000c4f472069eff5fe65b2955d7_7aea0719.png';

export function BpbdPalembangLogo({ dataUrl, size = 'md' }: LogoProps) {
  const cls = SIZE_CLASSES[size];
  const src = dataUrl || DEFAULT_BPBD_LOGO_SRC;

  return (
    <img
      src={src}
      alt="Logo BPBD Kota Palembang"
      referrerPolicy="no-referrer"
      className={`${cls} object-contain shrink-0 rounded bg-white p-0.5 border border-neutral-200`}
    />
  );
}
