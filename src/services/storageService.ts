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

const PREFIX = 'statskillai:';

function getKey(collection: string): string {
  return `${PREFIX}${collection}`;
}

export function getItem<T>(collection: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(getKey(collection));
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to read collection ${collection}:`, err);
    return defaultValue;
  }
}

export function setItem<T>(collection: string, value: T): void {
  try {
    localStorage.setItem(getKey(collection), JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save collection ${collection}:`, err);
  }
}

export const StorageService = {
  // Initialization & Reset
  initStorage(forceReset = false): void {
    const isInitialized = localStorage.getItem(`${PREFIX}initialized`);
    if (isInitialized && !forceReset) {
      return;
    }

    // Seed default datasets
    setItem<User[]>('users', SEED_USERS);
    setItem<Course[]>('courses', SEED_COURSES);
    setItem<Opportunity[]>('opportunities', SEED_OPPORTUNITIES);
    setItem<any[]>('organisations', SEED_ORGANISATIONS);
    setItem<Mentor[]>('mentors', SEED_MENTORS);
    setItem<Record<string, LearnerProfile>>('profiles', SEED_PROFILES);
    setItem<Record<string, AssessmentAttempt[]>>('assessmentAttempts', SEED_INITIAL_ATTEMPTS);
    setItem<Record<string, GapAnalysis>>('gapAnalyses', SEED_INITIAL_GAPS);
    setItem<Record<string, LearningPath>>('learningPaths', SEED_INITIAL_LEARNING_PATH);
    setItem<Mentorship[]>('mentorships', SEED_MENTORSHIPS);
    setItem<DirectMessage[]>('messages', SEED_DIRECT_MESSAGES);
    setItem<OrgEmployee[]>('orgEmployees', generateSeedOrgEmployees());
    setItem<Application[]>('applications', [
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
    setItem<QuizRecord[]>('quizzes', []);
    setItem<ChatMessage[]>('chatHistory', [
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
    setItem<AppSettings>('settings', defaultSettings);

    localStorage.setItem(`${PREFIX}initialized`, 'true');
    console.log('StatSkillAI localStorage seeded successfully.');
  },

  resetAllData(): void {
    // Clear only StatSkillAI keys
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(PREFIX)) {
        localStorage.removeItem(k);
      }
    });
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
    setItem('settings', updated);
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
    // calculate completeness
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
    setItem('profiles', profiles);
  },

  // Assessment Attempts
  getAttempts(userId: string): AssessmentAttempt[] {
    const all = getItem<Record<string, AssessmentAttempt[]>>('assessmentAttempts', {});
    return all[userId] || [];
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
    const all = getItem<Record<string, AssessmentAttempt[]>>('assessmentAttempts', {});
    const userAttempts = all[attempt.userId] || [];
    userAttempts.unshift(attempt);
    all[attempt.userId] = userAttempts;
    setItem('assessmentAttempts', all);
  },

  // Gap Analysis
  getGapAnalysis(userId: string): GapAnalysis | null {
    const all = getItem<Record<string, GapAnalysis>>('gapAnalyses', {});
    return all[userId] || null;
  },

  saveGapAnalysis(analysis: GapAnalysis): void {
    const all = getItem<Record<string, GapAnalysis>>('gapAnalyses', {});
    all[analysis.userId] = analysis;
    setItem('gapAnalyses', all);
  },

  // Learning Paths
  getLearningPath(userId: string): LearningPath | null {
    const all = getItem<Record<string, LearningPath>>('learningPaths', {});
    return all[userId] || null;
  },

  saveLearningPath(path: LearningPath): void {
    const all = getItem<Record<string, LearningPath>>('learningPaths', {});
    // calculate progressPercent
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
    setItem('learningPaths', all);
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
    setItem('courses', list);
  },

  deleteCourse(courseId: string): void {
    const list = this.getCourses().filter((c) => c.id !== courseId);
    setItem('courses', list);
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
    setItem('opportunities', list);
  },

  deleteOpportunity(oppId: string): void {
    const list = this.getOpportunities().filter((o) => o.id !== oppId);
    setItem('opportunities', list);
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
    setItem('applications', list);
  },

  updateApplicationStatus(id: string, status: Application['status']): void {
    const list = this.getApplications();
    const item = list.find((a) => a.id === id);
    if (item) {
      item.status = status;
      setItem('applications', list);
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
      setItem('mentors', mentors);
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
    setItem('mentorships', list);
  },

  // Direct Messages
  getMessages(mentorshipId: string): DirectMessage[] {
    const all = getItem<DirectMessage[]>('messages', SEED_DIRECT_MESSAGES);
    return all.filter((m) => m.mentorshipId === mentorshipId);
  },

  sendMessage(msg: DirectMessage): void {
    const all = getItem<DirectMessage[]>('messages', SEED_DIRECT_MESSAGES);
    all.push(msg);
    setItem('messages', all);
  },

  // Chatbot History
  getChatHistory(userId: string): ChatMessage[] {
    const all = getItem<ChatMessage[]>('chatHistory', []);
    return all.filter((m) => m.userId === userId);
  },

  saveChatMessage(msg: ChatMessage): void {
    const all = getItem<ChatMessage[]>('chatHistory', []);
    all.push(msg);
    setItem('chatHistory', all);
  },

  clearChatHistory(userId: string): void {
    const all = getItem<ChatMessage[]>('chatHistory', []);
    const filtered = all.filter((m) => m.userId !== userId);
    setItem('chatHistory', filtered);
  },

  // Quizzes
  getQuizzes(userId: string): QuizRecord[] {
    const all = getItem<QuizRecord[]>('quizzes', []);
    return all.filter((q) => q.userId === userId);
  },

  saveQuiz(quiz: QuizRecord): void {
    const all = getItem<QuizRecord[]>('quizzes', []);
    all.unshift(quiz);
    setItem('quizzes', all);
  },

  // Organization Employees (Admin Analytics)
  getOrgEmployees(): OrgEmployee[] {
    return getItem<OrgEmployee[]>('orgEmployees', generateSeedOrgEmployees());
  },
};
