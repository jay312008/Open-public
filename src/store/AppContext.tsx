import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompanionId } from '@/constants/assets';
import { pullProfileFromCloud, syncProfileToCloud } from '@/lib/cloudSync';
import {
  DEFAULT_BADGES,
  INITIAL_COMMUNITY_POSTS,
  INITIAL_PUBLIC_STUDENTS,
  INITIAL_STUDY_GROUPS,
  SUBJECT_CATALOG,
} from '@/data/catalog';
import {
  BadgeItem,
  CommunityPost,
  CreditTransactionItem,
  ExamType,
  JourneyLevelNode,
  JourneyPlan,
  KnowledgeLevel,
  LearningMemorySettings,
  LearningPace,
  NotificationItem,
  NotificationPreferences,
  PublicStudent,
  QuizAttemptRecord,
  SavedConversation,
  StudentProfile,
  StudyGroup,
  SubjectItem,
  TimetableSlot,
  XPEvent,
} from '@/types/models';

const STORAGE_KEY = 'learnymol_app_state_v1';

interface PersistedState {
  profile: StudentProfile;
  subjects: SubjectItem[];
  journeyPlan: JourneyPlan | null;
  xpEvents: XPEvent[];
  badges: BadgeItem[];
  posts: CommunityPost[];
  groups: StudyGroup[];
  conversations: SavedConversation[];
  notifications: NotificationItem[];
  notificationPrefs: NotificationPreferences;
  completedLessonIds: string[];
  quizzesCompleted: number;
  learningMemory: LearningMemorySettings;
  timetableSlots: TimetableSlot[];
  quizHistory: QuizAttemptRecord[];
  creditTransactions: CreditTransactionItem[];
  activityLog: string[];
}

const DEFAULT_CREDITS = Number(process.env.EXPO_PUBLIC_DEFAULT_TEST_CREDITS ?? 250);

const INITIAL_PROFILE: StudentProfile = {
  id: 'user-me',
  displayName: 'Alex Johnson',
  username: 'alexj',
  email: 'alex@learnymol.app',
  bio: 'Focused student preparing for upcoming exams with Molly.',
  educationLevel: 'Secondary / O-Level',
  avatarEmoji: '🧑🏾‍🎓',
  avatarBg: '#FFD7CF',
  companionId: 'molly',
  xp: 0,
  level: 1,
  levelTitle: 'Curious Explorer',
  streakDays: 1,
  credits: Number.isFinite(DEFAULT_CREDITS) ? DEFAULT_CREDITS : 250,
  followers: ['stu-amaka', 'stu-kevin'],
  following: ['stu-amaka'],
  onboardingComplete: true,
};

function computeLevel(xp: number): { level: number; levelTitle: string } {
  const level = Math.max(1, Math.floor(xp / 250) + 1);
  const titles = [
    'Curious Explorer',
    'Focused Learner',
    'Rising Scholar',
    'Knowledge Seeker',
    'Concept Builder',
    'Star Learner',
    'Master Student',
  ];
  return { level, levelTitle: titles[Math.min(level - 1, titles.length - 1)] };
}

const INITIAL_TIMETABLE: TimetableSlot[] = [
  {
    id: 'tt-1',
    day: 'Mon',
    timeRange: '16:00 – 17:00',
    subjectName: 'Mathematics',
    topic: 'Quadratic Equations & Factoring',
    reminderEnabled: true,
    completed: false,
  },
  {
    id: 'tt-2',
    day: 'Wed',
    timeRange: '17:00 – 18:00',
    subjectName: 'Physics',
    topic: 'Waves, Frequency & Wavelength',
    reminderEnabled: true,
    completed: false,
  },
  {
    id: 'tt-3',
    day: 'Fri',
    timeRange: '16:30 – 17:30',
    subjectName: 'Chemistry',
    topic: 'Stoichiometry & Mole Calculations',
    reminderEnabled: false,
    completed: false,
  },
];

