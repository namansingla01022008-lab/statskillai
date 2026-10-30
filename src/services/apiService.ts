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
} from '../types';

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
};
