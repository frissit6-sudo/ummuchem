import { useState, useRef } from 'react';
import Image from 'next/image';
import { ClipboardCheck, Info, Star, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import { EvaluationRecord } from '@/lib/store';
import { uploadFile } from '@/lib/firebase';
import { AppSettings } from '@/app/page';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { evaluationSchema, EvaluationInput } from '@/lib/validation';

export default function EvaluateTab({ onSave, settings, showToast }: { onSave: (record: Omit<EvaluationRecord, 'id'>) => Promise<boolean>, settings: AppSettings, showToast: (msg: string, color: string) => void }) {
  const { criteria, teachers, subjects, evaluators, years, terms } = settings;
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EvaluationInput>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      type: 'evaluation',
      teacher_name: '',
      subject: '',
      period: '',
      date: new Date().toISOString().split('T')[0],
      term: '',
      academic_year: '',
      evaluator: '',
      suggestion: '',
      scores: {},
      status: 'completed',
      attachment_url: ''
    }
  });

  const scores = watch('scores');

  const handleScoreChange = (id: string, value: number) => {
    setValue('scores', { ...scores, [id]: value }, { shouldValidate: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)', 'red');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'red');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: EvaluationInput) => {
    setLoading(true);

    let attachmentUrl = '';
    if (selectedFile) {
      try {
        attachmentUrl = await uploadFile(selectedFile, 'evaluations');
      } catch (error) {
        console.error('Error uploading file:', error);
        showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ', 'red');
        setLoading(false);
        return;
      }
    }

    const teacherObj = teachers.find(t => t.name === data.teacher_name.trim());
    const evaluatorObj = evaluators.find(e => e.name === data.evaluator.trim());
    const subjectObj = subjects.find(s => s.name === data.subject.trim());

    const record: Omit<EvaluationRecord, 'id'> = {
      ...data,
      teacher_id: teacherObj?.id,
      evaluator_id: evaluatorObj?.id,
      subject_id: subjectObj?.id,
      attachment_url: attachmentUrl || '',
    };

    const success = await onSave(record);
    if (success) {
      handleReset();
    }
    setLoading(false);
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="tab-content max-w-3xl mx-auto p-4 fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-4 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" /> แบบประเมินการนิเทศการสอน
          </h2>
          <p className="text-cyan-100 text-xs mt-1">กรอกข้อมูลและให้คะแนนตามเกณฑ์การประเมิน</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <Info className="w-4 h-4" /> ข้อมูลพื้นฐาน
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">ชื่อครูผู้สอน <span className="text-red-400">*</span></label>
                <input {...register('teacher_name')} list="teachers-list" type="text" placeholder="ชื่อ-นามสกุล" className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:ring-2 outline-none transition ${errors.teacher_name ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-cyan-300 focus:border-cyan-400'}`} />
                {errors.teacher_name && <p className="text-red-500 text-[10px] mt-1">{errors.teacher_name.message}</p>}
                <datalist id="teachers-list">
                  {teachers.map((t) => <option key={t.id} value={t.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">วิชา <span className="text-red-400">*</span></label>
                <input {...register('subject')} list="subjects-list" type="text" placeholder="ชื่อวิชา" className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:ring-2 outline-none transition ${errors.subject ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-cyan-300 focus:border-cyan-400'}`} />
                {errors.subject && <p className="text-red-500 text-[10px] mt-1">{errors.subject.message}</p>}
                <datalist id="subjects-list">
                  {subjects.map((s) => <option key={s.id} value={s.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">คาบ/ชั่วโมง</label>
                <input {...register('period')} type="text" placeholder="เช่น คาบที่ 1" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">วันที่นิเทศ <span className="text-red-400">*</span></label>
                <input {...register('date')} type="date" className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:ring-2 outline-none transition ${errors.date ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-cyan-300 focus:border-cyan-400'}`} />
                {errors.date && <p className="text-red-500 text-[10px] mt-1">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">ภาคเรียน <span className="text-red-400">*</span></label>
                <input {...register('term')} list="terms-list" type="text" placeholder="เช่น 1" className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:ring-2 outline-none transition ${errors.term ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-cyan-300 focus:border-cyan-400'}`} />
                {errors.term && <p className="text-red-500 text-[10px] mt-1">{errors.term.message}</p>}
                <datalist id="terms-list">
                  {terms.map((t, i) => <option key={i} value={t} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">ปีการศึกษา <span className="text-red-400">*</span></label>
                <input {...register('academic_year')} list="years-list" type="text" placeholder="เช่น 2567" className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:ring-2 outline-none transition ${errors.academic_year ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-cyan-300 focus:border-cyan-400'}`} />
                {errors.academic_year && <p className="text-red-500 text-[10px] mt-1">{errors.academic_year.message}</p>}
                <datalist id="years-list">
                  {years.map((y, i) => <option key={i} value={y} />)}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">ผู้นิเทศ <span className="text-red-400">*</span></label>
                <input {...register('evaluator')} list="evaluators-list" type="text" placeholder="ชื่อผู้นิเทศ" className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:ring-2 outline-none transition ${errors.evaluator ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-cyan-300 focus:border-cyan-400'}`} />
                {errors.evaluator && <p className="text-red-500 text-[10px] mt-1">{errors.evaluator.message}</p>}
                <datalist id="evaluators-list">
                  {evaluators.map((ev) => <option key={ev.id} value={ev.name} />)}
                </datalist>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <Star className="w-4 h-4" /> คะแนนการประเมิน ({criteria.length} เกณฑ์)
            </h3>
            <p className="text-xs text-slate-400">ให้คะแนน 1-5 สำหรับแต่ละเกณฑ์ (1=ปรับปรุง, 5=ยอดเยี่ยม)</p>
            {errors.scores && <p className="text-red-500 text-[10px] font-bold">กรุณาให้คะแนนให้ครบทุกเกณฑ์</p>}
            <div className="space-y-4">
              {criteria.map((c, idx) => (
                <div key={c.id} className={`p-4 rounded-2xl border transition ${errors.scores?.[c.id] ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    {idx + 1}. {c.name} <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleScoreChange(c.id, num)}
                        className={`flex-1 min-w-[50px] py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                          scores?.[c.id] === num
                            ? 'bg-cyan-600 border-cyan-600 text-white shadow-md scale-105'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-cyan-300 hover:text-cyan-600'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">ปรับปรุง</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">ยอดเยี่ยม</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">ข้อเสนอแนะเชิงพัฒนา</label>
            <textarea {...register('suggestion')} rows={3} placeholder="เขียนข้อเสนอแนะเพื่อการพัฒนา..." className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-300 focus:border-cyan-400 outline-none transition resize-none"></textarea>
            {errors.suggestion && <p className="text-red-500 text-[10px] mt-1">{errors.suggestion.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">แนบรูปภาพหลักฐาน</label>
            <div className="space-y-3">
              {!previewUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-cyan-400 hover:bg-cyan-50 transition group"
                >
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-cyan-100 transition">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-cyan-600 transition" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600">คลิกเพื่ออัปโหลดรูปภาพ</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG หรือ JPEG (สูงสุด 5MB)</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                  <Image 
                    src={previewUrl} 
                    alt="Preview" 
                    fill
                    className="object-contain" 
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm text-white px-3 py-2 text-xs flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" />
                    <span className="truncate">{selectedFile?.name}</span>
                  </div>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:from-cyan-700 hover:to-teal-700 transition flex items-center justify-center gap-2">
              {loading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save className="w-4 h-4" />}
              {loading ? 'กำลังบันทึก...' : 'บันทึกผลการนิเทศ'}
            </button>
            <button type="button" onClick={handleReset} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-medium text-sm hover:bg-slate-200 transition">
              ล้าง
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

