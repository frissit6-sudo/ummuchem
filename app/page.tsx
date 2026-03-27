'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { LayoutDashboard, ClipboardCheck, FileText, BarChart3, Settings, User as UserIcon, ShieldCheck, UserCheck, GraduationCap, ChevronDown, Users, LogOut } from 'lucide-react';
import { useEvaluations, EvaluationRecord } from '@/lib/store';
import dynamic from 'next/dynamic';
import { auth, logout } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import Login from '@/components/Login';
import { settingsSchema } from '@/lib/validation';
import { z } from 'zod';

const DashboardTab = dynamic(() => import('@/components/DashboardTab'), { ssr: false });
const EvaluateTab = dynamic(() => import('@/components/EvaluateTab'), { ssr: false });
const RecordsTab = dynamic(() => import('@/components/RecordsTab'), { ssr: false });
const SummaryTab = dynamic(() => import('@/components/SummaryTab'), { ssr: false });
const SettingsTab = dynamic(() => import('@/components/SettingsTab'), { ssr: false });
const UsersTab = dynamic(() => import('@/components/UsersTab'), { ssr: false });
const ErrorBoundary = dynamic(() => import('@/components/ErrorBoundary'), { ssr: false });

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface AppSettings {
  schoolName: string;
  schoolSubName: string;
  logoUrl: string;
  adminPassword?: string;
  criteria: { id: string, name: string }[];
  qualityLevels: { label: string, minScore: number, color: string }[];
  teachers: User[];
  subjects: Subject[];
  evaluators: User[];
  years: string[];
  terms: string[];
}

