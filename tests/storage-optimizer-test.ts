/**
 * Unit Test Suite for Storage Optimizer
 * 
 * Verifies:
 * 1. TTL expiration and cleanup on read
 * 2. QuotaExceededError recovery and 25% LRU eviction
 * 3. Corrupted JSON error resilience (no throwing into UI)
 * 4. Bounded capacity enforcement (attempts, quizzes, messages, chat history)
 * 5. Question normalization & deduplication (reconstructing full attempts)
 * 6. One-time legacy schema migration from statskillai:* to app:v1:*
 * 7. Debounce helper & flushPendingWrites
 * 8. Heavy-user stress simulation (200 attempts, 500 questions, 500 messages) within 500 KB budget
 */

// Mock browser window and localStorage in Node
const mockStore: Record<string, string> = {};

const mockLocalStorage = {
  getItem: (key: string) => (key in mockStore ? mockStore[key] : null),
  setItem: (key: string, value: string) => {
    mockStore[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStore)) delete mockStore[k];
  },
  key: (index: number) => Object.keys(mockStore)[index] || null,
  get length() {
    return Object.keys(mockStore).length;
  },
};

(global as any).window = {
  localStorage: mockLocalStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
};
(global as any).document = {
  visibilityState: 'visible',
};
(global as any).Blob = class MockBlob {
  private sizeInBytes: number;
  constructor(parts: any[]) {
    this.sizeInBytes = Buffer.byteLength(parts.join(''), 'utf8');
  }
  get size() {
    return this.sizeInBytes;
  }
};

import { storage, flushPendingWrites } from '../src/services/storage';
import { StorageMappers, QuestionCacheMap } from '../src/services/storageMappers';
import { runStorageMigration } from '../src/services/storageMigration';
import { STORAGE_CAPS, STORAGE_BUDGET, STORAGE_PREFIX } from '../src/services/storageConfig';
import { AssessmentAttempt, QuestionRecord, DirectMessage } from '../src/types';

