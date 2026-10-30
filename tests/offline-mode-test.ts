import {
  AUTHORITATIVE_QUESTIONS,
  QUESTION_SET_VERSION,
  getSanitizedPreloadedQuestions,
  scoreOfflineAttempt,
} from '../server/services/questionBank';

async function runOfflineModeTests() {
  console.log('🧪 [Offline Mode & PWA Verification] Running tests...\n');
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

  // TEST 1: Confidentiality & Sanitization of Preloaded Questions
  console.log('1. Confidentiality & Sanitization of Preloaded Question Set');
  const sanitized = getSanitizedPreloadedQuestions();
  assert(sanitized.length > 0, `Preloaded question bank loaded (${sanitized.length} questions)`);

  let answersLeaked = false;
  let explanationsLeaked = false;
  for (const q of sanitized) {
    if ('correctIndex' in q || 'correctAnswer' in q || 'answer' in q) {
      answersLeaked = true;
    }
    if ('explanation' in q) {
      explanationsLeaked = true;
    }
  }
  assert(!answersLeaked, 'Zero answer keys, correct indices, or solution fields in client payload');
  assert(!explanationsLeaked, 'Zero answer explanations present in client payload');

  // Verify structure
  const firstQ = sanitized[0];
  assert(
    Boolean(firstQ.id && firstQ.question && Array.isArray(firstQ.options) && firstQ.options.length >= 2),
    'Sanitized questions retain required schema (id, question, options array, domain, difficulty)'
  );

  // TEST 2: Authoritative Server-Side Re-Scoring
  console.log('\n2. Authoritative Server-Side Scoring & Zero-Trust Client Score');
  const sampleQ1 = AUTHORITATIVE_QUESTIONS[0];
  const sampleQ2 = AUTHORITATIVE_QUESTIONS[1];

  const now = Date.now();
  const validAnswers = [
    { questionId: sampleQ1.id, selectedOption: sampleQ1.correctIndex, answeredAt: new Date(now - 8000).toISOString() },
    { questionId: sampleQ2.id, selectedOption: sampleQ2.correctIndex, answeredAt: new Date(now - 4000).toISOString() },
  ];

  const scoreResult = scoreOfflineAttempt({
    domain: 'Statistical',
    questionSetVersion: QUESTION_SET_VERSION,
    answers: validAnswers,
    startedAt: new Date(now - 10000).toISOString(),
    submittedAt: new Date(now).toISOString(),
  });

  assert(scoreResult.valid === true, 'Server validated legitimate offline attempt');
  assert(scoreResult.score === 100, `Authoritative score computed correctly: ${scoreResult.score}% (expected 100%)`);

  // Zero-trust client tamper test: Client sends wrong answers
  const wrongAnswers = [
    { questionId: sampleQ1.id, selectedOption: (sampleQ1.correctIndex + 1) % 4, answeredAt: new Date(now - 8000).toISOString() },
    { questionId: sampleQ2.id, selectedOption: (sampleQ2.correctIndex + 1) % 4, answeredAt: new Date(now - 4000).toISOString() },
  ];

  const wrongScoreResult = scoreOfflineAttempt({
    domain: 'Statistical',
    questionSetVersion: QUESTION_SET_VERSION,
    answers: wrongAnswers,
    startedAt: new Date(now - 10000).toISOString(),
    submittedAt: new Date(now).toISOString(),
  });

  assert(wrongScoreResult.valid === true, 'Server evaluated attempt');
  assert(wrongScoreResult.score === 0, `Server correctly gave 0% despite any external claims: ${wrongScoreResult.score}%`);

  // TEST 3: Security & Tamper Checks
  console.log('\n3. Security Sanity Checks & Tamper Resistance');

  // 3a. Future timestamp rejection
  const futureSubmit = scoreOfflineAttempt({
    domain: 'Statistical',
    questionSetVersion: QUESTION_SET_VERSION,
    answers: validAnswers,
    startedAt: new Date(now).toISOString(),
    submittedAt: new Date(now + 120000).toISOString(), // 2 minutes in future (>60s clock skew)
  });
  assert(futureSubmit.valid === false && Boolean(futureSubmit.error?.includes('future')), 'Rejected attempt with future submittedAt timestamp');

  // 3b. Stale attempt rejection (> 7 days)
  const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
  const staleSubmit = scoreOfflineAttempt({
    domain: 'Statistical',
    questionSetVersion: QUESTION_SET_VERSION,
    answers: validAnswers,
    startedAt: new Date(eightDaysAgo - 10000).toISOString(),
    submittedAt: new Date(eightDaysAgo).toISOString(),
  });
  assert(staleSubmit.valid === false && Boolean(staleSubmit.error?.includes('7 days')), 'Rejected attempt older than 7 days');

  // 3c. Implausible speed rejection (< 1s per question average)
  const robotSubmit = scoreOfflineAttempt({
    domain: 'Statistical',
    questionSetVersion: QUESTION_SET_VERSION,
    answers: validAnswers,
    startedAt: new Date(now - 500).toISOString(), // 500ms for 2 questions = 250ms/question
    submittedAt: new Date(now).toISOString(),
  });
  assert(robotSubmit.valid === false && Boolean(robotSubmit.error?.includes('Implausible')), 'Rejected attempt with implausible completion speed (<1s/question)');

  // 3d. Unknown/tampered question ID rejection
  const forgedAnswers = [
    { questionId: 'fake-injected-id-999', selectedOption: 0, answeredAt: new Date(now - 4000).toISOString() },
  ];
  const forgedSubmit = scoreOfflineAttempt({
    domain: 'Statistical',
    questionSetVersion: QUESTION_SET_VERSION,
    answers: forgedAnswers,
    startedAt: new Date(now - 5000).toISOString(),
    submittedAt: new Date(now).toISOString(),
  });
  assert(forgedSubmit.valid === false && Boolean(forgedSubmit.error?.includes('Unknown questionId')), 'Rejected forged attempt with unknown questionId');

  // 3e. Version mismatch rejection
  const badVersionSubmit = scoreOfflineAttempt({
    domain: 'Statistical',
    questionSetVersion: 'v999-unsupported',
    answers: validAnswers,
    startedAt: new Date(now - 10000).toISOString(),
    submittedAt: new Date(now).toISOString(),
  });
  assert(badVersionSubmit.valid === false && Boolean(badVersionSubmit.error?.includes('version')), 'Rejected attempt with unsupported question-set version');

  // SUMMARY
  console.log(`\n===========================================`);
  console.log(`Total tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`===========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runOfflineModeTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
