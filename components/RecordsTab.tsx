import { useState } from 'react';
import { FileText, BookOpen, Trash2, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { EvaluationRecord } from '@/lib/store';
import { AppSettings } from '@/app/page';

export default function RecordsTab({ records, onShowDetail, onDelete, settings }: { records: EvaluationRecord[], onShowDetail: (id: string) => void, onDelete?: (id: string) => void, settings: AppSettings }) {
  const { criteria, qualityLevels, years, terms } = settings;
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');

  const filtered = records.filter(r => {
    const matchesSearch = !search || r.teacher_name.toLowerCase().includes(search.toLowerCase());
    const matchesYear = !yearFilter || r.academic_year === yearFilter;
    const matchesTerm = !termFilter || r.term === termFilter;
    return matchesSearch && matchesYear && matchesTerm;
  });

  const bySubject: Record<string, EvaluationRecord[]> = {};
  filtered.forEach(r => {
    if (!bySubject[r.subject]) bySubject[r.subject] = [];
    bySubject[r.subject].push(r);
  });

  Object.keys(bySubject).forEach(subject => {
    bySubject[subject].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  });

  const subjectKeys = Object.keys(bySubject).sort();

  const getRecordAvg = (r: EvaluationRecord) => {
    if (!criteria || criteria.length === 0) return 0;
    return criteria.reduce((sum, c) => sum + ((r.scores && r.scores[c.id]) || 0), 0) / criteria.length;
  };

  const getQualityInfo = (score: number) => {
    const sortedLevels = [...qualityLevels].sort((a, b) => b.minScore - a.minScore);
    const level = sortedLevels.find(l => score >= l.minScore) || sortedLevels[sortedLevels.length - 1];
    return level || { label: 'N/A', color: '#cbd5e1' };
  };

  return (
    <div className="tab-content max-w-5xl mx-auto p-4 fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-600" /> บันทึกผลการนิเทศทั้งหมด
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <select 
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-32 text-black focus:ring-2 focus:ring-cyan-300 outline-none bg-white"
          >
            <option value="">ทุกปีการศึกษา</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-32 text-black focus:ring-2 focus:ring-cyan-300 outline-none bg-white"
          >
            <option value="">ทุกภาคเรียน</option>
            {terms.map(t => <option key={t} value={t}>ภาคเรียนที่ {t}</option>)}
          </select>
          <input 
            type="text" 
            placeholder="ค้นหาชื่อครู..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-40 text-black focus:ring-2 focus:ring-cyan-300 outline-none" 
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">ยังไม่มีข้อมูล</p>
        ) : (
          subjectKeys.map(subject => {
            const subjectRecords = bySubject[subject];
            return (
              <div key={subject} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm slide-in">
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 px-5 py-3 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-600" />
                    {subject}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{subjectRecords.length} ครั้งนิเทศ</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {subjectRecords.map(r => {
                    const avg = getRecordAvg(r).toFixed(2);
                    const numAvg = parseFloat(avg);
                    const quality = getQualityInfo(numAvg);
                    return (
                      <div key={r.id} className="group cursor-pointer" onClick={() => r.id && onShowDetail(r.id)}>
                        <div className="p-4 flex items-start justify-between hover:bg-slate-50 transition">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {r.teacher_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-700">{r.teacher_name}</p>
                              <p className="text-xs text-slate-400">{r.date}{r.period ? ' • ' + r.period : ''} • ภาคเรียนที่ {r.term || '-'}</p>
                              <p className="text-xs text-slate-400">ผู้นิเทศ: {r.evaluator}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right mr-2">
                              <p className="font-bold text-lg" style={{ color: quality.color }}>{avg}</p>
                              <p className="text-xs text-slate-400">{quality.label}</p>
                            </div>
                            {onDelete && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); r.id && onDelete(r.id); }} 
                                className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {r.suggestion && (
                          <div className="px-4 py-3 bg-cyan-50 flex items-start gap-2 text-xs">
                            <MessageCircle className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                            <p className="text-slate-600">{r.suggestion}</p>
                          </div>
                        )}
                        {r.attachment_url && (
                          <div className="px-4 py-3 bg-amber-50 flex items-start gap-2 text-xs">
                            <ImageIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <a href={r.attachment_url} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline truncate" onClick={(e) => e.stopPropagation()}>ดูรูปภาพหลักฐาน</a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

