import { useState } from 'react';
import { Settings, ListChecks, Save, Plus, Trash2, School, Award, Users, BookOpen, UserCheck, Calendar, Hash, ShieldCheck, Key } from 'lucide-react';
import { AppSettings, Subject, User } from '@/app/page';
import { EvaluationRecord } from '@/lib/store';

export default function SettingsTab({ settings, onSaveSettings, records, showToast }: { settings: AppSettings, onSaveSettings: (settings: AppSettings) => void, records: EvaluationRecord[], showToast: (msg: string, color: string) => void }) {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [activeSection, setActiveSection] = useState<'school' | 'criteria' | 'quality' | 'lists' | 'security'>('school');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ key: keyof AppSettings, index: number, name: string, hasRecords: boolean } | null>(null);
  const [adminPassInput, setAdminPassInput] = useState('');

  const handleSave = () => {
    onSaveSettings(localSettings);
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      schoolName: 'ระบบการนิเทศการสอน',
      schoolSubName: 'โรงเรียนเฉลิมพระเกียรติสมเด็จพระศรีนครินทร์ ยะลา',
      logoUrl: 'https://img2.imgbiz.com/imgbiz/logo-design.png',
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
    };
    setLocalSettings(defaultSettings);
    setShowResetConfirm(false);
  };

  const updateList = (key: keyof AppSettings, index: number, value: any) => {
    const list = [...(localSettings[key] as any[])];
    list[index] = value;
    setLocalSettings({ ...localSettings, [key]: list });
  };

  const addToList = (key: keyof AppSettings, defaultValue: any) => {
    const list = [...(localSettings[key] as any[])];
    list.push(defaultValue);
    setLocalSettings({ ...localSettings, [key]: list });
  };

  const removeFromList = (key: keyof AppSettings, index: number) => {
    if (deleteConfirm?.hasRecords) {
      if (adminPassInput !== settings.adminPassword) {
        showToast('รหัสผ่านแอดมินไม่ถูกต้อง', 'red');
        return;
      }
    }

    const list = [...(localSettings[key] as any[])];
    list.splice(index, 1);
    setLocalSettings({ ...localSettings, [key]: list });
    setDeleteConfirm(null);
    setAdminPassInput('');
  };

  const confirmRemove = (key: keyof AppSettings, index: number, name: string, id?: string) => {
    let hasRecords = false;
    if (key === 'teachers') {
      hasRecords = records.some(r => r.teacher_id === id || r.teacher_name === name);
    } else if (key === 'evaluators') {
      hasRecords = records.some(r => r.evaluator_id === id || r.evaluator === name);
    } else if (key === 'subjects') {
      hasRecords = records.some(r => r.subject_id === id || r.subject === name);
    } else if (key === 'criteria') {
      hasRecords = records.some(r => r.scores && r.scores[id || '']);
    }

    setDeleteConfirm({ key, index, name, hasRecords });
  };

  return (
    <div className="tab-content max-w-4xl mx-auto p-4 fade-in pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 text-white flex justify-between items-center">
          <div>
            <h2 className="font-bold text-xl flex items-center gap-2">
              <Settings className="w-6 h-6" /> ตั้งค่าระบบ
            </h2>
            <p className="text-slate-300 text-xs mt-1">จัดการข้อมูลพื้นฐาน เกณฑ์การประเมิน และรายชื่อในระบบ</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowResetConfirm(true)} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm font-medium">รีเซ็ต</button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition text-sm font-bold shadow-lg shadow-cyan-500/20">
              <Save size={18} /> บันทึกทั้งหมด
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button onClick={() => setActiveSection('school')} className={`px-5 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${activeSection === 'school' ? 'border-cyan-600 text-cyan-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <School size={16} /> ข้อมูลโรงเรียน
          </button>
          <button onClick={() => setActiveSection('criteria')} className={`px-5 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${activeSection === 'criteria' ? 'border-cyan-600 text-cyan-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <ListChecks size={16} /> เกณฑ์การประเมิน
          </button>
          <button onClick={() => setActiveSection('quality')} className={`px-5 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${activeSection === 'quality' ? 'border-cyan-600 text-cyan-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Award size={16} /> ระดับคุณภาพ
          </button>
          <button onClick={() => setActiveSection('lists')} className={`px-5 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${activeSection === 'lists' ? 'border-cyan-600 text-cyan-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <Users size={16} /> รายชื่อพื้นฐาน
          </button>
          <button onClick={() => setActiveSection('security')} className={`px-5 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${activeSection === 'security' ? 'border-cyan-600 text-cyan-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <ShieldCheck size={16} /> ความปลอดภัย
          </button>
        </div>

        <div className="p-6">
          {activeSection === 'school' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">ชื่อโรงเรียน / หัวข้อหลัก</label>
                  <input type="text" value={localSettings.schoolName} onChange={e => setLocalSettings({...localSettings, schoolName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">ชื่อรอง / คำอธิบาย</label>
                  <input type="text" value={localSettings.schoolSubName} onChange={e => setLocalSettings({...localSettings, schoolSubName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none transition" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-slate-700">URL โลโก้</label>
                  <input type="text" value={localSettings.logoUrl} onChange={e => setLocalSettings({...localSettings, logoUrl: e.target.value})} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500/20 outline-none transition" />
                  <p className="text-[10px] text-slate-400">แนะนำขนาด 200x200px (PNG/JPG)</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'criteria' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">รายการเกณฑ์การประเมิน</h3>
                <button onClick={() => addToList('criteria', { id: `c${Date.now()}`, name: 'เกณฑ์ใหม่' })} className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                  <Plus size={14} /> เพิ่มเกณฑ์
                </button>
              </div>
              <div className="grid gap-3">
                {localSettings.criteria.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                    <span className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">{i + 1}</span>
                    <input type="text" value={c.name} onChange={e => {
                      const newList = [...localSettings.criteria];
                      newList[i] = { ...c, name: e.target.value };
                      setLocalSettings({...localSettings, criteria: newList});
                    }} className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 outline-none" />
                    <button onClick={() => confirmRemove('criteria', i, c.name, c.id)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'quality' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">ระดับคุณภาพและสีแสดงผล</h3>
                <button onClick={() => addToList('qualityLevels', { label: 'ใหม่', minScore: 0, color: '#64748b' })} className="text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                  <Plus size={14} /> เพิ่มระดับ
                </button>
              </div>
              <div className="grid gap-3">
                {localSettings.qualityLevels.map((q, i) => (
                  <div key={i} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="col-span-5">
                      <input type="text" value={q.label} onChange={e => {
                        const newList = [...localSettings.qualityLevels];
                        newList[i] = { ...q, label: e.target.value };
                        setLocalSettings({...localSettings, qualityLevels: newList});
                      }} placeholder="ชื่อระดับ" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" step="0.1" value={q.minScore} onChange={e => {
                        const newList = [...localSettings.qualityLevels];
                        newList[i] = { ...q, minScore: parseFloat(e.target.value) };
                        setLocalSettings({...localSettings, qualityLevels: newList});
                      }} placeholder="คะแนนขั้นต่ำ" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none" />
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <input type="color" value={q.color} onChange={e => {
                        const newList = [...localSettings.qualityLevels];
                        newList[i] = { ...q, color: e.target.value };
                        setLocalSettings({...localSettings, qualityLevels: newList});
                      }} className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent" />
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{q.color}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <button onClick={() => confirmRemove('qualityLevels', i, q.label)} className="text-slate-300 hover:text-red-500 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 italic">* ระบบจะเลือกสีและชื่อระดับตามคะแนนที่มากกว่าหรือเท่ากับค่าที่กำหนด (เรียงจากมากไปน้อย)</p>
            </div>
          )}

          {activeSection === 'lists' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Teachers */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Users size={14} /> รายชื่อครู</h3>
                    <button onClick={() => addToList('teachers', { id: `t-${Date.now()}`, name: '', username: '', password: '' })} className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700"><Plus size={12} /></button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {localSettings.teachers.map((t, i) => (
                      <div key={t.id || i} className="flex flex-col gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex gap-2">
                          <input type="text" value={t.name} onChange={e => updateList('teachers', i, { ...t, name: e.target.value })} placeholder="ชื่อครู" className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none" />
                          <button onClick={() => confirmRemove('teachers', i, t.name, t.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                        <input type="text" value={t.username} onChange={e => updateList('teachers', i, { ...t, username: e.target.value })} placeholder="Username" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] outline-none" />
                        <input type="password" value={t.password || ''} onChange={e => updateList('teachers', i, { ...t, password: e.target.value })} placeholder="Password" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] outline-none" />
                      </div>
                    ))}
                    {localSettings.teachers.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">ยังไม่มีข้อมูล</p>}
                  </div>
                </div>

                {/* Subjects */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><BookOpen size={14} /> รายวิชา</h3>
                    <button onClick={() => addToList('subjects', { id: `s-${Date.now()}`, name: '' })} className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700"><Plus size={12} /></button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {localSettings.subjects.map((s, i) => (
                      <div key={s.id || i} className="flex gap-2">
                        <input type="text" value={s.name} onChange={e => updateList('subjects', i, { ...s, name: e.target.value })} placeholder="ชื่อวิชา" className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none" />
                        <button onClick={() => confirmRemove('subjects', i, s.name, s.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {localSettings.subjects.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">ยังไม่มีข้อมูล (จะใช้การพิมพ์เอง)</p>}
                  </div>
                </div>

                {/* Evaluators */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><UserCheck size={14} /> ผู้นิเทศ</h3>
                    <button onClick={() => addToList('evaluators', { id: `e-${Date.now()}`, name: '', username: '', password: '' })} className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700"><Plus size={12} /></button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {localSettings.evaluators.map((ev, i) => (
                      <div key={ev.id || i} className="flex flex-col gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex gap-2">
                          <input type="text" value={ev.name} onChange={e => updateList('evaluators', i, { ...ev, name: e.target.value })} placeholder="ชื่อผู้นิเทศ" className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none" />
                          <button onClick={() => confirmRemove('evaluators', i, ev.name, ev.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                        <input type="text" value={ev.username} onChange={e => updateList('evaluators', i, { ...ev, username: e.target.value })} placeholder="Username" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] outline-none" />
                        <input type="password" value={ev.password || ''} onChange={e => updateList('evaluators', i, { ...ev, password: e.target.value })} placeholder="Password" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] outline-none" />
                      </div>
                    ))}
                    {localSettings.evaluators.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">ยังไม่มีข้อมูล</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                {/* Years */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={14} /> ปีการศึกษา</h3>
                    <button onClick={() => addToList('years', '')} className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"><Plus size={12} /> เพิ่มปี</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {localSettings.years.map((y, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="text" value={y} onChange={e => updateList('years', i, e.target.value)} placeholder="ปี พ.ศ." className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none" />
                        <button onClick={() => confirmRemove('years', i, y)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terms */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Hash size={14} /> เทอม / ภาคเรียน</h3>
                    <button onClick={() => addToList('terms', '')} className="text-[10px] font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1"><Plus size={12} /> เพิ่มเทอม</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {localSettings.terms.map((term, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="text" value={term} onChange={e => updateList('terms', i, e.target.value)} placeholder="เทอม" className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none" />
                        <button onClick={() => confirmRemove('terms', i, term)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-md space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
                    <Key className="w-4 h-4 text-cyan-600" /> รหัสผ่านผู้ดูแลระบบ (Admin Password)
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    รหัสผ่านนี้ใช้สำหรับยืนยันการลบข้อมูลสำคัญที่มีความเกี่ยวข้องกันในระบบ เพื่อป้องกันข้อมูลกำพร้า
                  </p>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">รหัสผ่านปัจจุบัน</label>
                    <input 
                      type="text" 
                      value={localSettings.adminPassword || ''} 
                      onChange={e => setLocalSettings({...localSettings, adminPassword: e.target.value})} 
                      placeholder="Admin Password"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-cyan-500/20 outline-none transition" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 ${deleteConfirm.hasRecords ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mb-4 mx-auto`}>
              {deleteConfirm.hasRecords ? <ShieldCheck size={24} /> : <Trash2 size={24} />}
            </div>
            <h3 className="font-bold text-slate-800 text-center mb-2">ยืนยันการลบข้อมูล</h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              คุณต้องการลบ <span className="font-bold text-slate-700">{deleteConfirm.name}</span> ใช่หรือไม่?
            </p>
            
            {deleteConfirm.hasRecords && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  <span className="font-bold">คำเตือน:</span> ข้อมูลนี้ถูกใช้งานในบันทึกการนิเทศ เพื่อป้องกันข้อมูลกำพร้า กรุณายืนยันด้วยรหัสผ่านแอดมิน
                </p>
                <input 
                  type="password" 
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  placeholder="รหัสผ่านแอดมิน"
                  className="w-full mt-2 px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => removeFromList(deleteConfirm.key, deleteConfirm.index)} 
                disabled={deleteConfirm.hasRecords && !adminPassInput}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                ลบข้อมูล
              </button>
              <button 
                onClick={() => { setDeleteConfirm(null); setAdminPassInput(''); }} 
                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Settings size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-center mb-2">ยืนยันการรีเซ็ต</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              คุณต้องการรีเซ็ตการตั้งค่าทั้งหมดเป็นค่าเริ่มต้นใช่หรือไม่? ข้อมูลที่ตั้งค่าไว้จะถูกลบทั้งหมด
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleReset} 
                className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition shadow-lg shadow-amber-500/20"
              >
                ยืนยันรีเซ็ต
              </button>
              <button 
                onClick={() => setShowResetConfirm(false)} 
                className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