const INITIAL_STATE: PersistedState = {
  profile: INITIAL_PROFILE,
  subjects: SUBJECT_CATALOG,
  journeyPlan: null, // First-time users MUST see the introductory unfinished road, NOT fake progress!
  xpEvents: [],
  badges: DEFAULT_BADGES,
  posts: INITIAL_COMMUNITY_POSTS,
  groups: INITIAL_STUDY_GROUPS,
  conversations: [],
  notifications: [
    {
      id: 'notif-welcome',
      title: 'Welcome to LearnyMol!',
      body: 'Create your personalized Learning Journey or ask Molly a question to begin.',
      category: 'app',
      read: false,
      createdAt: 'Just now',
    },
  ],
  notificationPrefs: {
    studyReminders: true,
    examAlerts: true,
    achievements: true,
    communityUpdates: true,
    appUpdates: false,
  },
  completedLessonIds: [],
  quizzesCompleted: 0,
  learningMemory: {
    shareContextWithAI: true,
    weakTopics: [],
  },
  timetableSlots: INITIAL_TIMETABLE,
  quizHistory: [],
  creditTransactions: [
    {
      id: 'ct-welcome',
      delta: Number.isFinite(DEFAULT_CREDITS) ? DEFAULT_CREDITS : 250,
      reason: 'Welcome test credit grant (development sandbox)',
      category: 'test-topup',
      createdAt: 'Initial balance',
    },
  ],
  activityLog: [],
};

export interface CreatePlanInput {
  goalName: string;
  examType: ExamType;
  examDate: string;
  selectedSubjectIds: string[];
  selectedTopicIds: string[];
  knowledgeLevel: KnowledgeLevel;
  availableDays: string[];
  dailyStudyMinutes: number;
  difficultAreas: string;
  pace: LearningPace;
}

export interface CreateStudyGroupInput {
  name: string;
  subject: string;
  description: string;
  isPrivate: boolean;
  aiTeacherIds?: string[];
  billingMode?: 'personal' | 'group_pool' | 'sponsored';
}

interface AppContextValue {
  hydrated: boolean;
  profile: StudentProfile;
  subjects: SubjectItem[];
  journeyPlan: JourneyPlan | null;
  xpEvents: XPEvent[];
  badges: BadgeItem[];
  posts: CommunityPost[];
  groups: StudyGroup[];
  publicStudents: PublicStudent[];
  conversations: SavedConversation[];
  notifications: NotificationItem[];
  notificationPrefs: NotificationPreferences;
  completedLessonIds: string[];
  quizzesCompleted: number;
  learningMemory: LearningMemorySettings;
  timetableSlots: TimetableSlot[];
  quizHistory: QuizAttemptRecord[];
  creditTransactions: CreditTransactionItem[];
  activityLog: string[];

  // Profile & Settings
  updateProfile: (patch: Partial<StudentProfile>) => void;
  setCompanion: (companionId: CompanionId) => void;
  updateNotificationPrefs: (patch: Partial<NotificationPreferences>) => void;
  markAllNotificationsRead: () => void;
  consumeCredits: (
    amount: number,
    reason?: string,
    category?: CreditTransactionItem['category']
  ) => boolean;
  grantTestCredits: (amount: number, reason?: string) => void;
  updateLearningMemory: (patch: Partial<LearningMemorySettings>) => void;
  logStudyActivity: (entry: string) => void;

  // Subjects & Custom Topics
  addCustomTopic: (subjectId: string, title: string, description: string) => void;

  // Timetable
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id' | 'completed'>) => void;
  replaceTimetableSlots: (slots: TimetableSlot[]) => void;
  toggleTimetableSlot: (slotId: string) => void;
  deleteTimetableSlot: (slotId: string) => void;

  // Learning Journey
  generateJourneyPlan: (input: CreatePlanInput) => JourneyPlan;
  completeJourneyLesson: (lessonId: string) => { awardedXp: number; alreadyCompleted: boolean };
  toggleDailyTask: (taskId: string) => void;
  recordQuizCompletion: (quizKey: string, scorePercent: number, title?: string) => void;

