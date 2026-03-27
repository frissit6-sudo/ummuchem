import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy, getDocFromServer } from 'firebase/firestore';
import { db, auth } from './firebase';
import { z } from 'zod';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { evaluationSchema } from './validation';

export interface EvaluationRecord {
  id?: string;
  type: string;
  teacher_id?: string;
  teacher_name: string;
  subject_id?: string;
  subject: string;
  period?: string;
  date: string;
  term: string;
  academic_year: string;
  evaluator_id?: string;
  evaluator: string;
  scores: Record<string, number>;
  suggestion?: string;
  attachment_url?: string;
  status: string;
  author_uid?: string;
}

export function useEvaluations() {
  const [records, setRecords] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. The client is offline.");
      }
    }
  };

  const loadMockData = async () => {
    const mockData: Omit<EvaluationRecord, 'id'>[] = [
      {
        type: 'evaluation',
        teacher_name: 'สมชาย ใจดี',
        subject: 'คณิตศาสตร์',
        period: '1',
        date: '2023-11-01',
        term: '2',
        academic_year: '2566',
        evaluator: 'ผู้อำนวยการ',
        scores: {
          'c1': 4,
          'c2': 5,
          'c3': 4,
          'c4': 4,
          'c5': 5
        },
        suggestion: 'สอนได้ดีมาก นักเรียนมีส่วนร่วม',
        attachment_url: '',
        status: 'completed',
        author_uid: auth.currentUser?.uid
      },
      {
        type: 'evaluation',
        teacher_name: 'สมหญิง รักเรียน',
        subject: 'ภาษาไทย',
        period: '3',
        date: '2023-11-05',
        term: '2',
        academic_year: '2566',
        evaluator: 'หัวหน้าหมวด',
        scores: {
          'c1': 3,
          'c2': 4,
          'c3': 3,
          'c4': 4,
          'c5': 4
        },
        suggestion: 'ควรเพิ่มสื่อการสอนที่หลากหลาย',
        attachment_url: '',
        status: 'completed',
        author_uid: auth.currentUser?.uid
      }
    ];

    for (const record of mockData) {
      try {
        const validated = evaluationSchema.parse(record);
        await addDoc(collection(db, 'evaluations'), validated);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'evaluations');
      }
    }
  };

  useEffect(() => {
    testConnection();

    const q = query(collection(db, 'evaluations'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EvaluationRecord[];
      
      if (data.length === 0) {
        loadMockData();
      } else {
        setRecords(data);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'evaluations');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addRecord = async (record: Omit<EvaluationRecord, 'id'>) => {
    try {
      const recordWithAuth = {
        ...record,
        author_uid: auth.currentUser?.uid
      };
      
      // Robust validation before sending to Firestore
      const validated = evaluationSchema.parse(recordWithAuth);
      
      await addDoc(collection(db, 'evaluations'), validated);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new Error(`Validation failed: ${error.issues.map(e => e.message).join(', ')}`);
        handleFirestoreError(validationError, OperationType.CREATE, 'evaluations');
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'evaluations');
      }
      return false;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'evaluations', id));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `evaluations/${id}`);
      return false;
    }
  };

  return { records, loading, addRecord, deleteRecord };
}
