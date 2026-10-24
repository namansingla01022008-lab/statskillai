export type Role = 'learner' | 'mentor' | 'admin';

export type ProfileType = 'Student' | 'Government Employee' | 'Private-Sector Professional';

export type DomainType = 'Technical' | 'Statistical' | 'Digital' | 'Behavioural';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type StepStatus = 'Not started' | 'In progress' | 'Completed';

export type OpportunityType = 'Job' | 'Internship' | 'Apprenticeship' | 'Training Programme';

export type ApplicationStatus = 'Submitted' | 'Under review' | 'Shortlisted' | 'Closed';

export type MentorshipStatus = 'Pending' | 'Accepted' | 'Declined' | 'Completed';

export type GapSeverity = 'High' | 'Medium' | 'Low';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  profileType?: ProfileType;
  department?: string;
  designation?: string;
  avatar?: string;
}

export interface PreviousTraining {
  id: string;
  title: string;
  provider: string;
  year: string;
  certificateId?: string;
}

export interface LearnerProfile {
  userId: string;
  fullName: string;
  profileType: ProfileType;
  highestEducation: string;
  qualifications: string;
  currentRoleOrCourse: string;
  yearsOfExperience: number;
  organisationOrInstitution: string;
  skills: string[];
  interests: string[];
  previousTrainings: PreviousTraining[];
  careerGoal: string;
  targetDomainScores: Record<DomainType, number>;
  completeness: number; // 0 - 100%
  updatedAt: string;
}

export interface QuestionRecord {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: DifficultyLevel;
  skillTag: string;
  domain?: DomainType;
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  domain: DomainType;
  date: string;
  questions: QuestionRecord[];
  userAnswers: number[];
  score: number;
  earnedWeight: number;
  maxWeight: number;
  previousScore?: number;
  completed: boolean;
}

export interface SkillGapItem {
  domain: DomainType;
  skill: string;
  severity: GapSeverity;
  reason: string;
}

export interface GapAnalysis {
  id: string;
  userId: string;
  timestamp: string;
  strengths: string[];
  gaps: SkillGapItem[];
  summary: string;
  priorityOrder: string[];
  domainScores: Record<DomainType, number>;
  targetScores: Record<DomainType, number>;
  overallScore: number;
}

export interface Course {
  id: string;
  title: string;
  domain: DomainType;
  provider: string;
  source: 'SWAYAM' | 'NPTEL' | 'iGOT Karmayogi' | 'NCS' | 'Company Training';
  duration: string;
  level: ProficiencyLevel;
  description: string;
  portalUrl: string;
  skillsCovered: string[];
}

export interface LearningStep {
  id: string;
  title: string;
  domain: DomainType;
  type: 'Course' | 'Training Programme' | 'Reading' | 'Practice';
  estimatedDuration: string;
  source: string;
  rationale: string;
  status: StepStatus;
  isAiSuggested?: boolean;
  isMentorRecommended?: boolean;
  courseId?: string;
}

export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  careerGoal: string;
  steps: LearningStep[];
  createdAt: string;
  updatedAt: string;
  progressPercent: number;
  isCompleted: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  organisation: string;
  orgId: string;
  sector: string;
  location: string;
  type: OpportunityType;
  requiredSkills: string[];
  minDomainLevels: Record<DomainType, number>;
  description: string;
  deadline: string;
  stipendOrSalary?: string;
}

export interface Application {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  organisation: string;
  userId: string;
  userName: string;
  userEmail: string;
  appliedAt: string;
  status: ApplicationStatus;
  matchPercentage: number;
  notes?: string;
}

export interface Mentor {
  id: string;
  userId: string;
  name: string;
  title: string;
  organisation: string;
  field: string;
  experienceYears: number;
  languages: string[];
  bio: string;
  isVerified: boolean;
  verifiedDate: string;
  availability: string;
  rating: number;
  totalReviews: number;
}

export interface Mentorship {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorUserId: string;
  learnerId: string;
  learnerName: string;
  learnerProfileType: ProfileType;
  goalMessage: string;
  status: MentorshipStatus;
  requestedAt: string;
  meetingSchedule?: string;
  feedbackNotes?: string[];
  recommendedSteps?: LearningStep[];
  rating?: number;
  ratingComment?: string;
}

export interface DirectMessage {
  id: string;
  mentorshipId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface QuizRecord {
  id: string;
  userId: string;
  title: string;
  sourceType: 'pdf' | 'text';
  sourceSnippet: string;
  timestamp: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  questions: QuestionRecord[];
  userAnswers: number[];
  score: number;
  totalQuestions: number;
}

export interface OrgEmployee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  profileType: ProfileType;
  scores: Record<DomainType, number>;
  participationStatus: 'Active' | 'Pending' | 'Exempt';
  trainingStatus: 'Completed' | 'In progress' | 'Not started';
  criticalGapsCount: number;
  lastAssessmentDate: string;
}

export interface AdminAnalyticsInsight {
  timestamp: string;
  keyFindings: string[];
  criticalRisks: string[];
  recommendedActions: string[];
  executiveSummary: string;
}

export interface AppSettings {
  language: 'en' | 'hi';
  highContrast: boolean;
  fontSize: 'small' | 'default' | 'large';
  activeUserId: string;
}