export default function App() {
  const { records, loading: recordsLoading, addRecord, deleteRecord } = useEvaluations();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState<{ msg: string, color: string } | null>(null);
  const [detailModal, setDetailModal] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [role, setRole] = useState<'teacher' | 'evaluator' | 'admin'>('teacher');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [settings, setSettings] = useState<AppSettings>({
    schoolName: 'ระบบการนิเทศการสอน',
    schoolSubName: 'โรงเรียนเฉลิมพระเกียรติสมเด็จพระศรีนครินทร์ ยะลา',
    logoUrl: 'https://img2.imgbiz.com/imgbiz/logo-design.png',
    adminPassword: 'admin', // Default admin password
    criteria: [
      { id: 'c1', name: 'การวางแผนและเตรียมการสอน' },
      { id: 'c2', name: 'กระบวนการจัดการเรียนรู้' },
      { id: 'c3', name: 'สื่อและแหล่งเรียนรู้' },
      { id: 'c4', name: 'การวัดและประเมินผล' },
      { id: 'c5', name: 'บรรยากาศการเรียนรู้' }
    ],
    qualityLevels: [
      { label: 'ยอดเยี่ยม', minScore: 4.5, color: '#059669' },
      { label: 'ดีมาก', minScore: 3.5, color: '#0891b2' },
      { label: 'ดี', minScore: 2.5, color: '#d97706' },
      { label: 'พอใช้', minScore: 1.5, color: '#ea580c' },
      { label: 'ปรับปรุง', minScore: 0, color: '#dc2626' }
    ],
    teachers: [],
    subjects: [],
    evaluators: [],
    years: ['2567', '2568', '2569'],
    terms: ['1', '2']
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      
      // Auto-set role based on email if admin
      if (u?.email === 'ummukalsom@swyl.ac.th') {
        setRole('admin');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appSettingsV2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Migration for teachers/evaluators from string[] to User[] and add IDs
          if (parsed.teachers) {
            parsed.teachers = parsed.teachers.map((t: any, i: number) => {
              if (typeof t === 'string') return { id: `t-${Date.now()}-${i}`, name: t, username: '', password: '' };
              if (!t.id) return { ...t, id: `t-${Date.now()}-${i}` };
              return t;
            });
          }
          if (parsed.evaluators) {
            parsed.evaluators = parsed.evaluators.map((e: any, i: number) => {
              if (typeof e === 'string') return { id: `e-${Date.now()}-${i}`, name: e, username: '', password: '' };
              if (!e.id) return { ...e, id: `e-${Date.now()}-${i}` };
              return e;
            });
          }
          // Migration for subjects to include IDs
          if (parsed.subjects && parsed.subjects.length > 0 && typeof parsed.subjects[0] === 'string') {
            parsed.subjects = parsed.subjects.map((s: string, i: number) => ({ id: `s-${Date.now()}-${i}`, name: s }));
          }
          // Ensure admin password exists
          if (!parsed.adminPassword) {
            parsed.adminPassword = 'admin';
          }
          setTimeout(() => {
            setSettings(prev => ({ ...prev, ...parsed }));
            setIsLoaded(true);
          }, 0);
        } catch (e) {
          console.error('Failed to parse app settings');
        }
      } else {
        // Migration from older version
        const oldCriteria = localStorage.getItem('rubricSettingsArray');
        if (oldCriteria) {
          try {
            const data = JSON.parse(oldCriteria);
            if (Array.isArray(data)) {
              setTimeout(() => {
                setSettings(prev => ({ ...prev, criteria: data }));
                setIsLoaded(true);
              }, 0);
            }
          } catch (e) {}
        }
        setTimeout(() => setIsLoaded(true), 0);
      }
    }
  }, []);

  const showToast = (msg: string, color: string) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    try {
      // Validate settings before saving
      const validated = settingsSchema.parse(newSettings);
      setSettings(validated as AppSettings);
      localStorage.setItem('appSettingsV2', JSON.stringify(validated));
      showToast('บันทึกการตั้งค่าสำเร็จ ✓', 'green');
    } catch (error) {
      console.error('Settings validation failed:', error);
      if (error instanceof z.ZodError) {
        showToast(`ข้อมูลไม่ถูกต้อง: ${error.issues[0].message}`, 'red');
      } else {
        showToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'red');
      }
    }
  };

  const getQualityInfo = (score: number) => {
    const levels = [...settings.qualityLevels].sort((a, b) => b.minScore - a.minScore);
    const level = levels.find(l => score >= l.minScore) || levels[levels.length - 1];
    return level;
  };

  const handleSaveEvaluation = async (record: Omit<EvaluationRecord, 'id'>) => {
    const success = await addRecord(record);
    if (success) {
      showToast('บันทึกผลการนิเทศสำเร็จ ✓', 'green');
    } else {
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'red');
    }
    return success;
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    const success = await deleteRecord(deleteModal);
    setDeleteModal(null);
    if (success) showToast('ลบสำเร็จ', 'green');
    else showToast('เกิดข้อผิดพลาด', 'red');
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('ออกจากระบบสำเร็จ', 'slate');
    } catch (e) {
      showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'red');
    }
  };

  const renderDetailModal = () => {
    if (!detailModal) return null;
    const r = records.find(x => x.id === detailModal);
    if (!r) return null;

    const avg = (settings.criteria.reduce((s, c) => s + ((r.scores && r.scores[c.id]) || 0), 0) / (settings.criteria.length || 1)).toFixed(2);
    const numAvg = parseFloat(avg);
    const quality = getQualityInfo(numAvg);

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay overflow-auto p-4" onClick={() => setDetailModal(null)}>
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-full overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-4 text-white rounded-t-2xl">
            <h3 className="font-bold text-lg">ผลการนิเทศ</h3>
            <p className="text-cyan-100 text-sm">{r.teacher_name} • {r.date} • ภาคเรียนที่ {r.term || '-'} ปี {r.academic_year || '-'}</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400">วิชา:</span> <span className="font-medium text-slate-700">{r.subject}</span></div>
              <div><span className="text-slate-400">คาบ:</span> <span className="font-medium text-slate-700">{r.period || '-'}</span></div>
              <div><span className="text-slate-400">ผู้นิเทศ:</span> <span className="font-medium text-slate-700">{r.evaluator}</span></div>
              <div><span className="text-slate-400">ค่าเฉลี่ย:</span> <span className="font-bold" style={{ color: quality.color }}>{avg} ({quality.label})</span></div>
            </div>
            <div className="space-y-2">
              {settings.criteria.map(c => {
                const score = (r.scores && r.scores[c.id]) || 0;
                const scoreQuality = getQualityInfo(score);
                return (
                  <div key={c.id} className="flex justify-between items-center text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-600">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${(score / 5 * 100)}%`, background: scoreQuality.color }}></div>
                      </div>
                      <span className="font-bold w-6 text-right" style={{ color: scoreQuality.color }}>{score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {r.suggestion && (
              <div className="bg-cyan-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-cyan-700 mb-1">ข้อเสนอแนะ</p>
                <p className="text-sm text-slate-600">{r.suggestion}</p>
              </div>
            )}
            {r.attachment_url && (
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-700 mb-2">รูปภาพหลักฐาน</p>
                <div className="relative rounded-lg overflow-hidden border border-amber-200 bg-white aspect-video flex items-center justify-center mb-2">
                  <Image src={r.attachment_url} alt="Evidence" fill className="object-contain" referrerPolicy="no-referrer" />
                </div>
                <a href={r.attachment_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-600 hover:underline break-all block text-center">เปิดรูปภาพขนาดเต็ม</a>
              </div>
            )}
            <button onClick={() => setDetailModal(null)} className="w-full py-2.5 bg-slate-100 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition">ปิด</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <header className="text-white flex-shrink-0 shadow-lg" style={{ backgroundColor: '#7AAACE' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center justify-center gap-6 relative">
            {/* Logo at the top center */}
            <div className="relative w-24 h-24 bg-white/20 rounded-2xl p-2 border border-white/10 shadow-inner overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700">
              <Image 
                src={settings.logoUrl || 'https://img2.imgbiz.com/imgbiz/logo-design.png'} 
                alt="Logo" 
                fill 
                className="object-contain p-2"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Titles centered below logo */}
            <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="font-bold text-3xl md:text-5xl tracking-tight leading-tight">{settings.schoolName}</h1>
              <p className="text-cyan-100 text-sm md:text-lg uppercase tracking-wide font-bold">{settings.schoolSubName}</p>
            </div>
            
            {/* Role switcher badge */}
            <div className="md:absolute md:top-6 md:right-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-2xl border border-white/10 backdrop-blur-md transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/10 flex items-center justify-center text-white shadow-inner">
                      {role === 'admin' && <ShieldCheck size={20} />}
                      {role === 'evaluator' && <UserCheck size={20} />}
                      {role === 'teacher' && <GraduationCap size={20} />}
                    </div>
                    <div className="flex flex-col items-start mr-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">บทบาทผู้ใช้</p>
                      <p className="text-sm font-bold">
                        {role === 'admin' && 'ผู้ดูแลระบบ'}
                        {role === 'evaluator' && 'ผู้นิเทศ'}
                        {role === 'teacher' && 'ครูผู้สอน'}
                      </p>
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-300 ${showRoleMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showRoleMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={() => { setRole('teacher'); setShowRoleMenu(false); setActiveTab('dashboard'); }}
                        className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-slate-50 transition ${role === 'teacher' ? 'text-cyan-600 font-bold bg-cyan-50/50' : 'text-slate-600'}`}
                      >
                        <GraduationCap size={18} /> ครูผู้สอน
                      </button>
                      <button 
                        onClick={() => { setRole('evaluator'); setShowRoleMenu(false); setActiveTab('dashboard'); }}
                        className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-slate-50 transition ${role === 'evaluator' ? 'text-cyan-600 font-bold bg-cyan-50/50' : 'text-slate-600'}`}
                      >
                        <UserCheck size={18} /> ผู้นิเทศ
                      </button>
                      <button 
                        onClick={() => { setRole('admin'); setShowRoleMenu(false); setActiveTab('dashboard'); }}
                        className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 hover:bg-slate-50 transition ${role === 'admin' ? 'text-cyan-600 font-bold bg-cyan-50/50' : 'text-slate-600'}`}
                      >
                        <ShieldCheck size={18} /> ผู้ดูแลระบบ
                      </button>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="p-3 bg-white/10 hover:bg-red-500/20 text-white rounded-2xl border border-white/10 backdrop-blur-md transition-all"
                  title="ออกจากระบบ"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <nav className="bg-white border-b border-slate-200 flex-shrink-0 shadow-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex overflow-x-auto">
            <button onClick={() => setActiveTab('dashboard')} className={`nav-tab px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 border-b-3 transition cursor-pointer ${activeTab === 'dashboard' ? 'tab-active' : 'border-transparent text-slate-500 hover:text-cyan-700'}`}>
              <LayoutDashboard className="w-4 h-4" /> แดชบอร์ด
            </button>
            
            {(role === 'evaluator' || role === 'admin') && (
              <button onClick={() => setActiveTab('evaluate')} className={`nav-tab px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 border-b-3 transition cursor-pointer ${activeTab === 'evaluate' ? 'tab-active' : 'border-transparent text-slate-500 hover:text-cyan-700'}`}>
                <ClipboardCheck className="w-4 h-4" /> นิเทศการสอน
              </button>
            )}

            <button onClick={() => setActiveTab('records')} className={`nav-tab px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 border-b-3 transition cursor-pointer ${activeTab === 'records' ? 'tab-active' : 'border-transparent text-slate-500 hover:text-cyan-700'}`}>
              <FileText className="w-4 h-4" /> บันทึกผล
            </button>

            <button onClick={() => setActiveTab('summary')} className={`nav-tab px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 border-b-3 transition cursor-pointer ${activeTab === 'summary' ? 'tab-active' : 'border-transparent text-slate-500 hover:text-cyan-700'}`}>
              <BarChart3 className="w-4 h-4" /> สรุปผล
            </button>

            {role === 'admin' && (
              <>
                <button onClick={() => setActiveTab('users')} className={`nav-tab px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 border-b-3 transition cursor-pointer ${activeTab === 'users' ? 'tab-active' : 'border-transparent text-slate-500 hover:text-cyan-700'}`}>
                  <Users className="w-4 h-4" /> จัดการผู้ใช้
                </button>
                <button onClick={() => setActiveTab('settings')} className={`nav-tab px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 border-b-3 transition cursor-pointer ${activeTab === 'settings' ? 'tab-active' : 'border-transparent text-slate-500 hover:text-cyan-700'}`}>
                  <Settings className="w-4 h-4" /> ตั้งค่า
                </button>
              </>
            )}
          </div>
        </nav>

        <main className="flex-1">
          {recordsLoading ? (
            <div className="flex items-center justify-center h-full py-20">
              <span className="animate-spin inline-block w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full"></span>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardTab records={records} onShowDetail={(id) => setDetailModal(id)} settings={settings} />}
              {activeTab === 'evaluate' && (role === 'evaluator' || role === 'admin') && <EvaluateTab onSave={handleSaveEvaluation} settings={settings} showToast={showToast} />}
              {activeTab === 'records' && <RecordsTab records={records} onShowDetail={(id) => setDetailModal(id)} onDelete={role === 'admin' ? (id) => setDeleteModal(id) : undefined} settings={settings} />}
              {activeTab === 'summary' && <SummaryTab records={records} settings={settings} />}
              {activeTab === 'users' && role === 'admin' && <UsersTab settings={settings} onSaveSettings={handleSaveSettings} showToast={showToast} records={records} />}
              {activeTab === 'settings' && role === 'admin' && <SettingsTab settings={settings} onSaveSettings={handleSaveSettings} records={records} showToast={showToast} />}
            </>
          )}
        </main>

        <footer className="bg-slate-800 text-slate-300 text-sm px-4 py-4 text-center flex-shrink-0 mt-auto border-t border-slate-700">
          <p>พัฒนาระบบโดย :: นางสาวอุมมูกัลโสม สุระแม</p>
        </footer>

        {toast && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white px-5 py-3 rounded-xl shadow-lg text-sm z-50 toast-show" style={{ background: toast.color === 'green' ? '#059669' : toast.color === 'red' ? '#dc2626' : '#334155' }}>
            {toast.msg}
          </div>
        )}

        {deleteModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay">
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
              <h3 className="font-bold text-slate-800 mb-2">ยืนยันการลบ</h3>
              <p className="text-sm text-slate-500 mb-4">ต้องการลบบันทึกการนิเทศนี้หรือไม่?</p>
              <div className="flex gap-3">
                <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition">ลบ</button>
                <button onClick={() => setDeleteModal(null)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 transition">ยกเลิก</button>
              </div>
            </div>
          </div>
        )}

        {renderDetailModal()}
      </div>
    </ErrorBoundary>
  );
}
