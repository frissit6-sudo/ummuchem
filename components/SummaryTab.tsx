import { useState } from 'react';
import { BarChart3, BookOpen, TrendingUp, PieChart, Users, MessageCircle } from 'lucide-react';
import { EvaluationRecord } from '@/lib/store';
import { AppSettings } from '@/app/page';

export default function SummaryTab({ records, settings }: { records: EvaluationRecord[], settings: AppSettings }) {
  const { criteria, qualityLevels, years, terms } = settings;
  const [yearFilter, setYearFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');

  const filtered = records.filter(r => {
    const matchesYear = !yearFilter || r.academic_year === yearFilter;
    const matchesTerm = !termFilter || r.term === termFilter;
    return matchesYear && matchesTerm;
  });

  if (filtered.length === 0) {
    return (
      <div className="tab-content max-w-6xl mx-auto p-4 fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-600" /> สรุปผลการนิเทศภาพรวม
          </h2>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
        <p className="text-sm text-slate-400 text-center py-10">ยังไม่มีข้อมูลสำหรับสรุปผลในเงื่อนไขที่เลือก</p>
      </div>
    );
  }

  const n = filtered.length;
  const avgByField: Record<string, number> = {};
  
  criteria.forEach(c => {
    avgByField[c.id] = filtered.reduce((s, r) => s + ((r.scores && r.scores[c.id]) || 0), 0) / n;
  });
  const overallAvg = criteria.length > 0 ? criteria.reduce((s, c) => s + avgByField[c.id], 0) / criteria.length : 0;

  const getRecordAvg = (r: EvaluationRecord) => {
    if (!criteria || criteria.length === 0) return 0;
    return criteria.reduce((sum, c) => sum + ((r.scores && r.scores[c.id]) || 0), 0) / criteria.length;
  };

  const getQualityInfo = (score: number) => {
    const sortedLevels = [...qualityLevels].sort((a, b) => b.minScore - a.minScore);
    const level = sortedLevels.find(l => score >= l.minScore) || sortedLevels[sortedLevels.length - 1];
    return level || { label: 'N/A', color: '#cbd5e1' };
  };

  const subjectMap: Record<string, EvaluationRecord[]> = {};
  filtered.forEach(r => {
    if (!subjectMap[r.subject]) subjectMap[r.subject] = [];
    subjectMap[r.subject].push(r);
  });
  const subjectAvg: Record<string, number> = {};
  Object.entries(subjectMap).forEach(([subject, recs]) => {
    subjectAvg[subject] = recs.reduce((s, r) => s + getRecordAvg(r), 0) / recs.length;
  });

  const teacherMap: Record<string, EvaluationRecord[]> = {};
  filtered.forEach(r => {
    if (!teacherMap[r.teacher_name]) teacherMap[r.teacher_name] = [];
    teacherMap[r.teacher_name].push(r);
  });

  const maxBar = 5;
  const criteriaColors = ['#0891b2', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#f97316', '#06b6d4', '#f43f5e', '#14b8a6'];
  const subjectColors = ['#0891b2', '#059669', '#d97706', '#dc2626', '#8b5cf6', '#f97316', '#06b6d4', '#f43f5e', '#14b8a6'];

  const termMap: Record<string, EvaluationRecord[]> = {};
  filtered.forEach(r => {
    const key = (r.term || '-') + '/' + (r.academic_year || '-');
    if (!termMap[key]) termMap[key] = [];
    termMap[key].push(r);
  });

  const counts: Record<string, number> = {};
  qualityLevels.forEach(l => counts[l.label] = 0);
  
  filtered.forEach(r => {
    const avg = getRecordAvg(r);
    const quality = getQualityInfo(avg);
    if (counts[quality.label] !== undefined) {
      counts[quality.label]++;
    }
  });
  
  const total = n;
  const slices = qualityLevels.map(l => {
    const count = counts[l.label] || 0;
    const pct = total > 0 ? (count / total * 100) : 0;
    return { label: l.label, count, pct, color: l.color };
  });

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="tab-content max-w-6xl mx-auto p-4 fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-700 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-600" /> สรุปผลการนิเทศภาพรวม
        </h2>
        <div className="flex items-center gap-2">
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
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-600" /> แผนภูมิแท่งรายเกณฑ์การนิเทศ
          </h3>
          <div className="space-y-4">
            {criteria.map((c, idx) => {
              const val = avgByField[c.id] || 0;
              const pct = (val / maxBar * 100).toFixed(0);
              return (
                <div key={c.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium">{c.name}</span>
                    <span className="font-bold text-lg" style={{ color: criteriaColors[idx % criteriaColors.length] }}>{val.toFixed(2)}/5</span>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${pct}%`, background: criteriaColors[idx % criteriaColors.length] }}>
                      <span className="text-xs font-bold text-white">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600">ค่าเฉลี่ยรวม</span>
            <span className="text-3xl font-bold" style={{ color: getQualityInfo(overallAvg).color }}>{overallAvg.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-600" /> แผนภูมิแท่งรายกลุ่มสาระ
          </h3>
          <div className="space-y-4">
            {Object.entries(subjectAvg).sort((a,b) => b[1] - a[1]).map((entry, idx) => {
              const [subject, avg] = entry;
              const pct = (avg / maxBar * 100).toFixed(0);
              return (
                <div key={subject}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium truncate">{subject}</span>
                    <span className="font-bold text-lg" style={{ color: subjectColors[idx % subjectColors.length] }}>{avg.toFixed(2)}/5</span>
                  </div>
                  <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${pct}%`, background: subjectColors[idx % subjectColors.length] }}>
                      <span className="text-xs font-bold text-white">{pct}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{subjectMap[subject].length} ครั้งนิเทศ</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-600" /> สรุปผลการประเมินรายภาคเรียน
          </h3>
          <div className="space-y-4">
            {Object.entries(termMap).sort().map(([term, recs]) => {
              const tAvg = recs.reduce((s, r) => s + getRecordAvg(r), 0) / recs.length;
              const pct = (tAvg / maxBar * 100).toFixed(0);
              return (
                <div key={term}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium">ภาคเรียนที่ {term}</span>
                    <span className="font-bold" style={{ color: getQualityInfo(tAvg).color }}>{tAvg.toFixed(2)}/5</span>
                  </div>
                  <div className="h-5 bg-slate-100 rounded-lg overflow-hidden">
                    <div className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0891b2, #06b6d4)' }}>
                      <span className="text-xs font-bold text-white">{pct}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{recs.length} ครั้งนิเทศ</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-cyan-600" /> ระดับคุณภาพ
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <svg viewBox="0 0 100 100" className="w-40 h-40">
                <circle cx="50" cy="50" r="35" fill="white" stroke="#f1f5f9" strokeWidth="1"></circle>
                {slices.map((s, i) => {
                  const sliceLength = (s.pct / 100) * circumference;
                  // Calculate offset based on previous slices
                  const currentOffset = slices.slice(0, i).reduce((acc, curr) => acc + (curr.pct / 100) * circumference, 0);
                  return (
                    <circle 
                      key={i} 
                      cx="50" 
                      cy="50" 
                      r={radius} 
                      fill="none" 
                      stroke={s.color} 
                      strokeWidth="12" 
                      strokeDasharray={`${sliceLength} ${circumference}`} 
                      strokeDashoffset={`-${currentOffset}`} 
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="flex-1 space-y-2 text-sm">
              {slices.sort((a,b) => b.count - a.count).map((s) => {
                const pct = total > 0 ? (s.count / total * 100).toFixed(0) : 0;
                return (
                  <div key={s.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: s.color }}></div>
                    <span className="text-slate-600">{s.label}: <strong>{s.count}</strong> ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600" /> สรุปรายบุคคล
          </h3>
          <div className="space-y-2 max-h-72 overflow-auto">
            {Object.entries(teacherMap).map(([name, recs]) => {
              const tAvg = recs.reduce((s, r) => s + getRecordAvg(r), 0) / recs.length;
              const quality = getQualityInfo(tAvg);
              return (
                <div key={name} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{name}</p>
                      <p className="text-xs text-slate-400">{recs.length} ครั้ง</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: quality.color }}>{tAvg.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">{quality.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-cyan-600" /> รวมข้อเสนอแนะ
          </h3>
          <div className="space-y-2 max-h-80 overflow-auto">
            {records.filter(r => r.suggestion).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">ยังไม่มีข้อเสนอแนะ</p>
            ) : (
              records.filter(r => r.suggestion).sort((a,b) => (b.date||'').localeCompare(a.date||'')).map(r => (
                <div key={r.id} className="bg-slate-50 rounded-lg px-4 py-3">
                  <p className="text-sm text-slate-600">&quot;{r.suggestion}&quot;</p>
                  <p className="text-xs text-slate-400 mt-1">— สำหรับ {r.teacher_name} ({r.date})</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

