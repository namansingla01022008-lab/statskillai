/**
 * Storage Mappers & Normalization Layer
 * 
 * Compresses heavy data structures (AssessmentAttempts, Quizzes) by deduplicating
 * full QuestionRecord objects into a single shared LRU questions cache.
 * Exposes toStorage / fromStorage converters to preserve 100% in-memory compatibility.
 */

import {
  AssessmentAttempt,
  QuizRecord,
  QuestionRecord,
  DirectMessage,
  ChatMessage,
  DomainType,
} from '../types';
import { STORAGE_CAPS, STORAGE_BUDGET } from './storageConfig';

// Compact representation of an AssessmentAttempt in localStorage
export interface CompactAttempt {
  id: string;
  uId: string;       // userId
  d: DomainType;     // domain
  dt: string;        // date
  qIds: string[];    // question IDs
  ans: number[];     // userAnswers
  s: number;         // score
  ew: number;        // earnedWeight
  mw: number;        // maxWeight
  ps?: number;       // previousScore
  c: boolean;        // completed
}

// Compact representation of a QuizRecord in localStorage
export interface CompactQuiz {
  id: string;
  uId: string;
  t: string;         // title
  st: 'pdf' | 'text';
  sn: string;        // sourceSnippet (compacted)
  ts: string;        // timestamp
  diff: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  qIds: string[];    // question IDs
  ans: number[];     // userAnswers
  s: number;         // score
  tq: number;        // totalQuestions
}

export interface CachedQuestionItem {
  q: QuestionRecord;
  lastUsed: number;
}

/**
 * Normalized Question Cache Dictionary (questionId -> CachedQuestionItem)
 */
export type QuestionCacheMap = Record<string, CachedQuestionItem>;

// Fallback question builder when a question ID was evicted from local LRU cache
function createPlaceholderQuestion(id: string, domain?: DomainType): QuestionRecord {
  return {
    id,
    question: `Archived assessment question (${id})`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 0,
    explanation: 'Question details archived. Full report available from server.',
    difficulty: 'Medium',
    skillTag: 'Statistical Core',
    domain: domain || 'Statistical',
  };
}

