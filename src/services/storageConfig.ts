/**
 * Storage Optimizer Configuration & Policy Constants
 * 
 * Defines hard capacity bounds, TTL values, and budget constraints for localStorage.
 */

export const STORAGE_PREFIX = 'app:v1:';
export const SCHEMA_VERSION = 1;
export const SCHEMA_VERSION_KEY = 'schema_version';

// Default Time-To-Live (in milliseconds)
export const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const QUESTION_CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
export const SESSION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

// Collection Capacity Limits (Hard Caps)
export const STORAGE_CAPS = {
  /** Maximum number of assessment attempts preserved per user (newest kept) */
  MAX_ATTEMPTS_PER_USER: 50,
  /** Maximum number of question records kept in the normalized question cache */
  MAX_QUESTIONS_CACHE: 500,
  /** Maximum number of direct messages stored per conversation / mentorship */
  MAX_MESSAGES_PER_CONVERSATION: 200,
  /** Maximum number of assistant chat turns stored per user */
  MAX_CHAT_HISTORY_PER_USER: 50,
  /** Maximum number of generated quizzes preserved per user */
  MAX_QUIZZES_PER_USER: 50,
  /** Maximum number of opportunity applications retained */
  MAX_APPLICATIONS: 50,
} as const;

// Storage Budget Safeguards
export const STORAGE_BUDGET = {
  /** Warning threshold for a single key (50 KB) */
  MAX_SINGLE_KEY_BYTES: 50 * 1024,
  /** Global target budget for all app keys combined (500 KB) */
  GLOBAL_BUDGET_BYTES: 500 * 1024,
  /** Percentage of oldest app keys to evict when QuotaExceededError is encountered (25%) */
  EVICTION_RATIO: 0.25,
  /** Default debounce delay for debounced persistence (ms) */
  DEFAULT_DEBOUNCE_MS: 500,
} as const;

