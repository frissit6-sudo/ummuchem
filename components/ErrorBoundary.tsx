'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง';
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `ข้อผิดพลาดในการเข้าถึงข้อมูล (${parsed.operationType}): ${parsed.error}`;
            if (parsed.error.includes('Missing or insufficient permissions')) {
              errorMessage = 'คุณไม่มีสิทธิ์ในการเข้าถึงหรือจัดการข้อมูลนี้ กรุณาตรวจสอบการเข้าสู่ระบบหรือติดต่อผู้ดูแลระบบ';
            }
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border border-slate-100">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                <AlertTriangle size={32} />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800">ขออภัย เกิดข้อผิดพลาด</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-3 rounded-2xl hover:bg-cyan-700 transition-all active:scale-95 shadow-lg shadow-cyan-200"
            >
              <RefreshCcw size={18} />
              <span>โหลดหน้าเว็บใหม่</span>
            </button>
            
            {isFirestoreError && (
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                Firestore Security Enforcement
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