export const StorageMappers = {
  /**
   * Normalize an AssessmentAttempt into a CompactAttempt and register questions in questionCache.
   */
  attemptToStorage(
    attempt: AssessmentAttempt,
    questionCache: QuestionCacheMap
  ): CompactAttempt {
    const now = Date.now();
    const qIds: string[] = [];

    if (Array.isArray(attempt.questions)) {
      for (const q of attempt.questions) {
        if (!q || !q.id) continue;
        qIds.push(q.id);
        // Save or update question in shared normalized cache
        questionCache[q.id] = {
          q,
          lastUsed: now,
        };
      }
    }

    return {
      id: attempt.id,
      uId: attempt.userId,
      d: attempt.domain,
      dt: attempt.date,
      qIds,
      ans: Array.isArray(attempt.userAnswers) ? attempt.userAnswers : [],
      s: attempt.score,
      ew: attempt.earnedWeight,
      mw: attempt.maxWeight,
      ps: attempt.previousScore,
      c: attempt.completed,
    };
  },

  /**
   * Reconstruct a full AssessmentAttempt from CompactAttempt using the shared questionCache.
   */
  attemptFromStorage(
    compact: CompactAttempt,
    questionCache: QuestionCacheMap
  ): AssessmentAttempt {
    const questions: QuestionRecord[] = [];
    const now = Date.now();

    for (const qId of compact.qIds || []) {
      const cached = questionCache[qId];
      if (cached && cached.q) {
        cached.lastUsed = now; // update LRU access time
        questions.push(cached.q);
      } else {
        questions.push(createPlaceholderQuestion(qId, compact.d));
      }
    }

    return {
      id: compact.id,
      userId: compact.uId,
      domain: compact.d,
      date: compact.dt,
      questions,
      userAnswers: compact.ans || [],
      score: compact.s,
      earnedWeight: compact.ew,
      maxWeight: compact.mw,
      previousScore: compact.ps,
      completed: compact.c,
    };
  },

  /**
   * Normalize a QuizRecord into a CompactQuiz and register questions in questionCache.
   */
  quizToStorage(
    quiz: QuizRecord,
    questionCache: QuestionCacheMap
  ): CompactQuiz {
    const now = Date.now();
    const qIds: string[] = [];

    if (Array.isArray(quiz.questions)) {
      for (const q of quiz.questions) {
        if (!q || !q.id) continue;
        qIds.push(q.id);
        questionCache[q.id] = {
          q,
          lastUsed: now,
        };
      }
    }

    return {
      id: quiz.id,
      uId: quiz.userId,
      t: quiz.title,
      st: quiz.sourceType,
      // Bound snippet length to 200 characters to prevent huge text blobs
      sn: quiz.sourceSnippet ? quiz.sourceSnippet.slice(0, 200) : '',
      ts: quiz.timestamp,
      diff: quiz.difficulty,
      qIds,
      ans: Array.isArray(quiz.userAnswers) ? quiz.userAnswers : [],
      s: quiz.score,
      tq: quiz.totalQuestions,
    };
  },

  /**
   * Reconstruct a full QuizRecord from CompactQuiz using the shared questionCache.
   */
  quizFromStorage(
    compact: CompactQuiz,
    questionCache: QuestionCacheMap
  ): QuizRecord {
    const questions: QuestionRecord[] = [];
    const now = Date.now();

    for (const qId of compact.qIds || []) {
      const cached = questionCache[qId];
      if (cached && cached.q) {
        cached.lastUsed = now;
        questions.push(cached.q);
      } else {
        questions.push(createPlaceholderQuestion(qId));
      }
    }

    return {
      id: compact.id,
      userId: compact.uId,
      title: compact.t,
      sourceType: compact.st,
      sourceSnippet: compact.sn,
      timestamp: compact.ts,
      difficulty: compact.diff,
      questions,
      userAnswers: compact.ans || [],
      score: compact.s,
      totalQuestions: compact.tq,
    };
  },

  /**
   * Trim assessment attempts dictionary per user to MAX_ATTEMPTS_PER_USER.
   */
  trimAttemptsMap(
    map: Record<string, CompactAttempt[]>,
    capPerUser: number = STORAGE_CAPS.MAX_ATTEMPTS_PER_USER
  ): Record<string, CompactAttempt[]> {
    for (const userId of Object.keys(map)) {
      if (Array.isArray(map[userId]) && map[userId].length > capPerUser) {
        // Keep the newest attempts (attempts are unshifted, so index 0 is newest)
        map[userId] = map[userId].slice(0, capPerUser);
      }
    }
    return map;
  },

  /**
   * Trim quizzes array to MAX_QUIZZES_PER_USER per user.
   */
  trimQuizzes(
    quizzes: CompactQuiz[],
    capPerUser: number = STORAGE_CAPS.MAX_QUIZZES_PER_USER
  ): CompactQuiz[] {
    const userCounts: Record<string, number> = {};
    const trimmed: CompactQuiz[] = [];

    // Quizzes are unshifted (newest first)
    for (const q of quizzes) {
      const count = userCounts[q.uId] || 0;
      if (count < capPerUser) {
        trimmed.push(q);
        userCounts[q.uId] = count + 1;
      }
    }
    return trimmed;
  },

  /**
   * Trim direct messages to MAX_MESSAGES_PER_CONVERSATION per mentorship thread.
   */
  trimMessages(
    messages: DirectMessage[],
    capPerThread: number = STORAGE_CAPS.MAX_MESSAGES_PER_CONVERSATION
  ): DirectMessage[] {
    const byThread: Record<string, DirectMessage[]> = {};

    for (const m of messages) {
      if (!byThread[m.mentorshipId]) {
        byThread[m.mentorshipId] = [];
      }
      byThread[m.mentorshipId].push(m);
    }

    const trimmed: DirectMessage[] = [];
    for (const threadId of Object.keys(byThread)) {
      const threadMsgs = byThread[threadId];
      // Keep newest capPerThread messages
      const kept = threadMsgs.length > capPerThread
        ? threadMsgs.slice(threadMsgs.length - capPerThread)
        : threadMsgs;
      trimmed.push(...kept);
    }
    return trimmed;
  },

  /**
   * Trim chat history to MAX_CHAT_HISTORY_PER_USER per user.
   */
  trimChatHistory(
    chatHistory: ChatMessage[],
    capPerUser: number = STORAGE_CAPS.MAX_CHAT_HISTORY_PER_USER
  ): ChatMessage[] {
    const byUser: Record<string, ChatMessage[]> = {};

    for (const msg of chatHistory) {
      if (!byUser[msg.userId]) {
        byUser[msg.userId] = [];
      }
      byUser[msg.userId].push(msg);
    }

    const trimmed: ChatMessage[] = [];
    for (const userId of Object.keys(byUser)) {
      const msgs = byUser[userId];
      const kept = msgs.length > capPerUser
        ? msgs.slice(msgs.length - capPerUser)
        : msgs;
      trimmed.push(...kept);
    }
    return trimmed;
  },

  /**
   * Trim shared question cache by LRU to MAX_QUESTIONS_CACHE and enforce 50 KB single-key budget.
   */
  trimQuestionCache(
    cache: QuestionCacheMap,
    maxCount: number = STORAGE_CAPS.MAX_QUESTIONS_CACHE,
    maxBytes: number = STORAGE_BUDGET.MAX_SINGLE_KEY_BYTES
  ): QuestionCacheMap {
    const keys = Object.keys(cache);
    if (keys.length === 0) return cache;

    // Sort by lastUsed ascending (oldest access first)
    const sorted = keys.map((k) => ({
      key: k,
      lastUsed: cache[k]?.lastUsed || 0,
    }));
    sorted.sort((a, b) => a.lastUsed - b.lastUsed);

    // 1. Cap by maxCount
    if (sorted.length > maxCount) {
      const excess = sorted.length - maxCount;
      const toRemove = sorted.splice(0, excess);
      for (const item of toRemove) {
        delete cache[item.key];
      }
    }

    // 2. Cap by maxBytes budget (keeps single key under 50 KB)
    let serialized = JSON.stringify(cache);
    let bytes = serialized.length * 2; // UTF-16 in localStorage
    if (bytes > maxBytes) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[Storage] questions_cache size (${(bytes / 1024).toFixed(1)} KB) exceeds 50 KB budget. Trimming oldest LRU questions...`
        );
      }

      while (sorted.length > 0 && bytes > maxBytes * 0.92) {
        const oldest = sorted.shift();
        if (oldest) {
          delete cache[oldest.key];
        }
        serialized = JSON.stringify(cache);
        bytes = serialized.length * 2;
      }
    }

    return cache;
  },
};
