import React from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { ToastMessage } from '../types/bpbd';

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 no-print">
      {toasts.map((t) => {
        const icon =
          t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : t.type === 'error' ? (
            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          );

        return (
          <div
            key={t.id}
            role="status"
            className="bg-white border border-neutral-200 rounded-lg p-3.5 shadow-lg flex items-start gap-3"
          >
            {icon}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-neutral-900">{t.title}</div>
              {t.description && (
                <div className="text-xs text-neutral-600 mt-0.5">{t.description}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="text-neutral-400 hover:text-neutral-700"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
