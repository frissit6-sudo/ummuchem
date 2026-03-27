import { useState, useRef } from 'react';
import { Users, UserCheck, GraduationCap, Plus, Trash2, Search, Filter, Edit2, Check, X, Key, User as UserIcon, Eye, EyeOff, FileSpreadsheet, Download, ShieldCheck } from 'lucide-react';
import { AppSettings, User } from '@/app/page';
import * as XLSX from 'xlsx';

import { EvaluationRecord } from '@/lib/store';

import { userSchema } from '@/lib/validation';
import { z } from 'zod';

export default function UsersTab({ settings, onSaveSettings, showToast, records }: { settings: AppSettings, onSaveSettings: (settings: AppSettings) => void, showToast: (msg: string, color: string) => void, records: EvaluationRecord[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'teacher' | 'evaluator'>('all');
  const [editingUser, setEditingUser] = useState<{ index: number, role: 'teacher' | 'evaluator', user: User } | null>(null);
  const [isAdding, setIsAdding] = useState<'teacher' | 'evaluator' | null>(null);
  const [newUser, setNewUser] = useState<User>({ id: '', name: '', username: '', password: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string, role: 'teacher' | 'evaluator', index: number, hasRecords: boolean } | null>(null);
  const [adminPassInput, setAdminPassInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allUsers = [
    ...(settings.teachers || []).map((user, index) => ({ ...user, role: 'teacher' as const, originalIndex: index })),
    ...(settings.evaluators || []).map((user, index) => ({ ...user, role: 'evaluator' as const, originalIndex: index }))
  ];

  const filteredUsers = allUsers.filter(user => {
    const name = user.name || '';
    const username = user.username || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || user.role === filter;
    return matchesSearch && matchesFilter;
  });

  const handleAdd = () => {
    if (!isAdding) return;
    
    try {
      // Validate user data
      const validated = userSchema.parse(newUser);
      
      const key = isAdding === 'teacher' ? 'teachers' : 'evaluators';
      const newList = [...(settings[key] || []), { ...validated, id: `${isAdding === 'teacher' ? 't' : 'e'}-${Date.now()}` }];
      
      onSaveSettings({
        ...settings,
        [key]: newList
      });
      
      setNewUser({ id: '', name: '', username: '', password: '' });
      setIsAdding(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        showToast(`ข้อมูลไม่ถูกต้อง: ${error.issues[0].message}`, 'red');
      }
    }
  };

  const handleUpdate = () => {
    if (!editingUser) return;
    
    try {
      // Validate user data
      const validated = userSchema.parse(editingUser.user);
      
      const key = editingUser.role === 'teacher' ? 'teachers' : 'evaluators';
      const newList = [...(settings[key] || [])];
      newList[editingUser.index] = { ...validated, id: editingUser.user.id };
      
      onSaveSettings({
        ...settings,
        [key]: newList
      });
      
      setEditingUser(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        showToast(`ข้อมูลไม่ถูกต้อง: ${error.issues[0].message}`, 'red');
      }
    }
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    
    if (deleteConfirm.hasRecords) {
      if (adminPassInput !== settings.adminPassword) {
        showToast('รหัสผ่านแอดมินไม่ถูกต้อง', 'red');
        return;
      }
    }

    const { role, index } = deleteConfirm;
    const key = role === 'teacher' ? 'teachers' : 'evaluators';
    const newList = (settings[key] || []).filter((_, i) => i !== index);
    
    onSaveSettings({
      ...settings,
      [key]: newList
    });
    setDeleteConfirm(null);
    setAdminPassInput('');
  };

  const confirmDelete = (user: User & { role: 'teacher' | 'evaluator', originalIndex: number }) => {
    const hasRecords = records.some(r => 
      (user.role === 'teacher' && (r.teacher_id === user.id || r.teacher_name === user.name)) ||
      (user.role === 'evaluator' && (r.evaluator_id === user.id || r.evaluator === user.name))
    );
    setDeleteConfirm({ id: user.id, name: user.name, role: user.role, index: user.originalIndex, hasRecords });
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          showToast('ไม่พบข้อมูลในไฟล์', 'red');
          return;
        }

        // Map data to User objects
        // Expected columns: "ชื่อ-นามสกุล", "Username", "Password", "บทบาท" (ครู/ผู้นิเทศ)
        const newTeachers: User[] = [...(settings.teachers || [])];
        const newEvaluators: User[] = [...(settings.evaluators || [])];
        let count = 0;

        data.forEach(row => {
          const name = row['ชื่อ-นามสกุล'] || row['Name'] || row['ชื่อ'];
          const username = row['Username'] || row['ชื่อผู้ใช้งาน'] || row['user'];
          const password = row['Password'] || row['รหัสผ่าน'] || row['pass'] || '';
          const role = row['บทบาท'] || row['Role'] || row['ประเภท'];

          if (name && username) {
            const user: User = { id: `${String(role).includes('ผู้นิเทศ') ? 'e' : 't'}-${Date.now()}-${count}`, name: String(name), username: String(username), password: String(password) };
            if (String(role).includes('ผู้นิเทศ') || String(role).toLowerCase().includes('evaluator')) {
              newEvaluators.push(user);
            } else {
              newTeachers.push(user);
            }
            count++;
          }
        });

        if (count > 0) {
          onSaveSettings({
            ...settings,
            teachers: newTeachers,
            evaluators: newEvaluators
          });
          showToast(`นำเข้าข้อมูลสำเร็จ ${count} รายการ`, 'green');
        } else {
          showToast('ไม่สามารถนำเข้าข้อมูลได้ กรุณาตรวจสอบรูปแบบไฟล์', 'red');
        }
      } catch (error) {
        console.error('Error importing excel:', error);
        showToast('เกิดข้อผิดพลาดในการอ่านไฟล์', 'red');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadSample = () => {
    const sampleData = [
      { 'ชื่อ-นามสกุล': 'นายสมชาย ใจดี', 'Username': 'somchai.j', 'Password': 'password123', 'บทบาท': 'ครู' },
      { 'ชื่อ-นามสกุล': 'นางสาวสมศรี มีสุข', 'Username': 'somsri.m', 'Password': 'password456', 'บทบาท': 'ผู้นิเทศ' }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SampleData');
    XLSX.writeFile(wb, 'user_import_sample.xlsx');
    showToast('ดาวน์โหลดไฟล์ตัวอย่างแล้ว', 'green');
  };

  return (
    <div className="tab-content max-w-5xl mx-auto p-4 fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-cyan-600" /> จัดการผู้ใช้งาน
          </h2>
          <p className="text-slate-500 text-sm">จัดการรายชื่อครูผู้สอนและผู้นิเทศในระบบ</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleImportExcel} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 transition text-sm font-bold shadow-sm"
            title="นำเข้าจากไฟล์ Excel (.xlsx, .xls, .csv)"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" /> นำเข้า Excel
          </button>
          <button 
            onClick={handleDownloadSample}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition text-sm font-bold shadow-sm"
            title="ดาวน์โหลดไฟล์ตัวอย่าง Excel"
          >
            <Download size={18} className="text-slate-500" /> ตัวอย่างไฟล์
          </button>
          <button 
            onClick={() => setIsAdding('teacher')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition text-sm font-bold shadow-sm"
          >
            <Plus size={18} className="text-cyan-600" /> เพิ่มครู
          </button>
          <button 
            onClick={() => setIsAdding('evaluator')}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition text-sm font-bold shadow-lg shadow-cyan-600/20"
          >
            <Plus size={18} /> เพิ่มผู้นิเทศ
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {isAdding && (
        <div className="mb-6 bg-cyan-50 border border-cyan-100 rounded-2xl p-6 animate-in zoom-in-95 duration-200">
          <h3 className="text-sm font-bold text-cyan-700 uppercase mb-4">
            เพิ่ม{isAdding === 'teacher' ? 'ครูผู้สอน' : 'ผู้นิเทศ'}ใหม่
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อ-นามสกุล</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  autoFocus
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-cyan-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อผู้ใช้งาน (Username)</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="Username"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-cyan-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">รหัสผ่าน (Password)</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="password" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-cyan-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button 
              onClick={() => { setIsAdding(null); setNewUser({ id: '', name: '', username: '', password: '' }); }}
              className="px-4 py-2 bg-white text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-100 transition"
            >
              ยกเลิก
            </button>
            <button 
              onClick={handleAdd}
              disabled={!newUser.name.trim() || !newUser.username.trim()}
              className="px-6 py-2 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 disabled:opacity-50 transition shadow-lg shadow-cyan-600/20"
            >
              บันทึกข้อมูล
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ หรือชื่อผู้ใช้งาน..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${filter === 'all' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ทั้งหมด
            </button>
            <button 
              onClick={() => setFilter('teacher')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${filter === 'teacher' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ครูผู้สอน
            </button>
            <button 
              onClick={() => setFilter('evaluator')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${filter === 'evaluator' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ผู้นิเทศ
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อผู้ใช้งาน</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">รหัสผ่าน</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">บทบาท</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user, index) => (
                <tr key={`${user.role}-${user.originalIndex}`} className="hover:bg-slate-50/50 transition group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'teacher' ? 'bg-amber-100 text-amber-600' : 'bg-cyan-100 text-cyan-600'}`}>
                        {user.role === 'teacher' ? <GraduationCap size={20} /> : <UserCheck size={20} />}
                      </div>
                      
                      {editingUser && editingUser.index === user.originalIndex && editingUser.role === user.role ? (
                        <input 
                          autoFocus
                          type="text" 
                          value={editingUser.user.name}
                          onChange={(e) => setEditingUser({ ...editingUser, user: { ...editingUser.user, name: e.target.value } })}
                          className="flex-1 px-3 py-1.5 border border-cyan-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                        />
                      ) : (
                        <span className="font-medium text-slate-700">{user.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser && editingUser.index === user.originalIndex && editingUser.role === user.role ? (
                      <input 
                        type="text" 
                        placeholder="Username"
                        value={editingUser.user.username}
                        onChange={(e) => setEditingUser({ ...editingUser, user: { ...editingUser.user, username: e.target.value } })}
                        className="w-full px-3 py-1.5 border border-cyan-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                    ) : (
                      <span className="text-sm text-slate-500 font-mono">{user.username}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser && editingUser.index === user.originalIndex && editingUser.role === user.role ? (
                      <input 
                        type="password" 
                        placeholder="Password"
                        value={editingUser.user.password || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, user: { ...editingUser.user, password: e.target.value } })}
                        className="px-3 py-1.5 border border-cyan-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-cyan-500/20 w-full"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400 font-mono">
                          {showPasswords[`${user.role}-${user.originalIndex}`] ? user.password : '••••••••'}
                        </span>
                        <button 
                          onClick={() => togglePassword(`${user.role}-${user.originalIndex}`)}
                          className="p-1 text-slate-300 hover:text-slate-500 transition"
                        >
                          {showPasswords[`${user.role}-${user.originalIndex}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'teacher' 
                        ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                        : 'bg-cyan-50 text-cyan-600 border border-cyan-100'
                    }`}>
                      {user.role === 'teacher' ? 'ครูผู้สอน' : 'ผู้นิเทศ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingUser && editingUser.index === user.originalIndex && editingUser.role === user.role ? (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={handleUpdate} className="p-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingUser(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setEditingUser({ index: user.originalIndex, role: user.role, user: { id: user.id, name: user.name, username: user.username, password: user.password } })}
                          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(user)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    ไม่พบข้อมูลผู้ใช้งานที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 modal-overlay p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 ${deleteConfirm.hasRecords ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mb-4 mx-auto`}>
              {deleteConfirm.hasRecords ? <ShieldCheck size={24} /> : <Trash2 size={24} />}
            </div>
            <h3 className="font-bold text-slate-800 text-center mb-2">ยืนยันการลบผู้ใช้</h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              คุณต้องการลบ <span className="font-bold text-slate-700">{deleteConfirm.name}</span> ออกจากระบบใช่หรือไม่?
            </p>
            
            {deleteConfirm.hasRecords && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  <span className="font-bold">คำเตือน:</span> ผู้ใช้นี้มีข้อมูลการนิเทศในระบบ เพื่อป้องกันข้อมูลกำพร้า กรุณายืนยันด้วยรหัสผ่านแอดมิน
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
                onClick={handleDelete} 
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
    </div>
  );
}
