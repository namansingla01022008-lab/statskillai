import {
  DomainType,
  DifficultyLevel,
  ProfileType,
  LearnerProfile,
  QuestionRecord,
  GapAnalysis,
  LearningPath,
  Course,
  AdminAnalyticsInsight,
} from '../types';
import { AIPrompts } from './aiPrompts';
import { FallbackService } from './aiFallbacks';
import { Type } from '@google/genai';

interface ApiGenerateResponse {
  success?: boolean;
  text?: string;
  error?: string;
  fallbackRequired?: boolean;
}

async function callServerGenerate(payload: {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
  inlineData?: { mimeType: string; data: string };
}): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`Server API responded with HTTP status ${res.status}`);
      return null;
    }

    const data: ApiGenerateResponse = await res.json();
    if (data.success && data.text) {
      return data.text;
    }
    return null;
  } catch (err) {
    console.warn('Network or proxy error contacting Gemini endpoint; activating local fallback.', err);
    return null;
  }
}

async function callServerChat(payload: {
  messages: Array<{ role: 'user' | 'assistant' | 'model'; content: string }>;
  systemInstruction?: string;
}): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;
    const data: ApiGenerateResponse = await res.json();
    if (data.success && data.text) return data.text;
    return null;
  } catch (err) {
    console.warn('Network error in Gemini chat endpoint; activating fallback.', err);
    return null;
  }
}

