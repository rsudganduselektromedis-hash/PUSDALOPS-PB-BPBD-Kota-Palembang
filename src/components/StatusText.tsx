import React from 'react';
import { CheckCircle2, Clock, Eye } from 'lucide-react';
import { StatusPenanganan } from '../types/bpbd';

export function StatusLabel({ status }: { status: StatusPenanganan }) {
  if (status === 'Selesai') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Selesai</span>
      </span>
    );
  }
  if (status === 'Monitoring') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 whitespace-nowrap">
        <Eye className="w-3.5 h-3.5 shrink-0" />
        <span>Monitoring</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C2410C] whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>Dalam Penanganan</span>
    </span>
  );
}