async function runTests() {
  console.log('🧪 [Storage Optimizer Tests] Running verification suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- TEST 1: Basic Save, Load, and TTL Expiry ---
  console.log('1. Central Storage Wrapper: Save, Load & TTL Expiry');
  storage.clearAll();

  // Save with 100ms TTL
  storage.save('test_ttl', { greeting: 'hello' }, 100);
  const loadedFresh = storage.load<{ greeting: string }>('test_ttl');
  assert(loadedFresh?.greeting === 'hello', 'Successfully saved and retrieved unexpired item');

  // Wait 150ms for TTL to lapse
  await new Promise((r) => setTimeout(r, 150));
  const loadedExpired = storage.load('test_ttl');
  assert(loadedExpired === null, 'Expired item returned null on read');
  assert(mockLocalStorage.getItem(`${STORAGE_PREFIX}test_ttl`) === null, 'Expired item was cleaned up from storage');

  // --- TEST 2: Corrupted JSON Resilience ---
  console.log('\n2. Corrupted JSON Resilience');
  mockStore[`${STORAGE_PREFIX}corrupt_key`] = '{invalid json syntax';
  const corruptResult = storage.load('corrupt_key');
  assert(corruptResult === null, 'Corrupted JSON safely returned null without throwing');
  assert(!(`${STORAGE_PREFIX}corrupt_key` in mockStore), 'Corrupted key was purged from storage');

  // --- TEST 3: QuotaExceededError Recovery & Eviction ---
  console.log('\n3. QuotaExceededError Recovery & 25% Eviction');
  storage.clearAll();

  // Populate 10 keys
  for (let i = 0; i < 10; i++) {
    storage.save(`batch_key_${i}`, { index: i, data: 'dummy payload' });
  }
  assert(Object.keys(mockStore).length === 10, 'Populated 10 keys in storage');

  // Simulate QuotaExceededError on next write, then succeed after eviction
  let quotaFired = false;
  const originalSetItem = mockLocalStorage.setItem;
  mockLocalStorage.setItem = function (k: string, v: string) {
    if (!quotaFired) {
      quotaFired = true;
      const err: any = new Error('Quota exceeded');
      err.name = 'QuotaExceededError';
      throw err;
    }
    mockStore[k] = v;
  };

  const saveAfterQuota = storage.save('overflow_key', { data: 'rescued' });
  mockLocalStorage.setItem = originalSetItem; // Restore

  assert(saveAfterQuota === true, 'Storage wrapper caught QuotaExceededError, evicted oldest keys, and retried successfully');
  assert(storage.load<{ data: string }>('overflow_key')?.data === 'rescued', 'New key was successfully saved after eviction');
  assert(Object.keys(mockStore).length <= 9, `Old keys were evicted (current total: ${Object.keys(mockStore).length})`);

  // --- TEST 4: Question Normalization & Deduplication ---
  console.log('\n4. Question Normalization & Deduplication');
  const sharedQuestion: QuestionRecord = {
    id: 'q-norm-1',
    question: 'What is the sampling fraction in SRS?',
    options: ['n/N', 'N/n', 'n/(N-1)', 'sqrt(n/N)'],
    correctIndex: 0,
    explanation: 'The sampling fraction f is defined as the sample size n divided by population size N.',
    difficulty: 'Easy',
    skillTag: 'Sampling Theory',
    domain: 'Statistical',
  };

  const questionCache: QuestionCacheMap = {};

  const attempt1: AssessmentAttempt = {
    id: 'att-1',
    userId: 'user-1',
    domain: 'Statistical',
    date: '2026-10-01',
    questions: [sharedQuestion],
    userAnswers: [0],
    score: 100,
    earnedWeight: 1,
    maxWeight: 1,
    completed: true,
  };

  const attempt2: AssessmentAttempt = {
    id: 'att-2',
    userId: 'user-1',
    domain: 'Statistical',
    date: '2026-10-02',
    questions: [sharedQuestion], // Re-used question
    userAnswers: [1],
    score: 0,
    earnedWeight: 0,
    maxWeight: 1,
    completed: true,
  };

  const compact1 = StorageMappers.attemptToStorage(attempt1, questionCache);
  const compact2 = StorageMappers.attemptToStorage(attempt2, questionCache);

  assert(Object.keys(questionCache).length === 1, 'Question was stored exactly once in questionCache despite being in multiple attempts');
  assert(compact1.qIds[0] === 'q-norm-1' && !('questions' in compact1), 'Attempt stores only question ID reference, not full question object');

  const reconstructed1 = StorageMappers.attemptFromStorage(compact1, questionCache);
  assert(reconstructed1.questions[0].question === sharedQuestion.question, 'fromStorage faithfully reconstructed full QuestionRecord');
  assert(reconstructed1.score === 100 && reconstructed1.userAnswers[0] === 0, 'Reconstructed attempt preserves original answers and scores');

  // --- TEST 5: Capacity Bounds & Trimming ---
  console.log('\n5. Capacity Bounds & Collection Trimming');

  // 5a. Attempts map trimming (capped at 50 per user)
  const attemptsMap: Record<string, any[]> = { 'user-1': [] };
  for (let i = 0; i < 70; i++) {
    attemptsMap['user-1'].push({ id: `att-${i}`, s: 80, qIds: ['q1'] });
  }
  StorageMappers.trimAttemptsMap(attemptsMap, 50);
  assert(attemptsMap['user-1'].length === 50, `Attempts trimmed to cap: ${attemptsMap['user-1'].length} (cap: 50)`);

  // 5b. Direct messages trimming (capped at 200 per conversation)
  const messages: DirectMessage[] = [];
  for (let i = 0; i < 250; i++) {
    messages.push({
      id: `msg-${i}`,
      mentorshipId: 'thread-1',
      senderId: 'user-1',
      senderName: 'Learner',
      senderRole: 'learner',
      text: `Hello ${i}`,
      timestamp: new Date().toISOString(),
    });
  }
  const trimmedMsgs = StorageMappers.trimMessages(messages, 200);
  assert(trimmedMsgs.length === 200, `Direct messages trimmed to cap: ${trimmedMsgs.length} (cap: 200)`);
  assert(trimmedMsgs[trimmedMsgs.length - 1].id === 'msg-249', 'Trimmed messages correctly preserved newest entries');

  // --- TEST 6: Debounced Save & Flush ---
  console.log('\n6. Debounced Save & Flush');
  storage.clearAll();
  storage.saveDebounced('debounced_test', { counter: 1 }, 10000, 300);
  storage.saveDebounced('debounced_test', { counter: 2 }, 10000, 300);
  storage.saveDebounced('debounced_test', { counter: 3 }, 10000, 300);

  // In-memory hot cache is immediately updated
  assert(storage.load<{ counter: number }>('debounced_test')?.counter === 3, 'In-memory cache immediately reflects latest debounced write');

  // Flush before timeout
  flushPendingWrites();
  const rawWritten = mockLocalStorage.getItem(`${STORAGE_PREFIX}debounced_test`);
  assert(rawWritten !== null && JSON.parse(rawWritten).v.counter === 3, 'flushPendingWrites committed newest state to localStorage');

  // --- TEST 7: Legacy Schema Migration ---
  console.log('\n7. One-Time Legacy Schema Migration');
  mockLocalStorage.clear();

  // Populate legacy statskillai:* keys
  mockStore['statskillai:settings'] = JSON.stringify({ language: 'hi', highContrast: true });
  mockStore['statskillai:assessmentAttempts'] = JSON.stringify({
    'user-demo': [
      {
        id: 'legacy-att-1',
        userId: 'user-demo',
        domain: 'Technical',
        date: '2026-09-15',
        questions: [sharedQuestion],
        userAnswers: [0],
        score: 95,
        earnedWeight: 5,
        maxWeight: 5,
        completed: true,
      },
    ],
  });

  const migrated = runStorageMigration();
  assert(migrated === true, 'Migration executed successfully');
  assert(!('statskillai:assessmentAttempts' in mockStore), 'Legacy statskillai: key was cleaned up');
  assert(`${STORAGE_PREFIX}assessmentAttempts` in mockStore, 'New namespaced key app:v1:assessmentAttempts was created');
  assert(`${STORAGE_PREFIX}questions_cache` in mockStore, 'Questions from legacy attempt were normalized into questions_cache');
  assert(storage.load<any>('settings')?.language === 'hi', 'Settings migrated cleanly');

  // --- TEST 8: Heavy User Stress Test (<500 KB Global Budget, <50 KB Single Key) ---
  console.log('\n8. Heavy User Simulation: 200 Attempts, 500 Questions, 500 Messages');
  storage.clearAll();

  // Build 500 unique questions in question cache
  const stressQuestionCache: QuestionCacheMap = {};
  for (let i = 0; i < 500; i++) {
    stressQuestionCache[`stress-q-${i}`] = {
      q: {
        id: `stress-q-${i}`,
        question: `Empirical survey methodology question #${i} with realistic statistical terminology`,
        options: ['Stratified Random', 'Cluster Sampling', 'Systematic Sampling', 'Multistage Sampling'],
        correctIndex: i % 4,
        explanation: `Explanation for question ${i} regarding survey variance estimation.`,
        difficulty: i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Medium' : 'Hard',
        skillTag: 'Official Statistics',
        domain: 'Statistical',
      },
      lastUsed: Date.now(),
    };
  }

  // Simulate user submitting 200 attempts (trimmed to 50 cap)
  const stressAttempts: Record<string, any[]> = { 'user-heavy': [] };
  for (let i = 0; i < 200; i++) {
    const qIds = [`stress-q-${(i * 5) % 500}`, `stress-q-${(i * 5 + 1) % 500}`, `stress-q-${(i * 5 + 2) % 500}`, `stress-q-${(i * 5 + 3) % 500}`, `stress-q-${(i * 5 + 4) % 500}`];
    stressAttempts['user-heavy'].push({
      id: `att-stress-${i}`,
      uId: 'user-heavy',
      d: 'Statistical',
      dt: '2026-10-30',
      qIds,
      ans: [0, 1, 2, 3, 0],
      s: 85,
      ew: 8,
      mw: 10,
      c: true,
    });
  }
  StorageMappers.trimAttemptsMap(stressAttempts, STORAGE_CAPS.MAX_ATTEMPTS_PER_USER);

  // Simulate 500 messages (trimmed to 200 cap)
  const stressMessages: DirectMessage[] = [];
  for (let i = 0; i < 500; i++) {
    stressMessages.push({
      id: `msg-stress-${i}`,
      mentorshipId: 'thread-stress-1',
      senderId: 'user-heavy',
      senderName: 'Aarav Sharma',
      senderRole: 'learner',
      text: `Progress report message ${i} discussing sample allocation weights.`,
      timestamp: new Date().toISOString(),
    });
  }
  const trimmedStressMessages = StorageMappers.trimMessages(stressMessages, STORAGE_CAPS.MAX_MESSAGES_PER_CONVERSATION);

  // Trim and save all to storage wrapper
  StorageMappers.trimQuestionCache(stressQuestionCache);
  storage.save('questions_cache', stressQuestionCache);
  storage.save('assessmentAttempts', stressAttempts);
  storage.save('messages', trimmedStressMessages);

  const usageBytes = storage.getUsageBytes();
  const usageKB = usageBytes / 1024;
  console.log(`\n  📊 Heavy User Total Storage: ${usageKB.toFixed(2)} KB`);

  assert(usageBytes < STORAGE_BUDGET.GLOBAL_BUDGET_BYTES, `Total storage (${usageKB.toFixed(2)} KB) is well below the 500 KB limit`);

  // Verify single-key budget for attempts
  const attemptsBytes = new Blob([mockStore[`${STORAGE_PREFIX}assessmentAttempts`] || '']).size;
  console.log(`  📊 Attempts Key Size: ${(attemptsBytes / 1024).toFixed(2)} KB`);
  assert(attemptsBytes < STORAGE_BUDGET.MAX_SINGLE_KEY_BYTES, `Attempts key size (${(attemptsBytes / 1024).toFixed(2)} KB) is well below 50 KB cap`);

  // SUMMARY
  console.log(`\n===========================================`);
  console.log(`Total tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`===========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
