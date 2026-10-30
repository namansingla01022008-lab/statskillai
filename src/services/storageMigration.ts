/**
 * Storage Schema Migration
 * 
 * Versioned, one-time migration that runs on app startup.
 * Upgrades legacy `statskillai:*` un-normalized entries into compact,
 * normalized, TTL-wrapped `app:v1:*` storage structures, then safely
 * deletes legacy keys to free browser storage.
 */

import { storage } from './storage';
import {
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
  QUESTION_CACHE_TTL_MS,
  STORAGE_CAPS,
} from './storageConfig';
import {
  StorageMappers,
  QuestionCacheMap,
  CompactAttempt,
  CompactQuiz,
} from './storageMappers';
import {
  AssessmentAttempt,
  QuizRecord,
  DirectMessage,
  ChatMessage,
} from '../types';

const LEGACY_PREFIX = 'statskillai:';

export function runStorageMigration(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const currentVersion = storage.load<number>(SCHEMA_VERSION_KEY);
    if (currentVersion && currentVersion >= SCHEMA_VERSION) {
      // Already at current schema version
      return true;
    }

    console.info(`[Storage Migration] Upgrading schema to v${SCHEMA_VERSION}...`);

    // Shared question cache accumulator
    const questionCache: QuestionCacheMap =
      storage.load<QuestionCacheMap>('questions_cache') || {};

    const legacyKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(LEGACY_PREFIX)) {
        legacyKeys.push(k);
      }
    }

    if (legacyKeys.length === 0) {
      // No legacy data present; stamp schema version and return
      storage.save(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
      return true;
    }

    // 1. Migrate Assessment Attempts (highest storage consumer)
    const rawAttempts = window.localStorage.getItem(`${LEGACY_PREFIX}assessmentAttempts`);
    if (rawAttempts) {
      try {
        const legacyAttempts = JSON.parse(rawAttempts) as Record<string, AssessmentAttempt[]>;
        const compactMap: Record<string, CompactAttempt[]> = {};

        for (const userId of Object.keys(legacyAttempts)) {
          const userAttempts = legacyAttempts[userId] || [];
          compactMap[userId] = userAttempts.map((att) =>
            StorageMappers.attemptToStorage(att, questionCache)
          );
        }

        // Enforce capacity bounds
        StorageMappers.trimAttemptsMap(compactMap, STORAGE_CAPS.MAX_ATTEMPTS_PER_USER);
        storage.save('assessmentAttempts', compactMap);
      } catch (attErr) {
        console.warn('[Storage Migration] Failed to migrate attempts, skipping:', attErr);
      }
    }

    // 2. Migrate Quizzes
    const rawQuizzes = window.localStorage.getItem(`${LEGACY_PREFIX}quizzes`);
    if (rawQuizzes) {
      try {
        const legacyQuizzes = JSON.parse(rawQuizzes) as QuizRecord[];
        if (Array.isArray(legacyQuizzes)) {
          const compactQuizzes = legacyQuizzes.map((q) =>
            StorageMappers.quizToStorage(q, questionCache)
          );
          const trimmedQuizzes = StorageMappers.trimQuizzes(compactQuizzes, STORAGE_CAPS.MAX_QUIZZES_PER_USER);
          storage.save('quizzes', trimmedQuizzes);
        }
      } catch (quizErr) {
        console.warn('[Storage Migration] Failed to migrate quizzes:', quizErr);
      }
    }

    // 3. Save accumulated Question Cache with 14-day TTL
    StorageMappers.trimQuestionCache(questionCache, STORAGE_CAPS.MAX_QUESTIONS_CACHE);
    storage.save('questions_cache', questionCache, QUESTION_CACHE_TTL_MS);

    // 4. Migrate Direct Messages with per-thread bounds
    const rawMessages = window.localStorage.getItem(`${LEGACY_PREFIX}messages`);
    if (rawMessages) {
      try {
        const legacyMessages = JSON.parse(rawMessages) as DirectMessage[];
        if (Array.isArray(legacyMessages)) {
          const trimmed = StorageMappers.trimMessages(legacyMessages, STORAGE_CAPS.MAX_MESSAGES_PER_CONVERSATION);
          storage.save('messages', trimmed);
        }
      } catch (msgErr) {
        console.warn('[Storage Migration] Failed to migrate messages:', msgErr);
      }
    }

    // 5. Migrate Chat History with per-user bounds
    const rawChat = window.localStorage.getItem(`${LEGACY_PREFIX}chatHistory`);
    if (rawChat) {
      try {
        const legacyChat = JSON.parse(rawChat) as ChatMessage[];
        if (Array.isArray(legacyChat)) {
          const trimmed = StorageMappers.trimChatHistory(legacyChat, STORAGE_CAPS.MAX_CHAT_HISTORY_PER_USER);
          storage.save('chatHistory', trimmed);
        }
      } catch (chatErr) {
        console.warn('[Storage Migration] Failed to migrate chat history:', chatErr);
      }
    }

    // 6. Migrate Standard Collections
    const standardKeys = [
      'users',
      'courses',
      'opportunities',
      'organisations',
      'mentors',
      'profiles',
      'gapAnalyses',
      'learningPaths',
      'mentorships',
      'orgEmployees',
      'applications',
      'settings',
    ];

    for (const key of standardKeys) {
      const raw = window.localStorage.getItem(`${LEGACY_PREFIX}${key}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          storage.save(key, parsed);
        } catch {
          // Ignore corrupted entries
        }
      }
    }

    // 7. Delete all legacy statskillai:* keys to reclaim storage
    for (const oldKey of legacyKeys) {
      window.localStorage.removeItem(oldKey);
    }

    // 8. Record completed schema migration
    storage.save(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
    console.info('[Storage Migration] Migration completed successfully.');
    return true;
  } catch (err) {
    console.warn('[Storage Migration] Migration encountered an error, falling back to clean state:', err);
    // Never crash the app
    try {
      storage.save(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
    } catch {
      // Ignore
    }
    return false;
  }
}

