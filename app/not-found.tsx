'use client';

import Link from 'next/link';
import { RefreshCcw, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border border-slate-100">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-cyan-50 rounded-full flex items-center justify-center text-cyan-600">
            <span className="text-4xl font-bold">404</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">ไม่พบหน้าที่คุณต้องการ</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            ขออภัย หน้าที่คุณกำลังมองหาอาจถูกลบไปแล้ว หรือคุณอาจพิมพ์ที่อยู่ผิด
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-3 rounded-2xl hover:bg-cyan-700 transition-all active:scale-95 shadow-lg shadow-cyan-200"
          >
            <Home size={18} />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
          >
            <RefreshCcw size={18} />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
        </div>
      </div>
    </div>
  );
}
