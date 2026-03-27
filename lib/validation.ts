import { z } from 'zod';

export const evaluationSchema = z.object({
  type: z.literal('evaluation'),
  teacher_id: z.string().optional(),
  teacher_name: z.string().min(1, 'กรุณาระบุชื่อครูผู้สอน').max(100, 'ชื่อครูยาวเกินไป'),
  subject_id: z.string().optional(),
  subject: z.string().min(1, 'กรุณาระบุวิชา').max(100, 'ชื่อวิชายาวเกินไป'),
  period: z.string().max(50, 'ข้อมูลคาบเรียนยาวเกินไป').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ไม่ถูกต้อง'),
  term: z.string().min(1, 'กรุณาระบุภาคเรียน').max(10, 'ภาคเรียนยาวเกินไป'),
  academic_year: z.string().min(1, 'กรุณาระบุปีการศึกษา').max(10, 'ปีการศึกษายาวเกินไป'),
  evaluator_id: z.string().optional(),
  evaluator: z.string().min(1, 'กรุณาระบุผู้นิเทศ').max(100, 'ชื่อผู้นิเทศยาวเกินไป'),
  scores: z.record(z.string(), z.number().min(1).max(5)),
  suggestion: z.string().max(1000, 'ข้อเสนอแนะยาวเกินไป').optional(),
  attachment_url: z.string().url('รูปแบบ URL ไม่ถูกต้อง').or(z.literal('')).optional(),
  status: z.literal('completed'),
  author_uid: z.string().optional()
});

export type EvaluationInput = z.infer<typeof evaluationSchema>;

export const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'กรุณาระบุชื่อ-นามสกุล').max(100, 'ชื่อ-นามสกุลยาวเกินไป'),
  username: z.string().min(1, 'กรุณาระบุชื่อผู้ใช้งาน').max(50, 'ชื่อผู้ใช้งานยาวเกินไป'),
  password: z.string().max(50, 'รหัสผ่านยาวเกินไป').optional()
});

export const settingsSchema = z.object({
  schoolName: z.string().min(1, 'กรุณาระบุชื่อโรงเรียน').max(200, 'ชื่อโรงเรียนยาวเกินไป'),
  schoolSubName: z.string().max(200, 'ชื่อรองยาวเกินไป').optional(),
  logoUrl: z.string().url('รูปแบบ URL ไม่ถูกต้อง').or(z.literal('')).optional(),
  adminPassword: z.string().min(1, 'กรุณาระบุรหัสผ่านแอดมิน').max(50, 'รหัสผ่านแอดมินยาวเกินไป'),
  criteria: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'กรุณาระบุชื่อเกณฑ์').max(200, 'ชื่อเกณฑ์ยาวเกินไป')
  })).min(1, 'ต้องมีอย่างน้อย 1 เกณฑ์'),
  qualityLevels: z.array(z.object({
    label: z.string().min(1, 'กรุณาระบุชื่อระดับ').max(50, 'ชื่อระดับยาวเกินไป'),
    minScore: z.number().min(0).max(5),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'รูปแบบสีไม่ถูกต้อง')
  })).min(1, 'ต้องมีอย่างน้อย 1 ระดับ'),
  teachers: z.array(userSchema),
  subjects: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'กรุณาระบุชื่อวิชา').max(100, 'ชื่อวิชายาวเกินไป')
  })),
  evaluators: z.array(userSchema),
  years: z.array(z.string().min(1).max(10)),
  terms: z.array(z.string().min(1).max(10))
});
