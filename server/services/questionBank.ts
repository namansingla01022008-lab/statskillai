export interface AuthoritativeQuestion {
  id: string;
  domain: 'Statistical' | 'Technical' | 'Digital' | 'Behavioural';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  skillTag: string;
}

export const QUESTION_SET_VERSION = 'v1';

export const AUTHORITATIVE_QUESTIONS: AuthoritativeQuestion[] = [
  // --- Statistical Domain ---
  {
    id: 'off-stat-e1',
    domain: 'Statistical',
    difficulty: 'Easy',
    question: 'Which of the following sampling techniques gives every member of the population a known and equal non-zero chance of selection?',
    options: [
      'Simple Random Sampling without Replacement',
      'Quota Sampling',
      'Convenience Sampling',
      'Snowball Sampling',
    ],
    correctIndex: 0,
    explanation: 'Simple Random Sampling (SRS) gives every unit in the sampling frame equal inclusion probability.',
    skillTag: 'Sampling Theory',
  },
  {
    id: 'off-stat-e2',
    domain: 'Statistical',
    difficulty: 'Easy',
    question: 'In descriptive statistics, which measure of central tendency is least sensitive to extreme outliers?',
    options: ['Arithmetic Mean', 'Median', 'Variance', 'Mid-range'],
    correctIndex: 1,
    explanation: 'The median represents the positional middle value and is robust against extreme outliers.',
    skillTag: 'Descriptive Statistics',
  },
  {
    id: 'off-stat-e3',
    domain: 'Statistical',
    difficulty: 'Easy',
    question: 'Which primary organization under MoSPI conducts nationwide socio-economic household sample surveys in India?',
    options: [
      'National Sample Survey Office (NSSO)',
      'Central Board of Indirect Taxes',
      'Geological Survey of India',
      'Election Commission of India',
    ],
    correctIndex: 0,
    explanation: 'The NSSO (under NSO/MoSPI) conducts multi-subject socio-economic household surveys.',
    skillTag: 'Official Statistics',
  },
  {
    id: 'off-stat-m1',
    domain: 'Statistical',
    difficulty: 'Medium',
    question: 'In stratified multistage sampling for rural household surveys in India, what is typically selected as the Primary Sampling Unit (PSU)?',
    options: [
      'The individual household member',
      'The revenue census village',
      'The private agricultural plot',
      'The postal pin-code boundary only',
    ],
    correctIndex: 1,
    explanation: 'In standard NSS rural surveys, Census revenue villages serve as Primary Sampling Units (PSUs).',
    skillTag: 'Survey Design',
  },
  {
    id: 'off-stat-m2',
    domain: 'Statistical',
    difficulty: 'Medium',
    question: 'When conducting hypothesis testing, what does a p-value of 0.02 indicate at a significance level (alpha) of 0.05?',
    options: [
      'Fail to reject the null hypothesis because 0.02 < 0.05',
      'Reject the null hypothesis as the observed result is statistically significant',
      'The null hypothesis is 98% true',
      'The test power is insufficient and must be discarded',
    ],
    correctIndex: 1,
    explanation: 'Since p-value (0.02) < alpha (0.05), we reject the null hypothesis in favour of the alternative.',
    skillTag: 'Hypothesis Testing',
  },
  {
    id: 'off-stat-h1',
    domain: 'Statistical',
    difficulty: 'Hard',
    question: 'What is the "Design Effect" (DEFF) in complex survey estimation?',
    options: [
      'The ratio of the variance under the complex survey design to the variance under simple random sampling of identical size',
      'The proportion of questionnaires lost during field operations',
      'The cost reduction achieved by using digital tablets instead of paper',
      'The ratio between standard deviation and mean in an exponential curve',
    ],
    correctIndex: 0,
    explanation: 'DEFF is the ratio of variance of an estimator under a complex design to the variance under simple random sampling of equivalent size.',
    skillTag: 'Variance Estimation',
  },

  // --- Technical Domain ---
  {
    id: 'off-tech-e1',
    domain: 'Technical',
    difficulty: 'Easy',
    question: 'In relational databases (SQL), which clause is used to filter records after aggregation with a GROUP BY statement?',
    options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
    correctIndex: 1,
    explanation: 'The HAVING clause was added to SQL because the WHERE keyword could not be used with aggregate functions.',
    skillTag: 'SQL Databases',
  },
  {
    id: 'off-tech-e2',
    domain: 'Technical',
    difficulty: 'Easy',
    question: 'In Python pandas library, which method is used to inspect summary statistics (mean, std, min, max) of numeric dataframe columns?',
    options: ['df.info()', 'df.describe()', 'df.summary()', 'df.head()'],
    correctIndex: 1,
    explanation: 'df.describe() computes descriptive statistical summaries of numerical features.',
    skillTag: 'Python Data Science',
  },
  {
    id: 'off-tech-m1',
    domain: 'Technical',
    difficulty: 'Medium',
    question: 'Which index type in PostgreSQL is best suited for accelerating equality comparisons on large foreign key lookup columns?',
    options: ['B-Tree Index', 'GIN Index', 'BRIN Index', 'GiST Index'],
    correctIndex: 0,
    explanation: 'B-Tree is the default PostgreSQL index, optimal for equality and range queries on scalar values.',
    skillTag: 'Database Indexing',
  },
  {
    id: 'off-tech-m2',
    domain: 'Technical',
    difficulty: 'Medium',
    question: 'What is the primary benefit of vectorization in NumPy compared to native Python for-loops?',
    options: [
      'Compiles loops into parallelized C/SIMD instructions, eliminating Python interpreter overhead',
      'Compresses memory by converting floating points to 8-bit integers',
      'Encrypts data arrays in system RAM',
      'Allows arrays to have dynamic heterogeneous types',
    ],
    correctIndex: 0,
    explanation: 'NumPy vectorization leverages compiled C routines and SIMD CPU vector extensions for orders-of-magnitude faster computation.',
    skillTag: 'NumPy Optimization',
  },
  {
    id: 'off-tech-h1',
    domain: 'Technical',
    difficulty: 'Hard',
    question: 'In distributed data pipelines, what guarantees "idempotency" when writing batch transformations to an analytical lakehouse?',
    options: [
      'Atomic upsert (MERGE INTO) using a deterministic natural business key or unique mutationId',
      'Appending records continuously without checking previous keys',
      'Increasing consumer timeout windows to 24 hours',
      'Running transformations exclusively on a single worker node',
    ],
    correctIndex: 0,
    explanation: 'Atomic MERGE operations keyed on deterministic idempotency identifiers guarantee identical end state regardless of replay frequency.',
    skillTag: 'Data Engineering',
  },

  // --- Digital Domain ---
  {
    id: 'off-dig-e1',
    domain: 'Digital',
    difficulty: 'Easy',
    question: 'Under India’s Digital Personal Data Protection (DPDP) Act 2023, what is an entity that determines the purpose and means of processing personal data termed?',
    options: ['Data Principal', 'Data Fiduciary', 'Data Processor', 'Data Auditor'],
    correctIndex: 1,
    explanation: 'A Data Fiduciary is the legal entity that determines the purpose and means of personal data processing under the DPDP Act 2023.',
    skillTag: 'DPDP Compliance',
  },
  {
    id: 'off-dig-e2',
    domain: 'Digital',
    difficulty: 'Easy',
    question: 'Which of the following is a foundational component of India Stack for digital identity verification?',
    options: ['Aadhaar / e-KYC', 'BHIM UPI', 'DigiLocker', 'FASTag'],
    correctIndex: 0,
    explanation: 'Aadhaar e-KYC forms the identity layer of India Stack.',
    skillTag: 'India Stack & DPI',
  },
  {
    id: 'off-dig-m1',
    domain: 'Digital',
    difficulty: 'Medium',
    question: 'In digital public infrastructure (DPI), what architectural design pattern ensures interoperability without vendor lock-in?',
    options: [
      'Open specifications, minimalist protocol APIs, and decentralized participant registries (e.g. Beckn protocol)',
      'A proprietary monolithic centralized database managed by a single vendor',
      'Closed source mobile applications distributed only through private enterprise MDMs',
      'Restricting network protocols strictly to offline manual pen-drives',
    ],
    correctIndex: 0,
    explanation: 'Open API specifications and federated architectures enable modular, vendor-neutral ecosystem interoperability.',
    skillTag: 'Open Digital Architecture',
  },
  {
    id: 'off-dig-m2',
    domain: 'Digital',
    difficulty: 'Medium',
    question: 'In India’s Data Empowerment and Protection Architecture (DEPA), what role does an Account Aggregator (AA) perform?',
    options: [
      'Acts as a consent manager to facilitate encrypted, user-approved data sharing without seeing the data payload',
      'Stores citizen bank passwords on a central government mainframe',
      'Acts as a credit rating agency that determines interest rates',
      'Deletes citizen identity documents after 30 days',
    ],
    correctIndex: 0,
    explanation: 'Account Aggregators are consent-driven data blind pipelines that facilitate seamless, encrypted data transfer with explicit user authorization.',
    skillTag: 'DEPA Architecture',
  },
  {
    id: 'off-dig-h1',
    domain: 'Digital',
    difficulty: 'Hard',
    question: 'What is the primary cryptographic purpose of a Content Security Policy (CSP) nonce in modern web applications?',
    options: [
      'Ensures only cryptographically tagged server-generated scripts can execute, preventing Cross-Site Scripting (XSS)',
      'Encrypts network packets over TLS 1.3',
      'Speeds up service worker file downloads by 50%',
      'Stores passwords in the browser cache storage',
    ],
    correctIndex: 0,
    explanation: 'A cryptographic nonce allows execution of explicit inline scripts matching a per-request random token, blocking injected XSS.',
    skillTag: 'Web App Security',
  },

  // --- Behavioural Domain ---
  {
    id: 'off-beh-e1',
    domain: 'Behavioural',
    difficulty: 'Easy',
    question: 'In public administration and civil service delivery, what is the primary objective of citizen-centric grievance redressal portals (such as CPGRAMS)?',
    options: [
      'To provide timely, transparent, and accountable resolution of citizen grievances against public authorities',
      'To penalize citizens who lodge inquiries',
      'To replace civil court hearings entirely',
      'To archive citizen feedback without taking action',
    ],
    correctIndex: 0,
    explanation: 'Citizen-centric grievance platforms provide structured, transparent resolution mechanisms for public service accountability.',
    skillTag: 'Public Accountability',
  },
  {
    id: 'off-beh-e2',
    domain: 'Behavioural',
    difficulty: 'Easy',
    question: 'Which behavior best fosters "psychological safety" in a high-performing analytical project team?',
    options: [
      'Encouraging open questions, constructive disagreement, and treating errors as learning opportunities',
      'Assigning public blame whenever a statistical model is imperfect',
      'Discouraging team members from voicing doubts during planning',
      'Restricting communication solely to top-down hierarchical directives',
    ],
    correctIndex: 0,
    explanation: 'Psychological safety is built when leaders embrace constructive inquiry and blameless post-mortems.',
    skillTag: 'Leadership & Teamwork',
  },
  {
    id: 'off-beh-m1',
    domain: 'Behavioural',
    difficulty: 'Medium',
    question: 'When communicating complex statistical findings with non-technical public policymakers, what is the most effective approach?',
    options: [
      'Translate statistical uncertainty into clear policy trade-offs, intuitive visual charts, and actionable executive takeaways',
      'Present raw R/Python code scripts directly to the cabinet committee',
      'Omit all nuances and claim 100% statistical certainty on all predictions',
      'Use obscure econometric jargon to impress the stakeholders',
    ],
    correctIndex: 0,
    explanation: 'Effective policy translation bridges quantitative rigor with intuitive, decision-oriented narratives and visual representations.',
    skillTag: 'Policy Communication',
  },
  {
    id: 'off-beh-m2',
    domain: 'Behavioural',
    difficulty: 'Medium',
    question: 'In public procurement and government contracting (e.g. Government e-Marketplace / GeM), which principle is paramount to preventing conflicts of interest?',
    options: [
      'Transparent competitive bidding, strict recusal where personal interest exists, and auditable evaluation criteria',
      'Awarding contracts directly to close family associates without tenders',
      'Refusing to publish vendor selection criteria',
      'Altering technical specifications after bidding has closed',
    ],
    correctIndex: 0,
    explanation: 'Public procurement ethics demand full disclosure, competitive transparency, and recusal to prevent conflicts of interest and maintain public trust.',
    skillTag: 'Ethics & Governance',
  },
  {
    id: 'off-beh-h1',
    domain: 'Behavioural',
    difficulty: 'Hard',
    question: 'In project governance, what does the Logical Framework Approach (LogFrame) establish?',
    options: [
      'A structured causal matrix linking inputs, activities, outputs, outcomes, and impact with verifiable indicators and risk assumptions',
      'A software compiler rule that rejects boolean logic flaws',
      'An automated spreadsheet formula for calculating employee payroll deductions',
      'A contract negotiation template between vendors',
    ],
    correctIndex: 0,
    explanation: 'A LogFrame is a systematic management tool used to design, monitor, and evaluate projects through a clear causal hierarchy.',
    skillTag: 'Project Governance',
  },
];

