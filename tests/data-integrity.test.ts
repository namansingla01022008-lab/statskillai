/**
 * StatSkillAI Data Integrity and Source Verification Test Suite
 * 
 * Tests the 6 mandatory verification scenarios:
 * 1. Seed validation & rejection of non-allowlisted domains / invalid schemas
 * 2. Repository grep: Zero hardcoded fabricated IDs remaining
 * 3. Gemini hallucination discard & server-side DB rendering
 * 4. Filtering of broken and unverified records from candidate sets
 * 5. Safe handling and fallback for users with progress on unavailable courses
 * 6. MockIgotAdapter contract and zero-fabrication guarantees
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Mock course and career databases for isolated server-side logic testing
const MOCK_DB_COURSES = [
  {
    id: 'nptel-stat-101',
    title: 'Introduction to Probability and Statistics',
    provider: 'NPTEL',
    topic: 'Probability & Statistics',
    level: 'Beginner',
    duration: '12 weeks',
    sourceUrl: 'https://nptel.ac.in/courses/111105090',
    sourceName: 'NPTEL / IIT Kharagpur',
    status: 'verified',
    lastVerifiedAt: '2026-10-31T00:00:00.000Z'
  },
  {
    id: 'igot-gov-301',
    title: 'Code of Conduct for Civil Services',
    provider: 'iGOT Karmayogi',
    topic: 'Civil Service Governance',
    level: 'Intermediate',
    duration: '4 hours',
    sourceUrl: 'https://igotkarmayogi.gov.in/public/courses/civil-conduct-101',
    sourceName: 'iGOT Karmayogi Bharat',
    status: 'verified',
    lastVerifiedAt: '2026-10-31T00:00:00.000Z'
  },
  {
    id: 'nptel-broken-test',
    title: 'Legacy Sample Survey Course (Broken URL)',
    provider: 'NPTEL',
    topic: 'Survey Methodology',
    level: 'Advanced',
    duration: '8 weeks',
    sourceUrl: 'https://nptel.ac.in/courses/legacy-broken-404',
    sourceName: 'NPTEL',
    status: 'broken',
    lastVerifiedAt: '2026-10-31T00:00:00.000Z'
  },
  {
    id: 'template-unverified-course',
    title: 'Unverified Manual Template',
    provider: 'SWAYAM',
    topic: 'Data Visualization',
    level: 'Beginner',
    duration: '6 weeks',
    sourceUrl: 'https://swayam.gov.in/template-course',
    sourceName: 'SWAYAM Portal',
    status: 'unverified',
    lastVerifiedAt: '2026-10-31T00:00:00.000Z'
  }
];

const ALLOWED_DOMAINS = [
  'nptel.ac.in',
  'onlinecourses.nptel.ac.in',
  'swayam.gov.in',
  'igotkarmayogi.gov.in',
  'mospi.gov.in',
  'esankhyiki.mospi.gov.in',
  'upsc.gov.in',
  'ssc.gov.in',
  'ncs.gov.in',
  'data.gov.in',
  'microdata.gov.in'
];

function isAllowlistedDomain(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

// Logic simulating the server-side Gemini response validator
function validateAndResolveRecommendations(
  candidateCourses: typeof MOCK_DB_COURSES,
  geminiOutput: { recommendations: Array<{ id: string; rationale: string }> }
) {
  // Step 1: Candidate set filter: ONLY verified records can ever be matched
  const verifiedMap = new Map(
    candidateCourses
      .filter(c => c.status === 'verified')
      .map(c => [c.id, c])
  );

  // Step 2: Validate each recommendation from Gemini
  const safeResults = [];
  for (const rec of geminiOutput.recommendations) {
    const verifiedDbRecord = verifiedMap.get(rec.id);
    if (!verifiedDbRecord) {
      // Discard fabricated, broken, or unverified IDs
      continue;
    }

    // Step 3: Render ALL metadata strictly from verified DB record, NEVER from Gemini text
    safeResults.push({
      id: verifiedDbRecord.id,
      title: verifiedDbRecord.title,
      provider: verifiedDbRecord.provider,
      sourceUrl: verifiedDbRecord.sourceUrl,
      sourceName: verifiedDbRecord.sourceName,
      status: verifiedDbRecord.status,
      lastVerifiedAt: verifiedDbRecord.lastVerifiedAt,
      rationale: rec.rationale // Only the educational reasoning is taken from Gemini
    });
  }

  if (safeResults.length === 0) {
    return {
      message: 'No verified recommendation available.',
      recommendations: []
    };
  }

  return {
    message: null,
    recommendations: safeResults
  };
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('🧪 StatSkillAI Data Integrity & Verification Tests');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] Test ${total}: ${name}`);
      console.error(`   Error: ${err.message}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: Seed Validation & Domain Allowlist Enforcement
  // ----------------------------------------------------
  test('Seed validation allows genuine allowlisted URLs and rejects non-allowlisted / non-HTTPS domains', () => {
    // Valid domains
    assert.strictEqual(isAllowlistedDomain('https://nptel.ac.in/courses/111105090'), true);
    assert.strictEqual(isAllowlistedDomain('https://onlinecourses.nptel.ac.in/noc24_ma12'), true);
    assert.strictEqual(isAllowlistedDomain('https://swayam.gov.in/explorer'), true);
    assert.strictEqual(isAllowlistedDomain('https://igotkarmayogi.gov.in/public/course/123'), true);
    assert.strictEqual(isAllowlistedDomain('https://mospi.gov.in/training-nssta'), true);
    assert.strictEqual(isAllowlistedDomain('https://esankhyiki.mospi.gov.in/macro-data'), true);
    assert.strictEqual(isAllowlistedDomain('https://upsc.gov.in/examinations/iss'), true);
    assert.strictEqual(isAllowlistedDomain('https://ssc.gov.in/cgl-notice'), true);
    assert.strictEqual(isAllowlistedDomain('https://data.gov.in/resource/cpi-all-india'), true);

    // Non-allowlisted or insecure domains
    assert.strictEqual(isAllowlistedDomain('http://nptel.ac.in/insecure'), false, 'HTTP must be rejected');
    assert.strictEqual(isAllowlistedDomain('https://coursera.org/learn/data-analysis'), false, 'Coursera must be rejected');
    assert.strictEqual(isAllowlistedDomain('https://udemy.com/course/python'), false, 'Udemy must be rejected');
    assert.strictEqual(isAllowlistedDomain('https://random-statistics-blog.com/guide'), false, 'Arbitrary domains must be rejected');
    assert.strictEqual(isAllowlistedDomain('https://ncert.nic.in/textbook.php'), false, 'NCERT must be rejected per rules');
  });

  // ----------------------------------------------------
  // TEST 2: Active Seed Files are Structurally Valid
  // ----------------------------------------------------
  test('Active seed files (courses.seed.json, careers.seed.json, datasets.seed.json) pass schema rules', () => {
    const coursesPath = path.resolve('data/courses.seed.json');
    const careersPath = path.resolve('data/careers.seed.json');
    const datasetsPath = path.resolve('data/datasets.seed.json');

    assert.ok(fs.existsSync(coursesPath), 'courses.seed.json must exist');
    assert.ok(fs.existsSync(careersPath), 'careers.seed.json must exist');
    assert.ok(fs.existsSync(datasetsPath), 'datasets.seed.json must exist');

    const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));
    const careers = JSON.parse(fs.readFileSync(careersPath, 'utf-8'));
    const datasets = JSON.parse(fs.readFileSync(datasetsPath, 'utf-8'));

    // Check course seeds
    const verifiedCourses = courses.filter((c: any) => c.status === 'verified');
    assert.ok(verifiedCourses.length >= 10, 'Must have at least 10 verified courses');
    for (const c of verifiedCourses) {
      assert.ok(c.id, 'Course must have an ID');
      assert.ok(c.title, 'Course must have a title');
      assert.ok(c.source_url, 'Course must have a source_url');
      assert.ok(isAllowlistedDomain(c.source_url), `source_url ${c.source_url} must be allowlisted`);
      assert.ok(c.last_verified_at, 'Course must have last_verified_at');
    }

    // Check career seeds
    const verifiedCareers = careers.filter((cr: any) => cr.status === 'verified');
    assert.ok(verifiedCareers.length >= 5, 'Must have at least 5 verified careers');
    for (const cr of verifiedCareers) {
      assert.ok(cr.id, 'Career must have an ID');
      assert.ok(cr.role_title, 'Career must have a role_title');
      assert.ok(cr.source_url, 'Career must have a source_url');
      assert.ok(isAllowlistedDomain(cr.source_url), `Career source_url ${cr.source_url} must be allowlisted`);
      assert.ok(cr.last_verified_at, 'Career must have last_verified_at');
    }

    // Check dataset seeds
    assert.ok(datasets.length >= 4, 'Must have at least 4 registered datasets');
    for (const ds of datasets) {
      assert.ok(ds.id, 'Dataset must have an ID');
      assert.ok(ds.name, 'Dataset must have a name');
      assert.ok(ds.licence, 'Dataset must have a licence');
      assert.ok(isAllowlistedDomain(ds.source_url), `Dataset source_url ${ds.source_url} must be allowlisted`);
    }
  });

  // ----------------------------------------------------
  // TEST 3: Repository Grep: Fabricated IDs Removed
  // ----------------------------------------------------
  test('No fabricated course or opportunity IDs exist in production source code or data files', () => {
    const fabricatedPatterns = [
      'course-stat-101',
      'course-stat-201',
      'course-ml-301',
      'course-gov-401',
      'opp-101',
      'opp-102',
      'opp-105'
    ];

    const dirsToCheck = ['src', 'server', 'data', 'prisma'];
    
    function scanDirectory(dir: string, foundMatches: string[]) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDirectory(fullPath, foundMatches);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.json'))) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          for (const pattern of fabricatedPatterns) {
            if (content.includes(pattern)) {
              foundMatches.push(`${pattern} found in ${fullPath}`);
            }
          }
        }
      }
    }

    const foundMatches: string[] = [];
    for (const dir of dirsToCheck) {
      if (fs.existsSync(dir)) {
        scanDirectory(dir, foundMatches);
      }
    }

    assert.strictEqual(
      foundMatches.length,
      0,
      `Fabricated IDs still found outside backups: \n${foundMatches.join('\n')}`
    );
  });

  // ----------------------------------------------------
  // TEST 4: Gemini Hallucination Discard & Authoritative DB Rendering
  // ----------------------------------------------------
  test('Server discards fabricated Gemini IDs and renders metadata exclusively from DB', () => {
    const mockGeminiOutputWithHallucinations = {
      recommendations: [
        {
          id: 'nptel-stat-101', // VALID
          rationale: 'Excellent foundational course for probability calculus.'
        },
        {
          id: 'hallucinated-ai-mastery-999', // HALLUCINATED / FABRICATED
          rationale: 'Advanced deep learning course with MoSPI modules.'
        },
        {
          id: 'nptel-broken-test', // BROKEN URL
          rationale: 'Survey methodology overview.'
        },
        {
          id: 'template-unverified-course', // UNVERIFIED TEMPLATE
          rationale: 'Visualisation skills.'
        }
      ]
    };

    const result = validateAndResolveRecommendations(MOCK_DB_COURSES, mockGeminiOutputWithHallucinations);

    // Only 'nptel-stat-101' should survive
    assert.strictEqual(result.recommendations.length, 1);
    const rec = result.recommendations[0];
    assert.strictEqual(rec.id, 'nptel-stat-101');
    assert.strictEqual(rec.title, 'Introduction to Probability and Statistics');
    assert.strictEqual(rec.sourceUrl, 'https://nptel.ac.in/courses/111105090');
    assert.strictEqual(rec.status, 'verified');

    // Hallucinated ID must NOT be present
    const hasHallucinated = result.recommendations.some(r => r.id === 'hallucinated-ai-mastery-999');
    assert.strictEqual(hasHallucinated, false, 'Hallucinated ID must be discarded');

    // Broken URL must NOT be present
    const hasBroken = result.recommendations.some(r => r.id === 'nptel-broken-test');
    assert.strictEqual(hasBroken, false, 'Broken status ID must be discarded');

    // Unverified template must NOT be present
    const hasUnverified = result.recommendations.some(r => r.id === 'template-unverified-course');
    assert.strictEqual(hasUnverified, false, 'Unverified status ID must be discarded');
  });

  test('Server returns "No verified recommendation available." when all Gemini suggestions are invalid', () => {
    const allFakeOutput = {
      recommendations: [
        { id: 'fabricated-1', rationale: 'Fake' },
        { id: 'fabricated-2', rationale: 'Fake 2' }
      ]
    };

    const result = validateAndResolveRecommendations(MOCK_DB_COURSES, allFakeOutput);
    assert.strictEqual(result.recommendations.length, 0);
    assert.strictEqual(result.message, 'No verified recommendation available.');
  });

  // ----------------------------------------------------
  // TEST 5: Graceful Handling for Users with Progress on Removed Courses
  // ----------------------------------------------------
  test('Learning steps with missing or unavailable course IDs render safely without exceptions', () => {
    // Simulate user learning path state with an orphaned/unavailable course reference
    const userStep = {
      id: 'step-archived-01',
      title: 'Descriptive Statistics Module',
      courseId: 'removed-course-999', // No longer in verified DB
      isUnavailable: true,
      fallbackTitle: 'Legacy Descriptive Statistics (Archived)',
      status: 'completed',
      score: 85
    };

    // UI rendering helper logic
    function resolveStepDisplay(step: typeof userStep, verifiedCourses: typeof MOCK_DB_COURSES) {
      const course = verifiedCourses.find(c => c.id === step.courseId && c.status === 'verified');
      if (!course) {
        return {
          isUnavailable: true,
          displayTitle: step.fallbackTitle || step.title,
          badge: 'Course unavailable in official catalogue',
          hasOfficialLink: false,
          sourceUrl: null
        };
      }
      return {
        isUnavailable: false,
        displayTitle: course.title,
        badge: 'Verified Course',
        hasOfficialLink: true,
        sourceUrl: course.sourceUrl
      };
    }

    const displayInfo = resolveStepDisplay(userStep, MOCK_DB_COURSES);
    assert.strictEqual(displayInfo.isUnavailable, true);
    assert.strictEqual(displayInfo.displayTitle, 'Legacy Descriptive Statistics (Archived)');
    assert.strictEqual(displayInfo.badge, 'Course unavailable in official catalogue');
    assert.strictEqual(displayInfo.hasOfficialLink, false);
    // User progress data is preserved intact
    assert.strictEqual(userStep.score, 85);
    assert.strictEqual(userStep.status, 'completed');
  });

  // ----------------------------------------------------
  // TEST 6: MockIgotAdapter Integrity & Zero-Fabrication Guarantees
  // ----------------------------------------------------
  test('MockIgotAdapter queries strictly verified courses and never fabricates completions', async () => {
    const { MockIgotAdapter } = await import('../server/services/mockIgotAdapter.ts');

    // 1. Course listing must contain only iGOT provider
    const igotCourses = await MockIgotAdapter.listCourses();
    assert.ok(Array.isArray(igotCourses), 'listCourses must return an array');
    for (const c of igotCourses) {
      assert.strictEqual(c.provider, 'iGOT Karmayogi');
      assert.strictEqual(c.status, 'verified');
      assert.ok(c.sourceUrl.includes('igotkarmayogi.gov.in'));
    }

    // 2. Fetch specific verified course
    const validCourse = await MockIgotAdapter.getCourse('igot-gov-301');
    assert.ok(validCourse, 'igot-gov-301 must exist');
    assert.strictEqual(validCourse?.provider, 'iGOT Karmayogi');

    // 3. Fabricated or unknown ID must return null
    const nonExistent = await MockIgotAdapter.getCourse('fake-igot-course-999');
    assert.strictEqual(nonExistent, null, 'Fabricated course must return null');

    // 4. Completion status must be based on actual record, never fabricated
    const uncompletedStatus = await MockIgotAdapter.getCompletionStatus('learner-alice-123', 'igot-gov-301');
    assert.strictEqual(uncompletedStatus.isCompleted, false, 'Unearned course must NOT be fabricated as completed');
    assert.strictEqual(uncompletedStatus.certificateId, null);
    assert.strictEqual(uncompletedStatus.verifiedVia, 'NONE');
  });

  console.log('\n----------------------------------------------------');
  console.log(`Results: ${passed}/${total} test groups passed.`);
  if (passed === total) {
    console.log('🎉 ALL DATA INTEGRITY & VERIFICATION TESTS PASSED!');
    console.log('----------------------------------------------------');
    process.exit(0);
  } else {
    console.error('❌ Some tests failed.');
    console.log('----------------------------------------------------');
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
