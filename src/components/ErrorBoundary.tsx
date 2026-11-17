import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      let parsedDetail = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed.error) {
          parsedDetail = `${parsed.error} (Operasi: ${parsed.operationType || '-'}, Path: ${parsed.path || '-'})`;
        }
      } catch {
        // plain error message
      }

      return (
        <div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center gap-3 text-red-700 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h1 className="text-lg font-bold">Terjadi Gangguan Sistem</h1>
            </div>
            <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
              Aplikasi mengalami kendala saat memproses akses data atau hak otorisasi Firestore.
            </p>
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs font-mono text-neutral-700 break-words mb-5">
              {parsedDetail}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
