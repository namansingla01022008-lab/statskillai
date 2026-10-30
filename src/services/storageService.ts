import {
  User,
  LearnerProfile,
  Course,
  Opportunity,
  Application,
  Mentor,
  Mentorship,
  DirectMessage,
  ChatMessage,
  QuizRecord,
  OrgEmployee,
  AssessmentAttempt,
  GapAnalysis,
  LearningPath,
  AppSettings,
  DomainType,
} from '../types';
import {
  SEED_USERS,
  SEED_COURSES,
  SEED_OPPORTUNITIES,
  SEED_ORGANISATIONS,
  SEED_MENTORS,
  SEED_PROFILES,
  SEED_INITIAL_ATTEMPTS,
  SEED_INITIAL_GAPS,
  SEED_INITIAL_LEARNING_PATH,
  SEED_MENTORSHIPS,
  SEED_DIRECT_MESSAGES,
  generateSeedOrgEmployees,
} from './seedData';
import { storage } from './storage';
import { runStorageMigration } from './storageMigration';
import {
  StorageMappers,
  QuestionCacheMap,
  CompactAttempt,
  CompactQuiz,
} from './storageMappers';
import {
  STORAGE_CAPS,
  QUESTION_CACHE_TTL_MS,
} from './storageConfig';

// Generic getItem / setItem wrappers maintaining backward compatibility
export function getItem<T>(collection: string, defaultValue: T): T {
  const loaded = storage.load<T>(collection);
  if (loaded === null || loaded === undefined) {
    return defaultValue;
  }
  return loaded;
}

export function setItem<T>(collection: string, value: T): void {
  storage.save(collection, value);
}

// Helper to access and persist the shared question cache
function getQuestionCache(): QuestionCacheMap {
  return storage.load<QuestionCacheMap>('questions_cache') || {};
}

function saveQuestionCache(cache: QuestionCacheMap): void {
  StorageMappers.trimQuestionCache(cache, STORAGE_CAPS.MAX_QUESTIONS_CACHE);
  storage.save('questions_cache', cache, QUESTION_CACHE_TTL_MS);
}