/**
 * Returns a sanitized question set containing question text and options ONLY.
 * Strips correctIndex, explanation, and any answer keys.
 */
export function getSanitizedPreloadedQuestions(): Array<{
  id: string;
  domain: string;
  difficulty: string;
  question: string;
  options: string[];
}> {
  return AUTHORITATIVE_QUESTIONS.map((q) => ({
    id: q.id,
    domain: q.domain,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options,
  }));
}

/**
 * Validates and re-scores an offline assessment attempt against authoritative keys.
 * Server never trusts any client-provided score.
 */
export function scoreOfflineAttempt(params: {
  domain: string;
  questionSetVersion: string;
  answers: Array<{ questionId: string; selectedOption: number; answeredAt?: string }>;
  startedAt: string;
  submittedAt: string;
}): {
  valid: boolean;
  error?: string;
  score: number;
  earnedWeight: number;
  maxWeight: number;
  questionRecords: any[];
  userAnswers: number[];
} {
  const { domain, questionSetVersion, answers, startedAt, submittedAt } = params;

  if (questionSetVersion !== QUESTION_SET_VERSION) {
    return {
      valid: false,
      error: `Invalid question set version "${questionSetVersion}". Expected "${QUESTION_SET_VERSION}".`,
      score: 0,
      earnedWeight: 0,
      maxWeight: 0,
      questionRecords: [],
      userAnswers: [],
    };
  }

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return {
      valid: false,
      error: 'Empty answers array.',
      score: 0,
      earnedWeight: 0,
      maxWeight: 0,
      questionRecords: [],
      userAnswers: [],
    };
  }

  const startMs = new Date(startedAt).getTime();
  const submitMs = new Date(submittedAt).getTime();
  const nowMs = Date.now();

  // 1. Sanity check: submittedAt in future (allow 60s clock skew) or older than 7 days
  if (submitMs > nowMs + 60000) {
    return {
      valid: false,
      error: 'Rejected attempt: submittedAt timestamp is in the future.',
      score: 0,
      earnedWeight: 0,
      maxWeight: 0,
      questionRecords: [],
      userAnswers: [],
    };
  }

  if (nowMs - submitMs > 7 * 24 * 60 * 60 * 1000) {
    return {
      valid: false,
      error: 'Rejected attempt: submittedAt is older than 7 days.',
      score: 0,
      earnedWeight: 0,
      maxWeight: 0,
      questionRecords: [],
      userAnswers: [],
    };
  }

  // 2. Sanity check: timing plausibility (min 1 second per question on average)
  const durationMs = submitMs - startMs;
  if (durationMs > 0 && durationMs / answers.length < 1000) {
    return {
      valid: false,
      error: 'Rejected attempt: Implausible completion speed (less than 1s per question average).',
      score: 0,
      earnedWeight: 0,
      maxWeight: 0,
      questionRecords: [],
      userAnswers: [],
    };
  }

  // 3. Score against authoritative answer key
  const difficultyWeights: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
  let earnedWeight = 0;
  let maxWeight = 0;
  let correctCount = 0;

  const questionRecords: any[] = [];
  const userAnswers: number[] = [];

  for (const item of answers) {
    const authQuestion = AUTHORITATIVE_QUESTIONS.find((q) => q.id === item.questionId);
    if (!authQuestion) {
      return {
        valid: false,
        error: `Unknown questionId "${item.questionId}".`,
        score: 0,
        earnedWeight: 0,
        maxWeight: 0,
        questionRecords: [],
        userAnswers: [],
      };
    }

    const weight = difficultyWeights[authQuestion.difficulty] || 1;
    maxWeight += weight;

    const isCorrect = item.selectedOption === authQuestion.correctIndex;
    if (isCorrect) {
      earnedWeight += weight;
      correctCount++;
    }

    userAnswers.push(item.selectedOption);
    questionRecords.push({
      id: authQuestion.id,
      domain: authQuestion.domain,
      difficulty: authQuestion.difficulty,
      question: authQuestion.question,
      options: authQuestion.options,
      correctIndex: authQuestion.correctIndex,
      explanation: authQuestion.explanation,
      skillTag: authQuestion.skillTag,
    });
  }

  // Weighted score bounded 0 to 100
  const score = maxWeight > 0 ? Math.round((earnedWeight / maxWeight) * 100) : 0;

  return {
    valid: true,
    score,
    earnedWeight,
    maxWeight,
    questionRecords,
    userAnswers,
  };
}