  // Community & Social
  createPost: (content: string, subjectTag?: string, imageUri?: string, groupId?: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleBookmarkPost: (postId: string) => void;
  addCommentToPost: (postId: string, content: string) => void;
  deletePost: (postId: string) => void;
  toggleFollowUser: (userId: string) => void;
  toggleJoinGroup: (groupId: string) => void;
  sendGroupMessage: (groupId: string, text: string) => void;
  createStudyGroup: (input: CreateStudyGroupInput) => StudyGroup;

  // AI Conversations
  saveConversation: (conv: SavedConversation) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<PersistedState>;
          // Always merge the latest full 44-subject Cameroon GCE & University catalog
          // while preserving any custom topics the user previously added.
          const savedCustomTopicsBySubject = new Map<string, SubjectItem['topics']>();
          for (const oldSub of parsed.subjects ?? []) {
            const customs = (oldSub.topics ?? []).filter((t) => t.isCustom);
            if (customs.length > 0) savedCustomTopicsBySubject.set(oldSub.id, customs);
          }
          const mergedSubjects = SUBJECT_CATALOG.map((sub) => {
            const customs = savedCustomTopicsBySubject.get(sub.id);
            return customs ? { ...sub, topics: [...sub.topics, ...customs] } : sub;
          });

          setState((prev) => ({
            ...prev,
            ...parsed,
            subjects: mergedSubjects,
            profile: { ...prev.profile, ...(parsed.profile ?? {}) },
          }));
        }
      })
      .catch(() => {})
      .finally(() => {
        setHydrated(true);
        pullProfileFromCloud().then((remote) => {
          if (!remote) return;
          setState((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              ...Object.fromEntries(Object.entries(remote).filter(([, v]) => v !== undefined)),
            },
          }));
        });
      });
  }, []);

  const persist = useCallback((next: PersistedState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    syncProfileToCloud(next.profile).catch(() => {});
  }, []);

  const updateState = useCallback(
    (updater: (prev: PersistedState) => PersistedState) => {
      setState((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const awardXPInState = (
    prev: PersistedState,
    idempotencyKey: string,
    amount: number,
    reason: string
  ): { next: PersistedState; awarded: number } => {
    if (prev.xpEvents.some((e) => e.idempotencyKey === idempotencyKey)) {
      return { next: prev, awarded: 0 };
    }
    const newXp = prev.profile.xp + amount;
    const { level, levelTitle } = computeLevel(newXp);
    const event: XPEvent = {
      id: `xp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      idempotencyKey,
      amount,
      reason,
      createdAt: new Date().toISOString(),
    };
    return {
      awarded: amount,
      next: {
        ...prev,
        profile: { ...prev.profile, xp: newXp, level, levelTitle },
        xpEvents: [event, ...prev.xpEvents],
      },
    };
  };

  const evaluateBadges = (s: PersistedState): PersistedState => {
    const completedLevelsCount = (s.journeyPlan?.levels ?? []).filter(
      (lvl) => lvl.lessons.length > 0 && lvl.lessons.every((l) => l.completed)
    ).length;

    const badges = s.badges.map((b) => {
      if (b.unlocked) return b;
      let shouldUnlock = false;
      if (b.id === 'first-step' && s.completedLessonIds.length >= 1) shouldUnlock = true;
      if (b.id === 'consistent-learner' && s.profile.streakDays >= 3) shouldUnlock = true;
      if (b.id === 'quiz-master' && s.quizzesCompleted >= 1) shouldUnlock = true;
      if (
        b.id === 'study-buddy' &&
        (s.posts.some((p) => p.authorId === s.profile.id) || s.groups.some((g) => g.joined))
      ) {
        shouldUnlock = true;
      }
      if (b.id === 'goal-crusher' && completedLevelsCount >= 1) shouldUnlock = true;
      return shouldUnlock ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() } : b;
    });
    return { ...s, badges };
  };

  const updateProfile = useCallback(
    (patch: Partial<StudentProfile>) => {
      updateState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
    },
    [updateState]
  );

  const setCompanion = useCallback(
    (companionId: CompanionId) => {
      updateState((prev) => ({ ...prev, profile: { ...prev.profile, companionId } }));
    },
    [updateState]
  );

  const updateNotificationPrefs = useCallback(
    (patch: Partial<NotificationPreferences>) => {
      updateState((prev) => ({
        ...prev,
        notificationPrefs: { ...prev.notificationPrefs, ...patch },
      }));
    },
    [updateState]
  );

  const markAllNotificationsRead = useCallback(() => {
    updateState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, [updateState]);

  const consumeCredits = useCallback(
    (
      amount: number,
      reason = 'AI session credit usage',
      category: CreditTransactionItem['category'] = 'ai-chat'
    ): boolean => {
      let ok = false;
      updateState((prev) => {
        if (prev.profile.credits < amount) return prev;
        ok = true;
        const tx: CreditTransactionItem = {
          id: `ct-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          delta: -amount,
          reason,
          category,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        return {
          ...prev,
          profile: { ...prev.profile, credits: prev.profile.credits - amount },
          creditTransactions: [tx, ...(prev.creditTransactions ?? [])].slice(0, 60),
        };
      });
      return ok;
    },
    [updateState]
  );

  const grantTestCredits = useCallback(
    (amount: number, reason = 'Test credit top-up (sandbox)') => {
      updateState((prev) => {
        const tx: CreditTransactionItem = {
          id: `ct-${Date.now()}`,
          delta: amount,
          reason,
          category: 'test-topup',
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        return {
          ...prev,
          profile: { ...prev.profile, credits: prev.profile.credits + amount },
          creditTransactions: [tx, ...(prev.creditTransactions ?? [])].slice(0, 60),
        };
      });
    },
    [updateState]
  );

  const updateLearningMemory = useCallback(
    (patch: Partial<LearningMemorySettings>) => {
      updateState((prev) => ({
        ...prev,
        learningMemory: {
          ...(prev.learningMemory ?? { shareContextWithAI: true, weakTopics: [] }),
          ...patch,
        },
      }));
    },
    [updateState]
  );

  const logStudyActivity = useCallback(
    (entry: string) => {
      const clean = entry.trim();
      if (!clean) return;
      updateState((prev) => ({
        ...prev,
        activityLog: [clean, ...(prev.activityLog ?? [])].slice(0, 120),
      }));
    },
    [updateState]
  );

  const addTimetableSlot = useCallback(
    (slot: Omit<TimetableSlot, 'id' | 'completed'>) => {
      updateState((prev) => ({
        ...prev,
        timetableSlots: [
          ...(prev.timetableSlots ?? []),
          { ...slot, id: `tt-${Date.now()}`, completed: false },
        ],
      }));
    },
    [updateState]
  );

  const replaceTimetableSlots = useCallback(
    (slots: TimetableSlot[]) => {
      updateState((prev) => ({
        ...prev,
        timetableSlots: slots,
      }));
    },
    [updateState]
  );

  const toggleTimetableSlot = useCallback(
    (slotId: string) => {
      updateState((prev) => ({
        ...prev,
        timetableSlots: (prev.timetableSlots ?? []).map((s) =>
          s.id === slotId ? { ...s, completed: !s.completed } : s
        ),
      }));
    },
    [updateState]
  );

  const deleteTimetableSlot = useCallback(
    (slotId: string) => {
      updateState((prev) => ({
        ...prev,
        timetableSlots: (prev.timetableSlots ?? []).filter((s) => s.id !== slotId),
      }));
    },
    [updateState]
  );

  const addCustomTopic = useCallback(
    (subjectId: string, title: string, description: string) => {
      const cleanTitle = title.trim();
      if (!cleanTitle) return;
      updateState((prev) => {
        const topicId = `custom-${Date.now()}`;
        const subjects = prev.subjects.map((sub) => {
          if (sub.id !== subjectId) return sub;
          return {
            ...sub,
            topics: [
              ...sub.topics,
              {
                id: topicId,
                subjectId,
                title: cleanTitle,
                description: description.trim() || `Custom study topic for ${sub.name}`,
                estimatedMinutes: 45,
                difficulty: 'Medium' as const,
                isCustom: true,
                lessons: [
                  {
                    id: `${topicId}-l1`,
                    topicId,
                    subjectId,
                    title: `${cleanTitle} — Core Concepts`,
                    durationMinutes: 15,
                    summary: `Foundational overview of ${cleanTitle}.`,
                    keyPoints: ['Understand key definitions', 'Review core examples'],
                  },
                  {
                    id: `${topicId}-l2`,
                    topicId,
                    subjectId,
                    title: `${cleanTitle} — Worked Practice`,
                    durationMinutes: 15,
                    summary: `Step-by-step exercises for ${cleanTitle}.`,
                    keyPoints: ['Apply rules to exam-style problems'],
                  },
                  {
                    id: `${topicId}-l3`,
                    topicId,
                    subjectId,
                    title: `${cleanTitle} — Quick Review Quiz`,
                    durationMinutes: 15,
                    summary: `Check mastery of ${cleanTitle}.`,
                    keyPoints: ['Test recall under timed conditions'],
                  },
                ],
              },
            ],
          };
        });
        return { ...prev, subjects };
      });
    },
    [updateState]
  );

  const generateJourneyPlan = useCallback(
    (input: CreatePlanInput): JourneyPlan => {
      let createdPlan!: JourneyPlan;
      updateState((prev) => {
        const selectedSubjects = prev.subjects.filter((s) =>
          input.selectedSubjectIds.includes(s.id)
        );
        const allCandidateTopics = selectedSubjects.flatMap((sub) =>
          sub.topics
            .filter(
              (t) =>
                input.selectedTopicIds.length === 0 || input.selectedTopicIds.includes(t.id)
            )
            .map((t) => ({ sub, topic: t }))
        );

        const baseLevels: JourneyLevelNode[] = allCandidateTopics.slice(0, 20).map(({ sub, topic }, idx) => ({
          id: `lvl-${topic.id}`,
          levelNumber: idx + 1,
          subjectId: sub.id,
          subjectName: sub.name,
          topicId: topic.id,
          topicTitle: topic.title,
          estimatedMinutes: topic.estimatedMinutes,
          lessons: topic.lessons.map((lesson, lIdx) => {
            const alreadyDone = prev.completedLessonIds.includes(lesson.id);
            return {
              id: `jl-${lesson.id}`,
              levelId: `lvl-${topic.id}`,
              lessonId: lesson.id,
              title: lesson.title,
              durationMinutes: lesson.durationMinutes,
              completed: alreadyDone,
              completedAt: alreadyDone ? new Date().toISOString() : undefined,
              order: lIdx + 1,
            };
          }),
        }));

        // Expand short roadmaps (< 8 levels) with progressive Practice Drill & Exam Mastery stages
        const expandedLevels: JourneyLevelNode[] = [...baseLevels];
        const stageTemplates = [
          { suffix: 'drill', label: 'Guided Practice & Drills' },
          { suffix: 'checkpoint', label: 'Exam Checkpoint & Past Questions' },
          { suffix: 'mastery', label: 'Final Mastery & Speed Review' },
        ];
        let templateIdx = 0;
        while (expandedLevels.length < 8 && baseLevels.length > 0 && templateIdx < stageTemplates.length) {
          const tpl = stageTemplates[templateIdx];
          for (const base of baseLevels) {
            if (expandedLevels.length >= 10) break;
            const nextNum = expandedLevels.length + 1;
            const stageId = `lvl-${base.topicId}-${tpl.suffix}`;
            expandedLevels.push({
              id: stageId,
              levelNumber: nextNum,
              subjectId: base.subjectId,
              subjectName: base.subjectName,
              topicId: base.topicId,
              topicTitle: `${base.topicTitle}: ${tpl.label}`,
              estimatedMinutes: Math.max(30, Math.round(base.estimatedMinutes * 0.6)),
              lessons: base.lessons.slice(0, 3).map((l, i) => ({
                ...l,
                id: `jl-${stageId}-${i + 1}`,
                levelId: stageId,
                title: `${tpl.label.split(' ')[0]}: ${l.title}`,
                order: i + 1,
              })),
            });
          }
          templateIdx += 1;
        }

        const levels: JourneyLevelNode[] = expandedLevels.slice(0, 20).map((lvl, idx) => ({
          ...lvl,
          levelNumber: idx + 1,
        }));

        const totalMinutes = levels.reduce((acc, l) => acc + l.estimatedMinutes, 0);
        const daysUntilExam = Math.max(
          1,
          Math.ceil((new Date(input.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        );
        const availableSessions = Math.max(
          1,
          Math.floor((daysUntilExam / 7) * Math.max(1, input.availableDays.length))
        );
        const capacityMinutes = availableSessions * input.dailyStudyMinutes;

        const scheduleWarning =
          totalMinutes > capacityMinutes
            ? `Your selected topics need ~${Math.round(totalMinutes / 60)}h, while your schedule provides ~${Math.round(capacityMinutes / 60)}h before the exam. Consider increasing daily study time or focusing on high-priority topics.`
            : undefined;

        const firstLessons = levels.flatMap((l) => l.lessons).filter((l) => !l.completed).slice(0, 3);
        const todayTasks = [
          ...firstLessons.map((l, i) => ({
            id: `task-${l.lessonId}`,
            title: `${i === 0 ? 'Read' : i === 1 ? 'Practice' : 'Review'}: ${l.title}`,
            type: (i === 0 ? 'read' : i === 1 ? 'practice' : 'watch') as 'read' | 'practice' | 'watch',
            lessonId: l.lessonId,
            completed: false,
            xpReward: 25,
          })),
          {
            id: 'task-daily-quiz',
            title: 'Take a short readiness quiz',
            type: 'quiz' as const,
            completed: false,
            xpReward: 30,
          },
        ];

        createdPlan = {
          id: prev.journeyPlan?.id ?? `plan-${Date.now()}`,
          ...input,
          scheduleWarning,
          levels,
          todayTasks,
          weeklyCompletedDays: prev.journeyPlan?.weeklyCompletedDays ?? 0,
          createdAt: prev.journeyPlan?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          ...prev,
          journeyPlan: createdPlan,
          notifications: [
            {
              id: `notif-plan-${Date.now()}`,
              title: 'Study Journey Ready!',
              body: `Generated ${levels.length} levels for ${input.goalName}.`,
              category: 'study',
              read: false,
              createdAt: 'Just now',
            },
            ...prev.notifications,
          ],
        };
      });
      return createdPlan;
    },
    [updateState]
  );

  const completeJourneyLesson = useCallback(
    (lessonId: string): { awardedXp: number; alreadyCompleted: boolean } => {
      let result = { awardedXp: 0, alreadyCompleted: false };
      updateState((prev) => {
        const alreadyCompleted = prev.completedLessonIds.includes(lessonId);
        if (alreadyCompleted) {
          result = { awardedXp: 0, alreadyCompleted: true };
          return prev;
        }
        const completedLessonIds = [...prev.completedLessonIds, lessonId];
        const journeyPlan = prev.journeyPlan
          ? {
              ...prev.journeyPlan,
              weeklyCompletedDays: Math.min(7, prev.journeyPlan.weeklyCompletedDays + 1),
              levels: prev.journeyPlan.levels.map((lvl) => ({
                ...lvl,
                lessons: lvl.lessons.map((l) =>
                  l.lessonId === lessonId
                    ? { ...l, completed: true, completedAt: new Date().toISOString() }
                    : l
                ),
              })),
              todayTasks: prev.journeyPlan.todayTasks.map((t) =>
                t.lessonId === lessonId ? { ...t, completed: true } : t
              ),
              updatedAt: new Date().toISOString(),
            }
          : null;

        const withCompletion: PersistedState = {
          ...prev,
          completedLessonIds,
          journeyPlan,
        };
        const { next: withXp, awarded } = awardXPInState(
          withCompletion,
          `lesson-complete:${lessonId}`,
          50,
          'Completed lesson'
        );
        result = { awardedXp: awarded, alreadyCompleted: false };
        return evaluateBadges(withXp);
      });
      return result;
    },
    [updateState]
  );

  const toggleDailyTask = useCallback(
    (taskId: string) => {
      updateState((prev) => {
        if (!prev.journeyPlan) return prev;
        const target = prev.journeyPlan.todayTasks.find((t) => t.id === taskId);
        if (!target) return prev;
        const nextCompleted = !target.completed;
        const nextPlan: JourneyPlan = {
          ...prev.journeyPlan,
          todayTasks: prev.journeyPlan.todayTasks.map((t) =>
            t.id === taskId ? { ...t, completed: nextCompleted } : t
          ),
        };
        let nextState: PersistedState = { ...prev, journeyPlan: nextPlan };
        if (nextCompleted) {
          nextState = awardXPInState(
            nextState,
            `daily-task:${taskId}`,
            target.xpReward,
            `Completed task: ${target.title}`
          ).next;
        }
        return evaluateBadges(nextState);
      });
    },
    [updateState]
  );

  const recordQuizCompletion = useCallback(
    (quizKey: string, scorePercent: number, title?: string) => {
      updateState((prev) => {
        const xp = Math.max(20, Math.round(scorePercent * 0.6));
        const recordTitle = title ?? quizKey.replace(/[-_]/g, ' ');
        const attempt: QuizAttemptRecord = {
          id: `qa-${Date.now()}`,
          quizKey,
          title: recordTitle,
          scorePercent,
          createdAt: new Date().toLocaleDateString(),
        };
        const currentMem = prev.learningMemory ?? { shareContextWithAI: true, weakTopics: [] };
        const nextWeak =
          scorePercent < 60 && !currentMem.weakTopics.includes(recordTitle)
            ? [recordTitle, ...currentMem.weakTopics].slice(0, 12)
            : currentMem.weakTopics;
        const { next } = awardXPInState(
          {
            ...prev,
            quizzesCompleted: prev.quizzesCompleted + 1,
            quizHistory: [attempt, ...(prev.quizHistory ?? [])].slice(0, 40),
            learningMemory: { ...currentMem, weakTopics: nextWeak },
          },
          `quiz:${quizKey}`,
          xp,
          `Quiz completed (${scorePercent}%)`
        );
        return evaluateBadges(next);
      });
    },
    [updateState]
  );

  const createPost = useCallback(
    (content: string, subjectTag?: string, imageUri?: string, groupId?: string) => {
      const clean = content.trim();
      if (!clean) return;
      updateState((prev) => {
        const post: CommunityPost = {
          id: `post-${Date.now()}`,
          authorId: prev.profile.id,
          authorName: prev.profile.displayName,
          authorUsername: prev.profile.username,
          authorAvatar: prev.profile.avatarEmoji,
          authorBg: prev.profile.avatarBg,
          subjectTag,
          content: clean,
          imageUri,
          likes: [],
          bookmarks: [],
          comments: [],
          groupId,
          createdAt: 'Just now',
        };
        return evaluateBadges({ ...prev, posts: [post, ...prev.posts] });
      });
    },
    [updateState]
  );

  const toggleLikePost = useCallback(
    (postId: string) => {
      updateState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => {
          if (p.id !== postId) return p;
          const liked = p.likes.includes(prev.profile.id);
          return {
            ...p,
            likes: liked
              ? p.likes.filter((id) => id !== prev.profile.id)
              : [...p.likes, prev.profile.id],
          };
        }),
      }));
    },
    [updateState]
  );

  const toggleBookmarkPost = useCallback(
    (postId: string) => {
      updateState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => {
          if (p.id !== postId) return p;
          const saved = p.bookmarks.includes(prev.profile.id);
          return {
            ...p,
            bookmarks: saved
              ? p.bookmarks.filter((id) => id !== prev.profile.id)
              : [...p.bookmarks, prev.profile.id],
          };
        }),
      }));
    },
    [updateState]
  );

  const addCommentToPost = useCallback(
    (postId: string, content: string) => {
      const clean = content.trim();
      if (!clean) return;
      updateState((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                comments: [
                  ...p.comments,
                  {
                    id: `c-${Date.now()}`,
                    authorId: prev.profile.id,
                    authorName: prev.profile.displayName,
                    authorUsername: prev.profile.username,
                    authorAvatar: prev.profile.avatarEmoji,
                    content: clean,
                    createdAt: 'Just now',
                  },
                ],
              }
        ),
      }));
    },
    [updateState]
  );

  const deletePost = useCallback(
    (postId: string) => {
      updateState((prev) => ({
        ...prev,
        posts: prev.posts.filter((p) => !(p.id === postId && p.authorId === prev.profile.id)),
      }));
    },
    [updateState]
  );

  const toggleFollowUser = useCallback(
    (userId: string) => {
      if (userId === state.profile.id) return;
      updateState((prev) => {
        const isFollowing = prev.profile.following.includes(userId);
        return {
          ...prev,
          profile: {
            ...prev.profile,
            following: isFollowing
              ? prev.profile.following.filter((id) => id !== userId)
              : [...prev.profile.following, userId],
          },
        };
      });
    },
    [state.profile.id, updateState]
  );

  const toggleJoinGroup = useCallback(
    (groupId: string) => {
      updateState((prev) =>
        evaluateBadges({
          ...prev,
          groups: prev.groups.map((g) =>
            g.id !== groupId
              ? g
              : { ...g, joined: !g.joined, memberCount: g.joined ? g.memberCount - 1 : g.memberCount + 1 }
          ),
        })
      );
    },
    [updateState]
  );

  const sendGroupMessage = useCallback(
    (groupId: string, text: string) => {
      const clean = text.trim();
      if (!clean) return;
      updateState((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id !== groupId
            ? g
            : {
                ...g,
                messages: [
                  ...g.messages,
                  {
                    id: `gm-${Date.now()}`,
                    senderName: prev.profile.displayName,
                    senderAvatar: prev.profile.avatarEmoji,
                    text: clean,
                    createdAt: 'Just now',
                  },
                ],
              }
        ),
      }));
    },
    [updateState]
  );

  const createStudyGroup = useCallback(
    (input: CreateStudyGroupInput): StudyGroup => {
      const code = `LM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const newGroup: StudyGroup = {
        id: `grp-${Date.now()}`,
        name: input.name.trim(),
        subject: input.subject.trim() || 'General',
        description: input.description.trim() || 'Focused study group on LearnyMol.',
        isPrivate: input.isPrivate,
        inviteCode: input.isPrivate ? code : undefined,
        // Per Master Blueprint: Public AI is disabled by default; Private groups can host up to 5 AI Teachers
        aiEnabled: input.isPrivate ? (input.aiTeacherIds?.length ?? 0) > 0 : false,
        aiTeacherIds: input.isPrivate ? (input.aiTeacherIds ?? []).slice(0, 5) : [],
        billingMode: input.billingMode ?? 'personal',
        dailyQuizPrompt: `Daily ${input.subject || 'GCE'} Quick Check`,
        memberCount: 1,
        joined: true,
        messages: [
          {
            id: `gm-welcome-${Date.now()}`,
            senderName: 'LearnyMol',
            senderAvatar: '🌿',
            text: input.isPrivate
              ? `Private study group created! Share invite code ${code} with classmates. Up to 5 AI Teachers can assist this room.`
              : 'Public study group created! Peer-to-peer discussion is open (Public AI is disabled by default to protect credit pools).',
            createdAt: 'Just now',
          },
        ],
      };
      updateState((prev) => evaluateBadges({ ...prev, groups: [newGroup, ...prev.groups] }));
      return newGroup;
    },
    [updateState]
  );

  const saveConversation = useCallback(
    (conv: SavedConversation) => {
      updateState((prev) => {
        const exists = prev.conversations.some((c) => c.id === conv.id);
        return {
          ...prev,
          conversations: exists
            ? prev.conversations.map((c) => (c.id === conv.id ? conv : c))
            : [conv, ...prev.conversations],
        };
      });
    },
    [updateState]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      profile: state.profile,
      subjects: state.subjects,
      journeyPlan: state.journeyPlan,
      xpEvents: state.xpEvents,
      badges: state.badges,
      posts: state.posts,
      groups: state.groups,
      publicStudents: INITIAL_PUBLIC_STUDENTS,
      conversations: state.conversations,
      notifications: state.notifications,
      notificationPrefs: state.notificationPrefs,
      completedLessonIds: state.completedLessonIds,
      quizzesCompleted: state.quizzesCompleted,
      learningMemory: state.learningMemory ?? { shareContextWithAI: true, weakTopics: [] },
      timetableSlots: state.timetableSlots ?? INITIAL_TIMETABLE,
      quizHistory: state.quizHistory ?? [],
      creditTransactions: state.creditTransactions ?? [],
      activityLog: state.activityLog ?? [],
      updateProfile,
      setCompanion,
      updateNotificationPrefs,
      markAllNotificationsRead,
      consumeCredits,
      grantTestCredits,
      updateLearningMemory,
      logStudyActivity,
      addCustomTopic,
      addTimetableSlot,
      replaceTimetableSlots,
      toggleTimetableSlot,
      deleteTimetableSlot,
      generateJourneyPlan,
      completeJourneyLesson,
      toggleDailyTask,
      recordQuizCompletion,
      createPost,
      toggleLikePost,
      toggleBookmarkPost,
      addCommentToPost,
      deletePost,
      toggleFollowUser,
      toggleJoinGroup,
      sendGroupMessage,
      createStudyGroup,
      saveConversation,
    }),
    [
      hydrated,
      state,
      updateProfile,
      setCompanion,
      updateNotificationPrefs,
      markAllNotificationsRead,
      consumeCredits,
      grantTestCredits,
      updateLearningMemory,
      logStudyActivity,
      addCustomTopic,
      addTimetableSlot,
      replaceTimetableSlots,
      toggleTimetableSlot,
      deleteTimetableSlot,
      generateJourneyPlan,
      completeJourneyLesson,
      toggleDailyTask,
      recordQuizCompletion,
      createPost,
      toggleLikePost,
      toggleBookmarkPost,
      addCommentToPost,
      deletePost,
      toggleFollowUser,
      toggleJoinGroup,
      sendGroupMessage,
      createStudyGroup,
      saveConversation,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