export const StorageService = {
  // Initialization & Reset
  initStorage(forceReset = false): void {
    // 1. Run versioned migration for any legacy statskillai:* keys
    runStorageMigration();

    const isInitialized = storage.load<boolean>('initialized');
    if (isInitialized && !forceReset) {
      return;
    }

    // Initialize question cache & compact seed attempts
    const questionCache: QuestionCacheMap = {};
    const compactSeedAttempts: Record<string, CompactAttempt[]> = {};

    for (const userId of Object.keys(SEED_INITIAL_ATTEMPTS)) {
      const attempts = SEED_INITIAL_ATTEMPTS[userId] || [];
      compactSeedAttempts[userId] = attempts.map((att) =>
        StorageMappers.attemptToStorage(att, questionCache)
      );
    }
    saveQuestionCache(questionCache);

    // Seed default datasets into storage wrapper
    storage.save('users', SEED_USERS);
    storage.save('courses', SEED_COURSES);
    storage.save('opportunities', SEED_OPPORTUNITIES);
    storage.save('organisations', SEED_ORGANISATIONS);
    storage.save('mentors', SEED_MENTORS);
    storage.save('profiles', SEED_PROFILES);
    storage.save('assessmentAttempts', compactSeedAttempts);
    storage.save('gapAnalyses', SEED_INITIAL_GAPS);
    storage.save('learningPaths', SEED_INITIAL_LEARNING_PATH);
    storage.save('mentorships', SEED_MENTORSHIPS);
    storage.save('messages', SEED_DIRECT_MESSAGES);
    storage.save('orgEmployees', generateSeedOrgEmployees());
    storage.save('applications', [
      {
        id: 'app-init-1',
        opportunityId: 'opp-101',
        opportunityTitle: 'Statistical Analyst & Survey Methodologist (Fellowship)',
        organisation: 'Ministry of Statistics and Programme Implementation (MoSPI)',
        userId: 'user-learner-student',
        userName: 'Aarav Sharma',
        userEmail: 'aarav.sharma@univ.edu.in',
        appliedAt: '2026-09-28T11:20:00Z',
        status: 'Under review',
        matchPercentage: 82,
        notes: 'Submitted resume and SWAYAM certification verification ID.',
      },
      {
        id: 'app-init-2',
        opportunityId: 'opp-104',
        opportunityTitle: 'Graduate Statistical Apprentice (NEP Skilling Track)',
        organisation: 'Indian Statistical Institute (ISI)',
        userId: 'user-learner-student',
        userName: 'Aarav Sharma',
        userEmail: 'aarav.sharma@univ.edu.in',
        appliedAt: '2026-09-29T15:45:00Z',
        status: 'Submitted',
        matchPercentage: 78,
      },
    ]);
    storage.save('quizzes', []);
    storage.save('chatHistory', [
      {
        id: 'chat-seed-1',
        userId: 'user-learner-student',
        role: 'assistant',
        content:
          'Namaste Aarav! I am your StatSkillAI learning guide. Based on your recent adaptive assessment, I see that your Technical skills are strong (78), but you have an identified gap in Survey Sampling (55). How would you like to advance today?',
        timestamp: '2026-09-28T10:00:00Z',
      },
    ]);

    const defaultSettings: AppSettings = {
      language: 'en',
      highContrast: false,
      fontSize: 'default',
      activeUserId: 'user-learner-student',
    };
    storage.save('settings', defaultSettings);
    storage.save('initialized', true);

    if (process.env.NODE_ENV !== 'production') {
      console.log('StatSkillAI optimized storage initialized successfully.');
    }
  },

  resetAllData(): void {
    storage.clearAll();
    this.initStorage(true);
  },

  // Settings
  getSettings(): AppSettings {
    return getItem<AppSettings>('settings', {
      language: 'en',
      highContrast: false,
      fontSize: 'default',
      activeUserId: 'user-learner-student',
    });
  },

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    storage.save('settings', updated);
    return updated;
  },

  // Users & Active Account
  getUsers(): User[] {
    return getItem<User[]>('users', SEED_USERS);
  },

  getUser(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },

  getActiveUser(): User {
    const settings = this.getSettings();
    const users = this.getUsers();
    const found = users.find((u) => u.id === settings.activeUserId);
    return found || users[0];
  },

  setActiveUserId(userId: string): void {
    this.saveSettings({ activeUserId: userId });
  },

  // Profiles
  getProfile(userId: string): LearnerProfile | null {
    const profiles = getItem<Record<string, LearnerProfile>>('profiles', {});
    return profiles[userId] || null;
  },

  saveProfile(profile: LearnerProfile): void {
    const profiles = getItem<Record<string, LearnerProfile>>('profiles', {});
    let score = 0;
    if (profile.fullName) score += 10;
    if (profile.highestEducation) score += 10;
    if (profile.qualifications) score += 10;
    if (profile.currentRoleOrCourse) score += 10;
    if (profile.organisationOrInstitution) score += 10;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.interests && profile.interests.length > 0) score += 10;
    if (profile.previousTrainings && profile.previousTrainings.length > 0) score += 10;
    if (profile.careerGoal && profile.careerGoal.trim().length > 10) score += 15;
    profile.completeness = Math.min(100, score);
    profile.updatedAt = new Date().toISOString();

    profiles[profile.userId] = profile;
    storage.save('profiles', profiles);
  },

  // Assessment Attempts (Optimized via Shared Normalized Question Cache & Compact Shapes)
  getAttempts(userId: string): AssessmentAttempt[] {
    const all = storage.load<Record<string, CompactAttempt[]>>('assessmentAttempts') || {};
    const userCompactAttempts = all[userId] || [];
    const questionCache = getQuestionCache();

    return userCompactAttempts.map((compact) =>
      StorageMappers.attemptFromStorage(compact, questionCache)
    );
  },

  getLatestDomainScores(userId: string): Record<DomainType, number> {
    const attempts = this.getAttempts(userId);
    const scores: Record<DomainType, number> = {
      Technical: 0,
      Statistical: 0,
      Digital: 0,
      Behavioural: 0,
    };

    const domains: DomainType[] = ['Technical', 'Statistical', 'Digital', 'Behavioural'];
    domains.forEach((d) => {
      const match = attempts
        .filter((a) => a.domain === d && a.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      if (match) {
        scores[d] = match.score;
      }
    });

    return scores;
  },

  saveAttempt(attempt: AssessmentAttempt): void {
    const all = storage.load<Record<string, CompactAttempt[]>>('assessmentAttempts') || {};
    const questionCache = getQuestionCache();

    // Normalize question records into shared cache and convert attempt to compact shape
    const compact = StorageMappers.attemptToStorage(attempt, questionCache);
    saveQuestionCache(questionCache);

    const userAttempts = all[attempt.userId] || [];
    userAttempts.unshift(compact);

    // Enforce capacity bounds (MAX_ATTEMPTS_PER_USER)
    if (userAttempts.length > STORAGE_CAPS.MAX_ATTEMPTS_PER_USER) {
      all[attempt.userId] = userAttempts.slice(0, STORAGE_CAPS.MAX_ATTEMPTS_PER_USER);
    } else {
      all[attempt.userId] = userAttempts;
    }

    storage.save('assessmentAttempts', all);
  },

  // Gap Analysis
  getGapAnalysis(userId: string): GapAnalysis | null {
    const all = getItem<Record<string, GapAnalysis>>('gapAnalyses', {});
    return all[userId] || null;
  },

  saveGapAnalysis(analysis: GapAnalysis): void {
    const all = getItem<Record<string, GapAnalysis>>('gapAnalyses', {});
    all[analysis.userId] = analysis;
    storage.save('gapAnalyses', all);
  },

  // Learning Paths
  getLearningPath(userId: string): LearningPath | null {
    const all = getItem<Record<string, LearningPath>>('learningPaths', {});
    return all[userId] || null;
  },

  saveLearningPath(path: LearningPath): void {
    const all = getItem<Record<string, LearningPath>>('learningPaths', {});
    if (path.steps && path.steps.length > 0) {
      const completed = path.steps.filter((s) => s.status === 'Completed').length;
      path.progressPercent = Math.round((completed / path.steps.length) * 100);
      path.isCompleted = completed === path.steps.length;
    } else {
      path.progressPercent = 0;
      path.isCompleted = false;
    }
    path.updatedAt = new Date().toISOString();
    all[path.userId] = path;
    storage.save('learningPaths', all);
  },

  updateLearningStepStatus(
    userId: string,
    stepId: string,
    status: 'Not started' | 'In progress' | 'Completed'
  ): LearningPath | null {
    const path = this.getLearningPath(userId);
    if (!path) return null;
    const step = path.steps.find((s) => s.id === stepId);
    if (step) {
      step.status = status;
      this.saveLearningPath(path);
    }
    return path;
  },

  // Courses
  getCourses(): Course[] {
    return getItem<Course[]>('courses', SEED_COURSES);
  },

  saveCourse(course: Course): void {
    const list = this.getCourses();
    const idx = list.findIndex((c) => c.id === course.id);
    if (idx >= 0) {
      list[idx] = course;
    } else {
      list.push(course);
    }
    storage.save('courses', list);
  },

  deleteCourse(courseId: string): void {
    const list = this.getCourses().filter((c) => c.id !== courseId);
    storage.save('courses', list);
  },

  // Opportunities
  getOpportunities(): Opportunity[] {
    return getItem<Opportunity[]>('opportunities', SEED_OPPORTUNITIES);
  },

  saveOpportunity(opp: Opportunity): void {
    const list = this.getOpportunities();
    const idx = list.findIndex((o) => o.id === opp.id);
    if (idx >= 0) {
      list[idx] = opp;
    } else {
      list.push(opp);
    }
    storage.save('opportunities', list);
  },

  deleteOpportunity(oppId: string): void {
    const list = this.getOpportunities().filter((o) => o.id !== oppId);
    storage.save('opportunities', list);
  },

  // Applications
  getApplications(): Application[] {
    return getItem<Application[]>('applications', []);
  },

  getUserApplications(userId: string): Application[] {
    return this.getApplications().filter((a) => a.userId === userId);
  },

  saveApplication(app: Application): void {
    const list = this.getApplications();
    const idx = list.findIndex((a) => a.id === app.id);
    if (idx >= 0) {
      list[idx] = app;
    } else {
      list.unshift(app);
    }
    // Trim to capacity limit
    const trimmed = list.slice(0, STORAGE_CAPS.MAX_APPLICATIONS);
    storage.save('applications', trimmed);
  },

  updateApplicationStatus(id: string, status: Application['status']): void {
    const list = this.getApplications();
    const item = list.find((a) => a.id === id);
    if (item) {
      item.status = status;
      storage.save('applications', list);
    }
  },

  // Mentors & Mentorships
  getMentors(): Mentor[] {
    return getItem<Mentor[]>('mentors', SEED_MENTORS);
  },

  toggleMentorVerification(mentorId: string): void {
    const mentors = this.getMentors();
    const m = mentors.find((item) => item.id === mentorId);
    if (m) {
      m.isVerified = !m.isVerified;
      if (m.isVerified) {
        m.verifiedDate = new Date().toISOString().split('T')[0];
      }
      storage.save('mentors', mentors);
    }
  },

  getMentorships(): Mentorship[] {
    return getItem<Mentorship[]>('mentorships', SEED_MENTORSHIPS);
  },

  getLearnerMentorships(learnerId: string): Mentorship[] {
    return this.getMentorships().filter((m) => m.learnerId === learnerId);
  },

  getMentorMentorships(mentorUserId: string): Mentorship[] {
    return this.getMentorships().filter((m) => m.mentorUserId === mentorUserId);
  },

  saveMentorship(mentorship: Mentorship): void {
    const list = this.getMentorships();
    const idx = list.findIndex((m) => m.id === mentorship.id);
    if (idx >= 0) {
      list[idx] = mentorship;
    } else {
      list.unshift(mentorship);
    }
    storage.save('mentorships', list);
  },

  // Direct Messages (Optimized with per-thread bounds)
  getMessages(mentorshipId: string): DirectMessage[] {
    const all = getItem<DirectMessage[]>('messages', SEED_DIRECT_MESSAGES);
    return all.filter((m) => m.mentorshipId === mentorshipId);
  },

  sendMessage(msg: DirectMessage): void {
    const all = getItem<DirectMessage[]>('messages', SEED_DIRECT_MESSAGES);
    all.push(msg);
    const trimmed = StorageMappers.trimMessages(all, STORAGE_CAPS.MAX_MESSAGES_PER_CONVERSATION);
    storage.save('messages', trimmed);
  },

  // Chatbot History (Optimized with per-user bounds)
  getChatHistory(userId: string): ChatMessage[] {
    const all = getItem<ChatMessage[]>('chatHistory', []);
    return all.filter((m) => m.userId === userId);
  },

  saveChatMessage(msg: ChatMessage): void {
    const all = getItem<ChatMessage[]>('chatHistory', []);
    all.push(msg);
    const trimmed = StorageMappers.trimChatHistory(all, STORAGE_CAPS.MAX_CHAT_HISTORY_PER_USER);
    // Debounce chat writes to avoid main-thread stutter during streaming
    storage.saveDebounced('chatHistory', trimmed);
  },

  clearChatHistory(userId: string): void {
    const all = getItem<ChatMessage[]>('chatHistory', []);
    const filtered = all.filter((m) => m.userId !== userId);
    storage.save('chatHistory', filtered);
  },

  // Quizzes (Optimized with Question Normalization & Capacity Cap)
  getQuizzes(userId: string): QuizRecord[] {
    const all = storage.load<CompactQuiz[]>('quizzes') || [];
    const userQuizzes = all.filter((q) => q.uId === userId);
    const questionCache = getQuestionCache();

    return userQuizzes.map((compact) =>
      StorageMappers.quizFromStorage(compact, questionCache)
    );
  },

  saveQuiz(quiz: QuizRecord): void {
    const all = storage.load<CompactQuiz[]>('quizzes') || [];
    const questionCache = getQuestionCache();

    const compact = StorageMappers.quizToStorage(quiz, questionCache);
    saveQuestionCache(questionCache);

    all.unshift(compact);
    const trimmed = StorageMappers.trimQuizzes(all, STORAGE_CAPS.MAX_QUIZZES_PER_USER);
    storage.save('quizzes', trimmed);
  },

  // Organization Employees (Admin Analytics)
  getOrgEmployees(): OrgEmployee[] {
    return getItem<OrgEmployee[]>('orgEmployees', generateSeedOrgEmployees());
  },
};
