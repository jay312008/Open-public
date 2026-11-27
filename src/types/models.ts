import { CompanionId } from '@/constants/assets';

export type ExamType =
  | 'GCE O-Level'
  | 'GCE A-Level'
  | 'University Exam'
  | 'Class Exam'
  | 'Custom Exam'
  | 'Personal Learning Goal';

export type KnowledgeLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type LearningPace = 'Relaxed' | 'Balanced' | 'Intensive';

export interface StudentProfile {
  id: string;
  displayName: string;
  username: string;
  email: string;
  bio: string;
  educationLevel: string;
  avatarEmoji: string;
  avatarBg: string;
  companionId: CompanionId;
  xp: number;
  level: number;
  levelTitle: string;
  streakDays: number;
  credits: number;
  followers: string[]; // user IDs
  following: string[]; // user IDs
  onboardingComplete: boolean;
}

export interface TopicItem {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isCustom?: boolean;
  lessons: LessonItem[];
}

export interface LessonItem {
  id: string;
  topicId: string;
  subjectId: string;
  title: string;
  durationMinutes: number;
  summary: string;
  keyPoints: string[];
  exampleEquation?: string;
  practiceQuestion?: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface SubjectItem {
  id: string;
  code?: string;
  name: string;
  level: string;
  icon: string;
  color: string;
  bgTint: string;
  topics: TopicItem[];
}

export interface JourneyLessonNode {
  id: string;
  levelId: string;
  lessonId: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
  completedAt?: string;
  order: number;
}

export interface JourneyLevelNode {
  id: string;
  levelNumber: number;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicTitle: string;
  estimatedMinutes: number;
  lessons: JourneyLessonNode[];
}

export interface DailyTaskItem {
  id: string;
  title: string;
  type: 'read' | 'practice' | 'watch' | 'quiz';
  lessonId?: string;
  completed: boolean;
  xpReward: number;
}

export interface JourneyPlan {
  id: string;
  goalName: string;
  examType: ExamType;
  examDate: string; // YYYY-MM-DD
  selectedSubjectIds: string[];
  selectedTopicIds: string[];
  knowledgeLevel: KnowledgeLevel;
  availableDays: string[]; // ['Mon', 'Tue', ...]
  dailyStudyMinutes: number;
  difficultAreas: string;
  pace: LearningPace;
  scheduleWarning?: string;
  levels: JourneyLevelNode[];
  todayTasks: DailyTaskItem[];
  weeklyCompletedDays: number; // 0..7
  createdAt: string;
  updatedAt: string;
}

export interface XPEvent {
  id: string;
  idempotencyKey: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  requirement: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorBg: string;
  subjectTag?: string;
  content: string;
  imageUri?: string;
  likes: string[]; // user IDs
  bookmarks: string[]; // user IDs
  comments: CommunityComment[];
  groupId?: string;
  createdAt: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  description: string;
  isPrivate: boolean;
  memberCount: number;
  joined: boolean;
  messages: {
    id: string;
    senderName: string;
    senderAvatar: string;
    text: string;
    createdAt: string;
  }[];
}

export interface SavedConversation {
  id: string;
  title: string;
  tool: 'ask-molly' | 'live-teacher';
  subject?: string;
  updatedAt: string;
  messages: {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    equation?: string;
    createdAt: string;
  }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: 'study' | 'exam' | 'achievement' | 'community' | 'app';
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  studyReminders: boolean;
  examAlerts: boolean;
  achievements: boolean;
  communityUpdates: boolean;
  appUpdates: boolean;
}

export interface PublicStudent {
  id: string;
  displayName: string;
  username: string;
  avatarEmoji: string;
  avatarBg: string;
  level: number;
  levelTitle: string;
  xp: number;
  weeklyXp: number;
  monthlyXp: number;
  streakDays: number;
  bio: string;
}

export interface LiveBoardElement {
  id: string;
  type: 'title' | 'equation' | 'step' | 'diagram' | 'note';
  label: string;
  content: string;
  explanation: string;
}

export interface LiveLessonStep {
  id: string;
  speechText: string;
  boardElement: LiveBoardElement;
  durationMs: number;
}

export interface AITeacherDoc {
  id: string;
  title: string;
  content: string;
  addedAt: string;
}

export interface AITeacherItem {
  id: string;
  name: string;
  subjectName: string;
  educationLevel: 'O-Level' | 'A-Level' | 'University';
  teachingStyle: 'Friendly Step-by-Step' | 'Strict Exam Coach' | 'Socratic Questioning';
  avatarEmoji: string;
  accentColor: string;
  instructions: string;
  documents: AITeacherDoc[];
  roadmapSteps: { id: string; title: string; done: boolean }[];
  createdAt: string;
}

export interface LearningMemorySettings {
  shareContextWithAI: boolean;
  weakTopics: string[];
}
