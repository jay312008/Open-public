import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AITeacherDoc, AITeacherItem } from '@/types/models';

const STORAGE_KEY = 'learnymol_ai_teachers_v1';

const STARTER_TEACHERS: AITeacherItem[] = [
  {
    id: 'teacher-gce-phys',
    name: 'Prof. Newton (GCE Physics)',
    subjectName: 'Physics (GCE 0580 / 0780)',
    educationLevel: 'O-Level',
    teachingStyle: 'Friendly Step-by-Step',
    avatarEmoji: '⚡',
    accentColor: '#2563EB',
    instructions:
      'Focus on Cameroon GCE Physics past-question marking schemes, SI units, free-body diagrams, and wave formulas.',
    documents: [
      {
        id: 'doc-phys-1',
        title: 'Core Physics Formula Sheet',
        content: 'v = f × λ | F = m × a | V = I × R | P = I × V | s = ut + ½at²',
        addedAt: 'Starter Note',
      },
    ],
    roadmapSteps: [
      { id: 'r1', title: 'Master SI Units & Measurements', done: true },
      { id: 'r2', title: 'Forces, Motion & Newton’s Laws', done: false },
      { id: 'r3', title: 'Waves, Optics & Sound', done: false },
      { id: 'r4', title: 'Electricity & Circuits Exam Drills', done: false },
    ],
    createdAt: 'Today',
  },
  {
    id: 'teacher-chem-coach',
    name: 'Dr. Curie (Chemistry Coach)',
    subjectName: 'Chemistry (GCE 0515 / 0715)',
    educationLevel: 'A-Level',
    teachingStyle: 'Strict Exam Coach',
    avatarEmoji: '🧪',
    accentColor: '#9333EA',
    instructions:
      'Drill balanced chemical equations, mole calculations, energetics, and organic reaction mechanisms with concise marking tips.',
    documents: [
      {
        id: 'doc-chem-1',
        title: 'Bonding & Mole Rules',
        content: 'n = m / Mr | Ionic bonds transfer electrons; Covalent bonds share electron pairs.',
        addedAt: 'Starter Note',
      },
    ],
    roadmapSteps: [
      { id: 'c1', title: 'Atomic Structure & Bonding', done: false },
      { id: 'c2', title: 'Mole Concept & Stoichiometry', done: false },
      { id: 'c3', title: 'Organic Functional Groups', done: false },
    ],
    createdAt: 'Today',
  },
];

export function useAITeachers() {
  const [teachers, setTeachers] = useState<AITeacherItem[]>(STARTER_TEACHERS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as AITeacherItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTeachers(parsed);
          }
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const persist = useCallback((next: AITeacherItem[]) => {
    setTeachers(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const createTeacher = useCallback(
    (input: Omit<AITeacherItem, 'id' | 'createdAt' | 'roadmapSteps'>) => {
      const created: AITeacherItem = {
        ...input,
        id: `teacher-${Date.now()}`,
        createdAt: new Date().toLocaleDateString(),
        roadmapSteps: [
          { id: `rs-1`, title: `${input.subjectName}: Core Foundations`, done: false },
          { id: `rs-2`, title: `${input.subjectName}: Worked Examples`, done: false },
          { id: `rs-3`, title: `${input.subjectName}: Past Questions & Mastery`, done: false },
        ],
      };
      persist([created, ...teachers]);
      return created;
    },
    [teachers, persist]
  );

  const addDocumentToTeacher = useCallback(
    (teacherId: string, title: string, content: string) => {
      const doc: AITeacherDoc = {
        id: `doc-${Date.now()}`,
        title: title.trim() || 'Uploaded Study Note',
        content: content.trim(),
        addedAt: new Date().toLocaleDateString(),
      };
      persist(
        teachers.map((t) =>
          t.id === teacherId ? { ...t, documents: [doc, ...t.documents] } : t
        )
      );
    },
    [teachers, persist]
  );

  const toggleRoadmapStep = useCallback(
    (teacherId: string, stepId: string) => {
      persist(
        teachers.map((t) =>
          t.id === teacherId
            ? {
                ...t,
                roadmapSteps: t.roadmapSteps.map((s) =>
                  s.id === stepId ? { ...s, done: !s.done } : s
                ),
              }
            : t
        )
      );
    },
    [teachers, persist]
  );

  const deleteTeacher = useCallback(
    (teacherId: string) => {
      persist(teachers.filter((t) => t.id !== teacherId));
    },
    [teachers, persist]
  );

  return {
    teachers,
    hydrated,
    createTeacher,
    addDocumentToTeacher,
    toggleRoadmapStep,
    deleteTeacher,
  };
}
