import { io, Socket } from 'socket.io-client';
import {
  User,
  LearnerProfile,
  Course,
  Opportunity,
  Application,
  Mentor,
  Mentorship,
  DirectMessage,
  QuizRecord,
  AssessmentAttempt,
  GapAnalysis,
  LearningPath,
  DomainType,
  StepStatus,
  ApplicationStatus,
  RewardBalance,
  RewardTransaction,
  Certificate,
  Reward,
  Redemption,
  Badge,
  RewardRule,
  LeaderboardEntry,
  RewardAuditLog,
  LearnerStreak,
  MentorshipSessionBooking,
  MentorshipFeedbackRecord,
  MentorAvailabilitySlot,
} from '../types';
import { StorageService } from './storageService';

const TOKEN_KEY = 'statskill_jwt_token';

// Backend API base URL — uses env var at build time, falls back to Render deployment.
// Automatically strips any trailing slashes or duplicate '/api' to prevent '/api/api' 404 bugs.
const RAW_URL = (import.meta.env.VITE_API_BASE_URL || 'https://statskillai-1ffb.onrender.com').trim();
export const API_BASE_URL = RAW_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');

let socketInstance: Socket | null = null;

export const ApiService = {
  // Token handling
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    this.reconnectSocket();
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
  },

  // Generic fetch wrapper
  async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      let message = data?.error || `API request failed with status ${res.status}`;
      if (Array.isArray(data?.details) && data.details.length > 0) {
        message += ': ' + data.details.join(' ');
      }
      throw new Error(message);
    }

    return data as T;
  },

  // Socket.io connection
  getSocket(): Socket {
    if (!socketInstance) {
      const token = this.getToken();
      socketInstance = io(API_BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
    }
    return socketInstance;
  },

  reconnectSocket() {
    if (socketInstance) {
      socketInstance.disconnect();
    }
    const token = this.getToken();
    socketInstance = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  },

  // 1. Auth APIs
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await this.fetchApi<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return { user: data.user, token: data.token };
  },

  async register(params: any): Promise<{ user: User; token: string }> {
    const data = await this.fetchApi<{ success: boolean; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    this.setToken(data.token);
    return { user: data.user, token: data.token };
  },

  async demoSwitch(userId: string): Promise<{ user: User; token: string }> {
    const data = await this.fetchApi<{ success: boolean; token: string; user: User }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    this.setToken(data.token);
    return { user: data.user, token: data.token };
  },

  async getMe(): Promise<{ user: User; profile: LearnerProfile | null }> {
    const data = await this.fetchApi<{ success: boolean; user: User; profile: LearnerProfile | null }>('/api/auth/me');
    return { user: data.user, profile: data.profile };
  },

  async logout(): Promise<void> {
    try {
      await this.fetchApi('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  },

  // 2. Profile APIs
  async getProfile(): Promise<LearnerProfile | null> {
    const data = await this.fetchApi<{ success: boolean; profile: LearnerProfile }>('/api/profile');
    return data.profile || null;
  },

  async updateProfile(profile: Partial<LearnerProfile>): Promise<LearnerProfile> {
    const data = await this.fetchApi<{ success: boolean; profile: LearnerProfile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
    return data.profile;
  },

  async getDomainScores(): Promise<Record<DomainType, number>> {
    const data = await this.fetchApi<{ success: boolean; scores: Record<DomainType, number> }>('/api/profile/scores');
    return data.scores;
  },

  // 3. Assessment APIs
  async getAttempts(domain?: DomainType): Promise<AssessmentAttempt[]> {
    const url = domain ? `/api/assessments/attempts?domain=${domain}` : '/api/assessments/attempts';
    const data = await this.fetchApi<{ success: boolean; attempts: AssessmentAttempt[] }>(url);
    return data.attempts;
  },

  async submitAttempt(attempt: Partial<AssessmentAttempt>): Promise<AssessmentAttempt> {
    const data = await this.fetchApi<{ success: boolean; attempt: AssessmentAttempt }>('/api/assessments/submit', {
      method: 'POST',
      body: JSON.stringify(attempt),
    });
    return data.attempt;
  },

  // 4. Gap Analysis APIs
  async getGapAnalysis(): Promise<GapAnalysis | null> {
    const data = await this.fetchApi<{ success: boolean; analysis: GapAnalysis | null }>('/api/gaps');
    return data.analysis;
  },

  async saveGapAnalysis(analysis: Partial<GapAnalysis>): Promise<GapAnalysis> {
    const data = await this.fetchApi<{ success: boolean; analysis: GapAnalysis }>('/api/gaps/save', {
      method: 'POST',
      body: JSON.stringify(analysis),
    });
    return data.analysis;
  },

  // 5. Learning Path APIs
  async getLearningPath(): Promise<LearningPath | null> {
    const data = await this.fetchApi<{ success: boolean; learningPath: LearningPath | null }>('/api/paths');
    return data.learningPath;
  },

  async saveLearningPath(path: Partial<LearningPath>): Promise<LearningPath> {
    const data = await this.fetchApi<{ success: boolean; learningPath: LearningPath }>('/api/paths/save', {
      method: 'POST',
      body: JSON.stringify(path),
    });
    return data.learningPath;
  },

  async updateStepStatus(stepId: string, status: StepStatus): Promise<LearningPath> {
    const data = await this.fetchApi<{ success: boolean; learningPath: LearningPath }>('/api/paths/step-status', {
      method: 'PATCH',
      body: JSON.stringify({ stepId, status }),
    });
    return data.learningPath;
  },

  // 6. Course APIs
  async getCourses(): Promise<Course[]> {
    const data = await this.fetchApi<{ success: boolean; courses: Course[] }>('/api/courses');
    return data.courses;
  },

  async createCourse(course: Partial<Course>): Promise<Course> {
    const data = await this.fetchApi<{ success: boolean; course: Course }>('/api/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    });
    return data.course;
  },

  async deleteCourse(id: string): Promise<void> {
    await this.fetchApi(`/api/courses/${id}`, { method: 'DELETE' });
  },

  // 7. Opportunity & Application APIs
  async getOpportunities(): Promise<Opportunity[]> {
    const data = await this.fetchApi<{ success: boolean; opportunities: Opportunity[] }>('/api/opportunities');
    return data.opportunities;
  },

  async createOpportunity(opp: Partial<Opportunity>): Promise<Opportunity> {
    const data = await this.fetchApi<{ success: boolean; opportunity: Opportunity }>('/api/opportunities', {
      method: 'POST',
      body: JSON.stringify(opp),
    });
    return data.opportunity;
  },

  async deleteOpportunity(id: string): Promise<void> {
    await this.fetchApi(`/api/opportunities/${id}`, { method: 'DELETE' });
  },

  async applyToOpportunity(opportunityId: string, matchPercentage: number, notes?: string): Promise<Application> {
    const data = await this.fetchApi<{ success: boolean; application: Application }>(`/api/opportunities/${opportunityId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ matchPercentage, notes }),
    });
    return data.application;
  },

  async getMyApplications(): Promise<Application[]> {
    const data = await this.fetchApi<{ success: boolean; applications: Application[] }>('/api/opportunities/my-applications');
    return data.applications;
  },

  async getAllApplications(): Promise<Application[]> {
    const data = await this.fetchApi<{ success: boolean; applications: Application[] }>('/api/opportunities/admin/all-applications');
    return data.applications;
  },

  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<Application> {
    const data = await this.fetchApi<{ success: boolean; application: Application }>(`/api/opportunities/admin/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return data.application;
  },

  // 8. Mentorship & Direct Messaging APIs
  async getMentors(): Promise<Mentor[]> {
    const data = await this.fetchApi<{ success: boolean; mentors: Mentor[] }>('/api/mentorship/mentors');
    return data.mentors;
  },

  async toggleVerifyMentor(id: string): Promise<Mentor> {
    const data = await this.fetchApi<{ success: boolean; mentor: Mentor }>(`/api/mentorship/mentors/${id}/verify`, {
      method: 'PATCH',
    });
    return data.mentor;
  },

  async getMyMentorships(): Promise<Mentorship[]> {
    const data = await this.fetchApi<{ success: boolean; mentorships: Mentorship[] }>('/api/mentorship/my-mentorships');
    return data.mentorships;
  },

  async getAssignedMentees(): Promise<Mentorship[]> {
    const data = await this.fetchApi<{ success: boolean; mentorships: Mentorship[] }>('/api/mentorship/assigned-mentees');
    return data.mentorships;
  },

  async requestMentorship(mentorId: string, goalMessage: string): Promise<Mentorship> {
    const data = await this.fetchApi<{ success: boolean; mentorship: Mentorship }>('/api/mentorship/request', {
      method: 'POST',
      body: JSON.stringify({ mentorId, goalMessage }),
    });
    return data.mentorship;
  },

  async updateMentorshipStatus(id: string, status: string, meetingSchedule?: string): Promise<Mentorship> {
    const data = await this.fetchApi<{ success: boolean; mentorship: Mentorship }>(`/api/mentorship/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, meetingSchedule }),
    });
    return data.mentorship;
  },

  async addDirective(id: string, note: string): Promise<Mentorship> {
    const data = await this.fetchApi<{ success: boolean; mentorship: Mentorship }>(`/api/mentorship/${id}/directive`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
    return data.mentorship;
  },

  async getMessages(mentorshipId: string): Promise<DirectMessage[]> {
    const data = await this.fetchApi<{ success: boolean; messages: DirectMessage[] }>(`/api/mentorship/${mentorshipId}/messages`);
    return data.messages;
  },

  async sendMessage(mentorshipId: string, text: string): Promise<DirectMessage> {
    const data = await this.fetchApi<{ success: boolean; message: DirectMessage }>(`/api/mentorship/${mentorshipId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return data.message;
  },

  // Live Mentorship Session APIs
  async bookMentorshipSession(bookingData: {
    mentorId: string;
    mentorName: string;
    mentorTitle?: string;
    skillDomain: string;
    topic: string;
    date: string;
    timeSlot: string;
    price?: number;
    studentId?: string;
    studentName?: string;
  }): Promise<MentorshipSessionBooking> {
    try {
      const data = await this.fetchApi<{ success: boolean; booking: MentorshipSessionBooking }>(
        '/api/mentorship/book-session',
        {
          method: 'POST',
          body: JSON.stringify(bookingData),
        }
      );
      if (data?.booking) {
        StorageService.saveSessionBooking(data.booking);
        return data.booking;
      }
    } catch (err) {
      console.warn('Backend bookMentorshipSession fallback to StorageService:', err);
    }

    const sessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const meetingId = `LIVE-${bookingData.skillDomain?.toUpperCase().slice(0, 4) || 'SKILL'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const localBooking: MentorshipSessionBooking = {
      id: `booking-${Date.now()}`,
      sessionId,
      meetingId,
      studentId: bookingData.studentId || 'user-learner-student',
      studentName: bookingData.studentName || 'Aarav Sharma',
      mentorId: bookingData.mentorId,
      mentorName: bookingData.mentorName,
      mentorTitle: bookingData.mentorTitle || 'Verified Mentor Specialist',
      skillDomain: (bookingData.skillDomain as any) || 'Technical',
      topic: bookingData.topic,
      date: bookingData.date,
      timeSlot: bookingData.timeSlot,
      durationMinutes: 5,
      price: bookingData.price || 10,
      paymentStatus: 'Successful',
      sessionStatus: 'Upcoming',
      createdAt: new Date().toISOString(),
    };
    StorageService.saveSessionBooking(localBooking);
    return localBooking;
  },

  async getSessionBooking(sessionId: string): Promise<MentorshipSessionBooking | null> {
    try {
      const data = await this.fetchApi<{ success: boolean; booking: MentorshipSessionBooking }>(
        `/api/mentorship/sessions/${sessionId}`
      );
      if (data?.booking) return data.booking;
    } catch {}
    return StorageService.getSessionBooking(sessionId);
  },

  async getMySessionBookings(userId?: string): Promise<MentorshipSessionBooking[]> {
    try {
      const data = await this.fetchApi<{ success: boolean; bookings: MentorshipSessionBooking[] }>(
        '/api/mentorship/my-sessions'
      );
      if (data?.bookings) return data.bookings;
    } catch {}
    return StorageService.getSessionBookings().filter(
      (b) => !userId || b.studentId === userId || b.mentorId === userId
    );
  },

  async completeLiveSession(
    sessionId: string,
    feedbackData: {
      studentUnderstanding: string;
      strengths: string[];
      weaknesses: string[];
      recommendedTopics: string[];
      nextTasks: string[];
      personalMessage: string;
      domain?: string;
      userId?: string;
    }
  ): Promise<{ booking: MentorshipSessionBooking; feedback: MentorshipFeedbackRecord }> {
    try {
      const data = await this.fetchApi<{
        success: boolean;
        booking: MentorshipSessionBooking;
        feedback: MentorshipFeedbackRecord;
      }>(`/api/mentorship/sessions/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify(feedbackData),
      });
      if (data?.booking && data?.feedback) {
        StorageService.updateSessionBookingStatus(sessionId, 'Completed');
        StorageService.saveSessionFeedback(data.feedback);
        return { booking: data.booking, feedback: data.feedback };
      }
    } catch (err) {
      console.warn('Backend completeLiveSession fallback to StorageService:', err);
    }

    StorageService.updateSessionBookingStatus(sessionId, 'Completed');
    const existing = StorageService.getSessionBooking(sessionId);
    const domain = (existing?.skillDomain || feedbackData.domain || 'Technical') as any;
    const studentId = existing?.studentId || feedbackData.userId || 'user-learner-student';

    // Apply logical skill boost
    const { previousScore, updatedScore } = StorageService.applyMentorshipSkillBoost(studentId, domain, 5);

    const feedback: MentorshipFeedbackRecord = {
      id: `fb-${Date.now()}`,
      bookingId: existing?.id || `booking-${sessionId}`,
      sessionId,
      mentorId: existing?.mentorId || 'mentor-rahul',
      studentId,
      studentUnderstanding: feedbackData.studentUnderstanding,
      strengths: feedbackData.strengths,
      weaknesses: feedbackData.weaknesses,
      recommendedTopics: feedbackData.recommendedTopics,
      nextTasks: feedbackData.nextTasks,
      personalMessage: feedbackData.personalMessage,
      skillBoostPoints: 5,
      skillBoostDomain: domain,
      previousScore,
      updatedScore,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveSessionFeedback(feedback);

    const updatedBooking = StorageService.getSessionBooking(sessionId)!;
    return { booking: updatedBooking, feedback };
  },

  async submitSessionReview(
    sessionId: string,
    ratingData: { rating: number; review?: string; isHelpful?: boolean; mentorId?: string }
  ): Promise<void> {
    try {
      await this.fetchApi(`/api/mentorship/sessions/${sessionId}/review`, {
        method: 'POST',
        body: JSON.stringify(ratingData),
      });
    } catch {}

    const fb = StorageService.getSessionFeedback(sessionId);
    if (fb) {
      fb.rating = ratingData.rating;
      fb.review = ratingData.review;
      fb.isHelpful = ratingData.isHelpful;
      StorageService.saveSessionFeedback(fb);
    }

    const booking = StorageService.getSessionBooking(sessionId);
    const mId = ratingData.mentorId || booking?.mentorId;
    if (mId) {
      StorageService.saveMentorReview(mId, ratingData.rating, ratingData.review);
    }
  },

  async updateMentorAvailabilitySlots(mentorId: string, slots: MentorAvailabilitySlot[]): Promise<void> {
    StorageService.updateMentorAvailability(mentorId, slots);
  },

  // 9. Analytics APIs
  async getWorkforceAnalytics(): Promise<{ employees: any[]; kpis: any }> {
    const data = await this.fetchApi<{ success: boolean; employees: any[]; kpis: any }>('/api/analytics/workforce');
    return { employees: data.employees, kpis: data.kpis };
  },

  // 10. Quiz APIs
  async getQuizzes(): Promise<QuizRecord[]> {
    const data = await this.fetchApi<{ success: boolean; quizzes: QuizRecord[] }>('/api/quizzes');
    return data.quizzes;
  },

  async saveQuiz(quiz: Partial<QuizRecord>): Promise<QuizRecord> {
    const data = await this.fetchApi<{ success: boolean; quiz: QuizRecord }>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(quiz),
    });
    return data.quiz;
  },

  // 11. Offline Sync & Preloaded Questions APIs
  async pingHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = `${API_BASE_URL}/api/health`;
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  async getOfflineQuestions(): Promise<any[]> {
    const data = await this.fetchApi<{ success: boolean; questions: any[] }>('/api/offline/questions');
    return data.questions;
  },

  async syncOfflineMutations(mutations: any[]): Promise<{ success: boolean; processed: any[] }> {
    return await this.fetchApi<{ success: boolean; processed: any[] }>('/api/offline/sync', {
      method: 'POST',
      body: JSON.stringify({ mutations }),
    });
  },

  // 11. Gamified Reward APIs (Learner)
  async getRewardBalance(): Promise<RewardBalance> {
    const data = await this.fetchApi<{ success: boolean; balance: number; totalEarned: number; totalRedeemed: number }>('/api/rewards/balance');
    return {
      balance: data.balance,
      totalEarned: data.totalEarned,
      totalRedeemed: data.totalRedeemed,
    };
  },

  async getRewardHistory(page = 1, limit = 20): Promise<{ transactions: RewardTransaction[]; pagination: any }> {
    const data = await this.fetchApi<{ success: boolean; transactions: RewardTransaction[]; pagination: any }>(
      `/api/rewards/history?page=${page}&limit=${limit}`
    );
    return { transactions: data.transactions, pagination: data.pagination };
  },

  async getRewardStore(): Promise<Reward[]> {
    const data = await this.fetchApi<{ success: boolean; rewards: Reward[] }>('/api/rewards/store');
    return data.rewards;
  },

  async redeemReward(rewardId: string, idempotencyKey?: string): Promise<{ success: boolean; redemption: Redemption; message: string }> {
    return this.fetchApi<{ success: boolean; redemption: Redemption; message: string }>('/api/rewards/redeem', {
      method: 'POST',
      body: JSON.stringify({ rewardId, idempotencyKey }),
    });
  },

  async getMyRedemptions(): Promise<Redemption[]> {
    const data = await this.fetchApi<{ success: boolean; redemptions: Redemption[] }>('/api/rewards/redemptions');
    return data.redemptions;
  },

  async getBadges(): Promise<{ badges: Badge[]; earnedCount: number; totalCount: number }> {
    const data = await this.fetchApi<{ success: boolean; badges: Badge[]; earnedCount: number; totalCount: number }>('/api/rewards/badges');
    return { badges: data.badges, earnedCount: data.earnedCount, totalCount: data.totalCount };
  },

  async getStreak(): Promise<LearnerStreak> {
    const data = await this.fetchApi<{
      success: boolean;
      currentStreak: number;
      longestStreak: number;
      totalActiveDays: number;
      lastActivityDate: string | null;
    }>('/api/rewards/streak');
    return {
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      totalActiveDays: data.totalActiveDays,
      lastActivityDate: data.lastActivityDate,
    };
  },

  async getLeaderboard(period = 'alltime', limit = 10): Promise<{ period: string; leaderboard: LeaderboardEntry[] }> {
    const data = await this.fetchApi<{ success: boolean; period: string; leaderboard: LeaderboardEntry[] }>(
      `/api/rewards/leaderboard?period=${period}&limit=${limit}`
    );
    return { period: data.period, leaderboard: data.leaderboard };
  },

  // 12. Certificate APIs (Learner)
  async submitCertificate(params: {
    courseName: string;
    provider: string;
    certId: string;
    verificationUrl: string;
    fileKey?: string;
  }): Promise<{ success: boolean; certificate: Certificate; message: string }> {
    return this.fetchApi<{ success: boolean; certificate: Certificate; message: string }>('/api/certificates/submit', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getMyCertificates(): Promise<Certificate[]> {
    const data = await this.fetchApi<{ success: boolean; certificates: Certificate[] }>('/api/certificates/my');
    return data.certificates;
  },

  // 13. Admin Reward Management APIs
  async adminGetRewards(): Promise<Reward[]> {
    const data = await this.fetchApi<{ success: boolean; rewards: Reward[] }>('/api/admin/rewards');
    return data.rewards;
  },

  async adminCreateReward(reward: Partial<Reward>): Promise<Reward> {
    const data = await this.fetchApi<{ success: boolean; reward: Reward }>('/api/admin/rewards', {
      method: 'POST',
      body: JSON.stringify(reward),
    });
    return data.reward;
  },

  async adminUpdateReward(id: string, updates: Partial<Reward>): Promise<Reward> {
    const data = await this.fetchApi<{ success: boolean; reward: Reward }>(`/api/admin/rewards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.reward;
  },

  async adminDeleteReward(id: string): Promise<void> {
    await this.fetchApi(`/api/admin/rewards/${id}`, { method: 'DELETE' });
  },

  async adminGetCertificates(status?: string): Promise<Certificate[]> {
    const url = status ? `/api/admin/certificates?status=${status}` : '/api/admin/certificates';
    const data = await this.fetchApi<{ success: boolean; certificates: Certificate[] }>(url);
    return data.certificates;
  },

  async adminApproveCertificate(id: string, note?: string): Promise<{ success: boolean; certificate: Certificate; message: string }> {
    return this.fetchApi<{ success: boolean; certificate: Certificate; message: string }>(`/api/admin/certificates/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    });
  },

  async adminRejectCertificate(id: string, reason: string, note?: string): Promise<{ success: boolean; certificate: Certificate }> {
    return this.fetchApi<{ success: boolean; certificate: Certificate }>(`/api/admin/certificates/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason, note }),
    });
  },

  async adminGetTransactions(page = 1, limit = 25, userId?: string, type?: string): Promise<{ transactions: RewardTransaction[]; pagination: any }> {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (userId) query.append('userId', userId);
    if (type) query.append('type', type);

    const data = await this.fetchApi<{ success: boolean; transactions: RewardTransaction[]; pagination: any }>(
      `/api/admin/reward-transactions?${query.toString()}`
    );
    return { transactions: data.transactions, pagination: data.pagination };
  },

  async adminGetRedemptions(): Promise<Redemption[]> {
    const data = await this.fetchApi<{ success: boolean; redemptions: Redemption[] }>('/api/admin/redemptions');
    return data.redemptions;
  },

  async adminRefundRedemption(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/api/admin/redemptions/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async adminAdjustXP(targetUserId: string, amount: number, reason: string): Promise<{ success: boolean; newBalance: number; message: string }> {
    return this.fetchApi<{ success: boolean; newBalance: number; message: string }>('/api/admin/rewards/adjust', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, amount, reason }),
    });
  },

  async adminGetRewardRules(): Promise<RewardRule[]> {
    const data = await this.fetchApi<{ success: boolean; rules: RewardRule[] }>('/api/admin/reward-rules');
    return data.rules;
  },

  async adminUpdateRewardRule(id: string, updates: Partial<RewardRule>): Promise<RewardRule> {
    const data = await this.fetchApi<{ success: boolean; rule: RewardRule }>(`/api/admin/reward-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.rule;
  },

  async adminGetAuditLogs(limit = 30): Promise<RewardAuditLog[]> {
    const data = await this.fetchApi<{ success: boolean; logs: RewardAuditLog[] }>(`/api/admin/audit-log?limit=${limit}`);
    return data.logs;
  },
};