export const GeminiService = {
  // 1. Adaptive Assessment Question Generation
  async generateAdaptiveQuestion(
    domain: DomainType,
    targetDifficulty: DifficultyLevel,
    profileType: ProfileType,
    previousQuestions: string[],
    language: 'en' | 'hi'
  ): Promise<{ question: QuestionRecord; isAiGenerated: boolean }> {
    const { systemInstruction, prompt } = AIPrompts.getAdaptiveQuestionPrompt(
      domain,
      targetDifficulty,
      profileType,
      previousQuestions,
      language
    );

    const questionSchema = {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        correctIndex: { type: Type.INTEGER },
        explanation: { type: Type.STRING },
        difficulty: { type: Type.STRING },
        skillTag: { type: Type.STRING },
      },
      required: ['question', 'options', 'correctIndex', 'explanation', 'difficulty', 'skillTag'],
    };

    const text = await callServerGenerate({
      prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: questionSchema,
    });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (
          parsed.question &&
          Array.isArray(parsed.options) &&
          parsed.options.length === 4 &&
          typeof parsed.correctIndex === 'number'
        ) {
          return {
            question: {
              id: `gemini-q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              question: parsed.question,
              options: parsed.options,
              correctIndex: Math.max(0, Math.min(3, parsed.correctIndex)),
              explanation: parsed.explanation || 'Verified rationale based on competency frameworks.',
              difficulty: targetDifficulty,
              skillTag: parsed.skillTag || `${domain} Competency`,
              domain,
            },
            isAiGenerated: true,
          };
        }
      } catch (err) {
        console.warn('Failed parsing structured question JSON from Gemini, falling back.', err);
      }
    }

    // Graceful fallback
    const fallbackQ = FallbackService.getQuestion(domain, targetDifficulty, previousQuestions);
    return {
      question: { ...fallbackQ, domain },
      isAiGenerated: false,
    };
  },

  // 2. Skill-Gap Analysis
  async generateSkillGapAnalysis(
    profile: LearnerProfile,
    assessmentScores: Record<DomainType, number>,
    targetScores: Record<DomainType, number>,
    language: 'en' | 'hi'
  ): Promise<{ analysis: GapAnalysis; isAiGenerated: boolean }> {
    const { systemInstruction, prompt } = AIPrompts.getSkillGapAnalysisPrompt(
      profile,
      assessmentScores,
      targetScores,
      language
    );

    const gapSchema = {
      type: Type.OBJECT,
      properties: {
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        gaps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              domain: { type: Type.STRING },
              skill: { type: Type.STRING },
              severity: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ['domain', 'skill', 'severity', 'reason'],
          },
        },
        summary: { type: Type.STRING },
        priorityOrder: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['strengths', 'gaps', 'summary', 'priorityOrder'],
    };

    const text = await callServerGenerate({
      prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: gapSchema,
    });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.strengths) && Array.isArray(parsed.gaps)) {
          const overallScore = Math.round(
            (assessmentScores.Technical +
              assessmentScores.Statistical +
              assessmentScores.Digital +
              assessmentScores.Behavioural) /
              4
          );

          return {
            analysis: {
              id: `gap-gemini-${Date.now()}`,
              userId: profile.userId,
              timestamp: new Date().toISOString(),
              strengths: parsed.strengths,
              gaps: parsed.gaps.map((g: any) => ({
                domain: g.domain as DomainType,
                skill: g.skill,
                severity: (['High', 'Medium', 'Low'].includes(g.severity) ? g.severity : 'Medium') as any,
                reason: g.reason,
              })),
              summary: parsed.summary,
              priorityOrder: parsed.priorityOrder || [],
              domainScores: assessmentScores,
              targetScores,
              overallScore,
            },
            isAiGenerated: true,
          };
        }
      } catch (err) {
        console.warn('Failed parsing gap analysis JSON from Gemini, falling back.', err);
      }
    }

    // Graceful fallback
    const fallbackAnalysis = FallbackService.generateGapAnalysis(
      profile,
      assessmentScores,
      targetScores
    );
    return {
      analysis: fallbackAnalysis,
      isAiGenerated: false,
    };
  },

  // 3. Quiz & MCQ Generator from Document or Text
  async generateQuiz(
    materialText: string,
    questionCount: number,
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed',
    language: 'en' | 'hi',
    inlinePdfBase64?: string
  ): Promise<{ questions: QuestionRecord[]; isAiGenerated: boolean }> {
    const { systemInstruction, prompt } = AIPrompts.getQuizGenerationPrompt(
      materialText,
      questionCount,
      difficulty,
      language
    );

    const quizSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          skillTag: { type: Type.STRING },
        },
        required: ['question', 'options', 'correctIndex', 'explanation', 'difficulty', 'skillTag'],
      },
    };

    const payload: any = {
      prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: quizSchema,
    };

    if (inlinePdfBase64) {
      payload.inlineData = {
        mimeType: 'application/pdf',
        data: inlinePdfBase64,
      };
    }

    const text = await callServerGenerate(payload);

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const questions: QuestionRecord[] = parsed.map((item, idx) => ({
            id: `quiz-gemini-${idx + 1}-${Date.now()}`,
            question: item.question,
            options: item.options,
            correctIndex: Math.max(0, Math.min(3, item.correctIndex)),
            explanation: item.explanation,
            difficulty: (['Easy', 'Medium', 'Hard'].includes(item.difficulty)
              ? item.difficulty
              : 'Medium') as any,
            skillTag: item.skillTag || 'Document Excerpt Analysis',
          }));
          return { questions, isAiGenerated: true };
        }
      } catch (err) {
        console.warn('Failed parsing Quiz MCQs JSON, falling back.', err);
      }
    }

    // Graceful fallback
    const fallbackQuestions = FallbackService.generateQuizQuestions(
      materialText,
      questionCount,
      difficulty
    );
    return { questions: fallbackQuestions, isAiGenerated: false };
  },

  // 4. Personalised Learning Path
  async generateLearningPath(
    profile: LearnerProfile,
    gaps: GapAnalysis['gaps'],
    courses: Course[],
    language: 'en' | 'hi'
  ): Promise<{ learningPath: LearningPath; isAiGenerated: boolean }> {
    const { systemInstruction, prompt } = AIPrompts.getLearningPathPrompt(
      profile,
      gaps,
      courses,
      language
    );

    const pathSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              domain: { type: Type.STRING },
              type: { type: Type.STRING },
              estimatedDuration: { type: Type.STRING },
              source: { type: Type.STRING },
              rationale: { type: Type.STRING },
              isAiSuggested: { type: Type.BOOLEAN },
              courseId: { type: Type.STRING },
            },
            required: ['title', 'domain', 'type', 'estimatedDuration', 'source', 'rationale'],
          },
        },
      },
      required: ['title', 'steps'],
    };

    const text = await callServerGenerate({
      prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: pathSchema,
    });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.steps) && parsed.steps.length >= 4) {
          const steps = parsed.steps.map((st: any, idx: number) => ({
            id: `step-gen-${idx + 1}`,
            title: st.title,
            domain: (['Technical', 'Statistical', 'Digital', 'Behavioural'].includes(st.domain)
              ? st.domain
              : 'Statistical') as DomainType,
            type: (['Course', 'Training Programme', 'Reading', 'Practice'].includes(st.type)
              ? st.type
              : 'Course') as any,
            estimatedDuration: st.estimatedDuration || '4 Weeks',
            source: st.source || 'SWAYAM',
            rationale: st.rationale,
            status: idx === 0 ? 'In progress' : 'Not started',
            isAiSuggested: Boolean(st.isAiSuggested || st.source === 'AI-suggested'),
            courseId: st.courseId,
          }));

          return {
            learningPath: {
              id: `path-gemini-${Date.now()}`,
              userId: profile.userId,
              title: parsed.title || `Competency Advancement Pathway for ${profile.fullName}`,
              careerGoal: profile.careerGoal,
              steps,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              progressPercent: 0,
              isCompleted: false,
            },
            isAiGenerated: true,
          };
        }
      } catch (err) {
        console.warn('Failed parsing Learning Path JSON, falling back.', err);
      }
    }

    // Graceful fallback
    const fallbackPath = FallbackService.generateLearningPath(profile, gaps, courses);
    return { learningPath: fallbackPath, isAiGenerated: false };
  },

  // 5. AI Learning Assistant Chat
  async chatWithAssistant(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    learnerContext: {
      name: string;
      profileType: ProfileType;
      careerGoal: string;
      domainScores: Record<DomainType, number>;
      recentGaps: string[];
    },
    language: 'en' | 'hi'
  ): Promise<{ response: string; isAiGenerated: boolean }> {
    const systemInstruction = AIPrompts.getChatbotPrompt(learnerContext, language);

    const text = await callServerChat({
      messages: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        content: m.content,
      })),
      systemInstruction,
    });

    if (text) {
      return { response: text, isAiGenerated: true };
    }

    // Graceful fallback
    const latestUserMsg = messages[messages.length - 1]?.content || '';
    const fallbackReply = FallbackService.getChatResponse(latestUserMsg, language);
    return { response: fallbackReply, isAiGenerated: false };
  },

  // 6. Admin Workforce Analytics Insights
  async generateAdminInsights(
    aggregateStats: any,
    language: 'en' | 'hi'
  ): Promise<{ insights: AdminAnalyticsInsight; isAiGenerated: boolean }> {
    const { systemInstruction, prompt } = AIPrompts.getAdminInsightsPrompt(
      aggregateStats,
      language
    );

    const insightSchema = {
      type: Type.OBJECT,
      properties: {
        executiveSummary: { type: Type.STRING },
        keyFindings: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        criticalRisks: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        recommendedActions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ['executiveSummary', 'keyFindings', 'criticalRisks', 'recommendedActions'],
    };

    const text = await callServerGenerate({
      prompt,
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: insightSchema,
    });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (
          parsed.executiveSummary &&
          Array.isArray(parsed.keyFindings) &&
          Array.isArray(parsed.criticalRisks) &&
          Array.isArray(parsed.recommendedActions)
        ) {
          return {
            insights: {
              timestamp: new Date().toISOString(),
              executiveSummary: parsed.executiveSummary,
              keyFindings: parsed.keyFindings,
              criticalRisks: parsed.criticalRisks,
              recommendedActions: parsed.recommendedActions,
            },
            isAiGenerated: true,
          };
        }
      } catch (err) {
        console.warn('Failed parsing Admin Insights JSON, falling back.', err);
      }
    }

    // Graceful fallback
    const fallbackInsights = FallbackService.generateAdminInsights(aggregateStats);
    return { insights: fallbackInsights, isAiGenerated: false };
  },
};
