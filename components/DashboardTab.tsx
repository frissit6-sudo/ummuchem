import { EvaluationRecord } from '@/lib/store';
import { Users, ClipboardCheck, Star, TrendingUp, Target, HeartHandshake, MessageCircle, Search, Trophy, Clock, PieChart } from 'lucide-react';
import { AppSettings } from '@/app/page';

export default function DashboardTab({ records, onShowDetail, settings }: { records: EvaluationRecord[], onShowDetail: (id: string) => void, settings: AppSettings }) {
  const { criteria, qualityLevels } = settings;
  const teachers = new Set(records.map(r => r.teacher_name)).size;
  const completed = records.length;
  
  const getQualityInfo = (score: number) => {
    const levels = [...qualityLevels].sort((a, b) => b.minScore - a.minScore);
    const level = levels.find(l => score >= l.minScore) || levels[levels.length - 1];
    return level;
  };

  const getRecordAvg = (r: EvaluationRecord) => {
    if (!criteria || criteria.length === 0) return 0;
    return criteria.reduce((sum, c) => sum + ((r.scores && r.scores[c.id]) || 0), 0) / criteria.length;
  };

  let totalAvg = 0;
  if (completed > 0) {
    totalAvg = records.reduce((sum, r) => sum + getRecordAvg(r), 0) / completed;
  }

  const subjectMap: Record<string, EvaluationRecord[]> = {};
  records.forEach(r => {
    if (!subjectMap[r.subject]) subjectMap[r.subject] = [];
    subjectMap[r.subject].push(r);
  });
  const subjectEntries = Object.entries(subjectMap).sort();
  const maxVal = subjectEntries.length > 0 ? Math.max(...subjectEntries.map(([,recs]) => recs.reduce((s, r) => s + getRecordAvg(r), 0) / recs.length)) : 1;

  const counts: Record<string, number> = {};
  qualityLevels.forEach(l => counts[l.label] = 0);
  
  records.forEach(r => {
    const avg = getRecordAvg(r);
    const q = getQualityInfo(avg);
    if (q) counts[q.label]++;
  });

  const colors: Record<string, string> = {};
  qualityLevels.forEach(l => colors[l.label] = l.color);

  const total = completed;
  const slices = qualityLevels.map((l) => {
    const count = counts[l.label] || 0;
    const pct = total > 0 ? (count / total * 100) : 0;
    return { label: l.label, count, pct, color: l.color };
  }).filter(s => s.count > 0);

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const recent = [...records].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
  const totalQuality = getQualityInfo(totalAvg);

  return (
    <div className="tab-content max-w-7xl mx-auto p-4 fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="stat-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100 card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">ครูทั้งหมด</p>
              <p className="text-xl font-bold text-slate-800">{teachers}</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100 card-hover" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">นิเทศแล้ว</p>
              <p className="text-xl font-bold text-slate-800">{completed}</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100 card-hover" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">คะแนนเฉลี่ย</p>
              <p className="text-xl font-bold text-slate-800">{completed > 0 ? totalAvg.toFixed(2) : '-'}</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-white rounded-2xl p-4 shadow-sm border border-slate-100 card-hover" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">ระดับคุณภาพ</p>
              <p className="text-lg font-bold text-slate-800">{completed > 0 ? totalQuality.label : '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-600" /> สรุปผลการประเมินรายกลุ่มสาระการเรียนรู้
          </h3>
          <div className="space-y-3 max-h-56 overflow-x-auto">
            {completed > 0 ? (
              <div className="flex items-end gap-2 h-48 pb-4 overflow-x-auto">
                {subjectEntries.map(([subject, recs]) => {
                  const sAvg = recs.reduce((s, r) => s + getRecordAvg(r), 0) / recs.length;
                  const barHeight = (sAvg / maxVal * 100);
                  return (
                    <div key={subject} className="flex flex-col items-center gap-2 flex-shrink-0" style={{ minWidth: '60px' }}>
                      <div className="relative w-full flex justify-center">
                        <div className="w-8 rounded-t-lg transition-all duration-700 bg-gradient-to-t from-cyan-500 to-cyan-300 hover:from-cyan-600 hover:to-cyan-400 hover:shadow-lg" style={{ height: `${barHeight}%`, minHeight: '20px' }} title={`${subject}: ${sAvg.toFixed(2)}/5`}>
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-700 whitespace-nowrap">{sAvg.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-600 truncate max-w-12">{subject}</p>
                        <p className="text-xs text-slate-400">{recs.length}x</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">ยังไม่มีข้อมูล</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-cyan-600" /> ระดับคุณภาพของครูผู้สอน
          </h3>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <svg viewBox="0 0 100 100" className="w-full h-40">
                <circle cx="50" cy="50" r="30" fill="white" stroke="#f1f5f9" strokeWidth="1"></circle>
                {completed > 0 && slices.map((s, i) => {
                  const sliceLength = (s.pct / 100) * circumference;
                  const svg = <circle key={i} cx="50" cy="50" r={radius} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${sliceLength} ${circumference}`} strokeDashoffset={`-${offset}`} strokeLinecap="round"></circle>;
                  offset += sliceLength;
                  return svg;
                })}
              </svg>
            </div>
            <div className="flex-1 space-y-2 text-sm">
              {completed > 0 ? (
                <div className="space-y-3">
                  {Object.entries(counts).sort((a,b) => b[1] - a[1]).map(([label, count]) => {
                    const pct = total > 0 ? (count / total * 100).toFixed(0) : 0;
                    const color = colors[label];
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }}></div>
                        <span className="text-sm text-slate-600"><strong>{label}</strong></span>
                        <span className="text-sm font-bold ml-auto" style={{ color: color }}>{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-center">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-600" /> วัตถุประสงค์ของระบบ
        </h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            <HeartHandshake className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> <span>สร้างระบบการนิเทศแบบกัลยาณมิตร</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            <MessageCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /> <span>พัฒนากระบวนการสะท้อนผลการสอน</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            <Search className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" /> <span>ติดตาม ตรวจสอบ และประเมินคุณภาพการสอน</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            <Trophy className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" /> <span>ยกระดับผลสัมฤทธิ์และสมรรถนะผู้เรียน</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-600" /> บันทึกล่าสุด
        </h3>
        <div className="space-y-2">
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">ยังไม่มีข้อมูลการนิเทศ<br /><span className="text-xs">เริ่มต้นโดยไปที่แท็บ &quot;นิเทศการสอน&quot;</span></p>
          ) : (
            recent.map(r => {
              const avg = getRecordAvg(r).toFixed(1);
              const numAvg = parseFloat(avg);
              const quality = getQualityInfo(numAvg);
              return (
                <div key={r.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 slide-in cursor-pointer hover:bg-slate-100 transition" onClick={() => r.id && onShowDetail(r.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-700 text-xs font-bold">{r.teacher_name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{r.teacher_name}</p>
                      <p className="text-xs text-slate-400">{r.subject} • {r.date} • ภาคเรียนที่ {r.term || '-'} ปี {r.academic_year || '-'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: quality.color }}>{avg}</p>
                    <p className="text-xs text-slate-400">{quality.label}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

