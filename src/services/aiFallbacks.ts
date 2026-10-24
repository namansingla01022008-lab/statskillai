import {
  DomainType,
  DifficultyLevel,
  QuestionRecord,
  LearnerProfile,
  GapAnalysis,
  LearningPath,
  LearningStep,
  Course,
  AdminAnalyticsInsight,
} from '../types';
import { calculateOverallScore } from '../constants/competency';

export const FALLBACK_QUESTIONS: Record<DomainType, Record<DifficultyLevel, QuestionRecord[]>> = {
  Statistical: {
    Easy: [
      {
        id: 'fb-stat-e1',
        question: 'Which of the following sampling techniques gives every member of the population a known and equal non-zero chance of selection?',
        options: [
          'Simple Random Sampling without Replacement',
          'Quota Sampling',
          'Convenience Sampling',
          'Snowball Sampling',
        ],
        correctIndex: 0,
        explanation: 'Simple Random Sampling (SRS) ensures that each unit in the sampling frame has an equal probability of inclusion, eliminating selection bias.',
        difficulty: 'Easy',
        skillTag: 'Sampling Theory',
      },
      {
        id: 'fb-stat-e2',
        question: 'In descriptive statistics, which measure of central tendency is least sensitive to extreme outliers?',
        options: ['Arithmetic Mean', 'Median', 'Variance', 'Mid-range'],
        correctIndex: 1,
        explanation: 'The median represents the positional middle value of an ordered distribution and is robust against extreme skewed outliers, unlike the mean.',
        difficulty: 'Easy',
        skillTag: 'Descriptive Statistics',
      },
      {
        id: 'fb-stat-e3',
        question: 'Which primary organization under MoSPI conducts nationwide socio-economic household sample surveys in India?',
        options: [
          'National Sample Survey Office (NSSO)',
          'Central Board of Indirect Taxes',
          'Geological Survey of India',
          'Election Commission of India',
        ],
        correctIndex: 0,
        explanation: 'The NSSO (now part of NSO under MoSPI) is the premier agency mandated to execute periodic large-scale multi-subject household surveys across India.',
        difficulty: 'Easy',
        skillTag: 'Official Statistics',
      },
    ],
    Medium: [
      {
        id: 'fb-stat-m1',
        question: 'In stratified multistage sampling for rural household surveys, what is typically selected as the Primary Sampling Unit (PSU)?',
        options: [
          'The individual household member',
          'The revenue census village',
          'The private agricultural plot',
          'The postal pin-code boundary only',
        ],
        correctIndex: 1,
        explanation: 'In standard NSS rural survey design, revenue villages as demarcated by the Census of India serve as the Primary Sampling Units (PSUs), followed by hamlet-group selection.',
        difficulty: 'Medium',
        skillTag: 'Survey Design',
      },
      {
        id: 'fb-stat-m2',
        question: 'When conducting hypothesis testing, what does a p-value of 0.02 indicate at a significance level (alpha) of 0.05?',
        options: [
          'Fail to reject the null hypothesis because 0.02 < 0.05',
          'Reject the null hypothesis as the observed result is statistically significant',
          'The null hypothesis is 98% true',
          'The test power is insufficient and must be discarded',
        ],
        correctIndex: 1,
        explanation: 'Since the p-value (0.02) is less than alpha (0.05), we reject the null hypothesis in favour of the alternative hypothesis.',
        difficulty: 'Medium',
        skillTag: 'Hypothesis Testing',
      },
      {
        id: 'fb-stat-m3',
        question: 'What is the "Design Effect" (DEFF) in complex survey estimation?',
        options: [
          'The ratio of the variance under the complex survey design to the variance under simple random sampling of identical size',
          'The proportion of questionnaires lost during field operations',
          'The cost reduction achieved by using digital tablets instead of paper',
          'The ratio between standard deviation and mean in an exponential curve',
        ],
        correctIndex: 0,
        explanation: 'DEFF measures how much the variance of an estimator is inflated due to clustering and stratification compared to an equivalent simple random sample.',
        difficulty: 'Medium',
        skillTag: 'Variance Estimation',
      },
    ],
    Hard: [
      {
        id: 'fb-stat-h1',
        question: 'Under unequal probability sampling without replacement, which unbiased estimator uses inclusion probabilities (π_i) to estimate the population total?',
        options: [
          'Horvitz-Thompson Estimator',
          'Laplace Smoothing Kernel',
          'Ordinary Least Squares Unweighted Sum',
          'Kalman Filter Prior',
        ],
        correctIndex: 0,
        explanation: 'The Horvitz-Thompson estimator calculates Y_hat = sum(y_i / π_i) and is the foundational design-unbiased estimator for sampling with varying selection probabilities.',
        difficulty: 'Hard',
        skillTag: 'Advanced Sampling',
      },
      {
        id: 'fb-stat-h2',
        question: 'In non-sampling error adjustment, how does Item Non-Response differ from Unit Non-Response, and how is it most rigorously treated in official statistics?',
        options: [
          'Item non-response implies refusal of an entire schedule; treated by weight reallocation',
          'Item non-response is the omission of specific variables in an otherwise completed schedule; typically treated via donor imputation or regression imputation',
          'Item non-response only happens in digital tablets; treated by deleting the survey record',
          'Both are mathematically identical and treated exclusively by dropping the PSU',
        ],
        correctIndex: 1,
        explanation: 'Item non-response occurs when specific questionnaire fields are missing. Standard official statistical practice uses methods such as nearest-neighbour hot-deck or regression imputation to maintain sample size.',
        difficulty: 'Hard',
        skillTag: 'Data Quality & Imputation',
      },
    ],
  },
  Technical: {
    Easy: [
      {
        id: 'fb-tech-e1',
        question: 'In SQL database queries, which clause is used to filter records after aggregation with GROUP BY?',
        options: ['WHERE', 'HAVING', 'ORDER BY', 'LIMIT'],
        correctIndex: 1,
        explanation: 'The HAVING clause filters grouped records based on aggregated conditions, whereas WHERE filters individual rows before grouping.',
        difficulty: 'Easy',
        skillTag: 'SQL',
      },
      {
        id: 'fb-tech-e2',
        question: 'Which Python data library is standard for tabular data manipulation, dataframe operations, and reading CSV microdata?',
        options: ['pandas', 'pygame', 'Tkinter', 'matplotlib'],
        correctIndex: 0,
        explanation: 'pandas is the industry and scientific benchmark library in Python for structured tabular data analysis and ETL manipulation.',
        difficulty: 'Easy',
        skillTag: 'Python',
      },
    ],
    Medium: [
      {
        id: 'fb-tech-m1',
        question: 'What is the average time complexity of searching an element in a balanced binary search tree (such as an AVL or Red-Black tree)?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctIndex: 1,
        explanation: 'Because balanced BSTs maintain a height proportional to log(n), comparison and search take O(log n) time in the worst and average cases.',
        difficulty: 'Medium',
        skillTag: 'Algorithms',
      },
      {
        id: 'fb-tech-m2',
        question: 'In relational database normalization, what distinguishes Third Normal Form (3NF) from Second Normal Form (2NF)?',
        options: [
          '3NF eliminates transitive functional dependencies of non-key attributes on the primary key',
          '3NF allows duplicate rows for faster query performance',
          '3NF prohibits any foreign key constraints',
          '3NF requires all text columns to be encrypted',
        ],
        correctIndex: 0,
        explanation: 'A table is in 3NF if it is in 2NF and has no transitive dependencies: every non-prime attribute must depend directly on the candidate key.',
        difficulty: 'Medium',
        skillTag: 'Database Architecture',
      },
    ],
    Hard: [
      {
        id: 'fb-tech-h1',
        question: 'In distributed data processing with Apache Spark, what is the primary architectural cause of "data skew" during a wide shuffle transformation (e.g. groupBy)?',
        options: [
          'Unequal distribution of partitioning keys leading to an individual worker task processing a disproportionately massive chunk',
          'Incompatible RAM speeds across physical server nodes',
          'Failure of the garbage collector in the Spark Driver JVM',
          'Excessive utilization of broadcast variables',
        ],
        correctIndex: 0,
        explanation: 'Data skew happens when certain partition keys have vastly more rows than others. During shuffles, one task hangs processing the heavy key while others idle.',
        difficulty: 'Hard',
        skillTag: 'Distributed Computing',
      },
    ],
  },
  Digital: {
    Easy: [
      {
        id: 'fb-dig-e1',
        question: 'What is the core purpose of India’s DigiLocker public digital infrastructure?',
        options: [
          'Paperless issuance, verification, and storage of legally valid digital credentials',
          'Mining cryptocurrency using sovereign supercomputers',
          'Replacing commercial credit cards for consumer payments',
          'Streaming official television channels',
        ],
        correctIndex: 0,
        explanation: 'DigiLocker is a foundational element of Digital India that enables citizens to access verified electronic documents directly from issuing repositories.',
        difficulty: 'Easy',
        skillTag: 'India Stack',
      },
      {
        id: 'fb-dig-e2',
        question: 'In digital cybersecurity hygiene, what does "Multi-Factor Authentication" (MFA) enforce?',
        options: [
          'Requiring two or more distinct verification credentials before granting access',
          'Entering the same password twice consecutively',
          'Changing passwords every 48 hours without exception',
          'Restricting login to a single desktop monitor',
        ],
        correctIndex: 0,
        explanation: 'MFA combines something you know (password), something you have (token/device), or something you are (biometrics) to mitigate credential compromise.',
        difficulty: 'Easy',
        skillTag: 'Cybersecurity',
      },
    ],
    Medium: [
      {
        id: 'fb-dig-m1',
        question: 'Under India’s Digital Personal Data Protection (DPDP) Act, who is legally designated as a "Data Fiduciary"?',
        options: [
          'Any individual or entity that determines the purpose and means of processing personal data',
          'The internet service provider delivering fiber connectivity',
          'The consumer whose data is collected',
          'The hardware manufacturer of the database server',
        ],
        correctIndex: 0,
        explanation: 'A Data Fiduciary is the entity (ministry, enterprise, company) that determines why and how personal data is processed and bears statutory compliance duty.',
        difficulty: 'Medium',
        skillTag: 'Data Privacy & DPDP',
      },
      {
        id: 'fb-dig-m2',
        question: 'Which enterprise protocol is the national standard for the electronic filing and workflow management system used in Government of India ministries?',
        options: ['e-Office', 'Lotus Notes 4', 'BitTorrent Sync', 'IRC Relay'],
        correctIndex: 0,
        explanation: 'e-Office, designed by NIC, is the sovereign standard for transparent, auditable paperless file management across central and state secretariats.',
        difficulty: 'Medium',
        skillTag: 'E-Governance',
      },
    ],
    Hard: [
      {
        id: 'fb-dig-h1',
        question: 'In Digital Public Infrastructure architectures, how does the Account Aggregator (AA) framework preserve citizen privacy during financial or statistical consent verification?',
        options: [
          'Data flows in an end-to-end encrypted pipeline where the intermediary AA cannot decrypt, read, or store customer financial data',
          'All data is stored in a single central master database controlled by commercial banks',
          'By stripping citizen identifiers and replacing them with unverified manual affidavits',
          'Consent is granted perpetually without any revocation mechanism',
        ],
        correctIndex: 0,
        explanation: 'Account Aggregators operate as "data-blind" consent brokers: encrypted data moves directly from the Financial Information Provider (FIP) to the Financial Information User (FIU).',
        difficulty: 'Hard',
        skillTag: 'DPI Architecture',
      },
    ],
  },
  Behavioural: {
    Easy: [
      {
        id: 'fb-beh-e1',
        question: 'What is the primary role of the Centralised Public Grievance Redress and Monitoring System (CPGRAMS) in Indian public administration?',
        options: [
          'An online portal allowing citizens to lodge grievances round-the-clock for time-bound resolution by government authorities',
          'A tax assessment calculation tool for commercial banks',
          'An annual confidential appraisal rating software for junior officers',
          'A military logistics procurement database',
        ],
        correctIndex: 0,
        explanation: 'CPGRAMS enables citizens to submit administrative grievances across central and state ministries, ensuring accountability and monitoring.',
        difficulty: 'Easy',
        skillTag: 'Citizen Grievance & Empathy',
      },
      {
        id: 'fb-beh-e2',
        question: 'In professional team collaboration, which practice fosters high psychological safety in analytical project teams?',
        options: [
          'Encouraging open discussion of technical errors without punitive retaliation',
          'Penalizing team members for questioning established assumptions',
          'Silencing junior staff during methodology reviews',
          'Restricting peer code review to managers only',
        ],
        correctIndex: 0,
        explanation: 'Psychological safety allows members to voice doubts, challenge hypotheses, and acknowledge data discrepancies without fear of embarrassment.',
        difficulty: 'Easy',
        skillTag: 'Team Collaboration',
      },
    ],
    Medium: [
      {
        id: 'fb-beh-m1',
        question: 'When an officer or analyst encounters a potential conflict of interest between private consultancies and public policy evaluation, what is the required ethical action?',
        options: [
          'Formally disclose the conflict in writing to superiors and recuse oneself from evaluation decisions',
          'Proceed quietly while hoping no external auditor notices',
          'Accelerate the contract approval before leaving the department',
          'Transfer the private consultancy into a close relative\'s name without disclosure',
        ],
        correctIndex: 0,
        explanation: 'Public service ethics require immediate written declaration and recusal to uphold integrity and institutional trust.',
        difficulty: 'Medium',
        skillTag: 'Public Leadership & Ethics',
      },
      {
        id: 'fb-beh-m2',
        question: 'In evidence-based policy communication, how should statistical uncertainty (such as standard errors and confidence intervals) be presented to executive decision-makers?',
        options: [
          'Transparently contextualized in plain language alongside actionable risk trade-offs',
          'Concealed completely to make the recommendation seem infallible',
          'Overloaded with unexplained mathematical formulas to avoid questions',
          'Deferred until after policy enactment is completed',
        ],
        correctIndex: 0,
        explanation: 'Integrity in statistical communication requires lucidly explaining confidence margins so policymakers understand practical risks.',
        difficulty: 'Medium',
        skillTag: 'Executive Briefing',
      },
    ],
    Hard: [
      {
        id: 'fb-beh-h1',
        question: 'Under the Results-Based Management (RBM) and Logical Framework Approach (LogFrame), how is a project "Outcome" distinguished from an "Output"?',
        options: [
          'An Output is the immediate tangible deliverable produced, whereas an Outcome is the medium-term behavioral or institutional change resulting from that output',
          'Outputs refer only to physical construction, while outcomes are financial expenditures',
          'Outputs are measured by audits, whereas outcomes are never verified',
          'The two terms are synonymous in sovereign programme monitoring',
        ],
        correctIndex: 0,
        explanation: 'Outputs are activities completed (e.g. 5,000 enumerators trained); outcomes are the resulting change in state (e.g. 40% reduction in non-sampling survey errors).',
        difficulty: 'Hard',
        skillTag: 'Results-Based Monitoring',
      },
    ],
  },
};

export const FallbackService = {
  // Adaptive Question generator fallback
  getQuestion(
    domain: DomainType,
    difficulty: DifficultyLevel,
    previouslyAskedQuestions: string[]
  ): QuestionRecord {
    const list = FALLBACK_QUESTIONS[domain]?.[difficulty] || [];
    const unused = list.filter((q) => !previouslyAskedQuestions.includes(q.question));
    if (unused.length > 0) {
      return unused[0];
    }
    // Return any from the domain if all have been served
    return list[0] || {
      id: `fb-${domain}-${Date.now()}`,
      question: `Demonstration question assessing practical ${domain} competency at ${difficulty} level.`,
      options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: 'Deterministic offline evaluation: demonstrates adaptive scoring logic.',
      difficulty,
      skillTag: `${domain} Foundations`,
    };
  },

  // Deterministic Gap Analysis
  generateGapAnalysis(
    profile: LearnerProfile,
    assessmentScores: Record<DomainType, number>,
    targetScores: Record<DomainType, number>
  ): GapAnalysis {
    const strengths: string[] = [];
    const gaps: any[] = [];
    const priorityOrder: string[] = [];

    const domains: DomainType[] = ['Technical', 'Statistical', 'Digital', 'Behavioural'];

    domains.forEach((d) => {
      const score = assessmentScores[d] || 0;
      const target = targetScores[d] || 70;
      const diff = target - score;

      if (score >= target) {
        strengths.push(
          `Strong proficiency in ${d} competency (${score}/100), exceeding the ${target} target benchmark.`
        );
      } else {
        const severity = diff >= 20 ? 'High' : diff >= 10 ? 'Medium' : 'Low';
        let specificSkill = `${d} Core Practice`;
        if (d === 'Statistical') specificSkill = 'Survey Sampling & NSSO Methodologies';
        if (d === 'Technical') specificSkill = 'Database Engineering & Automated Data Pipelines';
        if (d === 'Digital') specificSkill = 'Digital Public Infrastructure & Data Privacy Standards';
        if (d === 'Behavioural') specificSkill = 'Public Leadership & Results-Based Project Monitoring';

        gaps.push({
          domain: d,
          skill: specificSkill,
          severity,
          reason: `Current score of ${score} is ${diff} points below your target of ${target}. Prioritized for ${profile.careerGoal}.`,
        });
        priorityOrder.push(specificSkill);
      }
    });

    if (priorityOrder.length === 0) {
      priorityOrder.push('Continuous Advanced Mentorship & Research Capstone');
    }

    const overallScore = calculateOverallScore(assessmentScores);

    const summary =
      gaps.length > 0
        ? `Analysis indicates foundational readiness with ${strengths.length} established competencies. Immediate intervention is required in ${gaps.map((g) => g.domain).join(' and ')} to align with your career goal.`
        : `Exceptional competency profile. All assessed domains satisfy benchmark standards. Recommended focus is capstone applied research and mentorship.`;

    return {
      id: `gap-${Date.now()}`,
      userId: profile.userId,
      timestamp: new Date().toISOString(),
      strengths,
      gaps,
      summary,
      priorityOrder,
      domainScores: assessmentScores,
      targetScores,
      overallScore,
    };
  },

  // Deterministic Learning Path
  generateLearningPath(
    profile: LearnerProfile,
    gaps: GapAnalysis['gaps'],
    courses: Course[]
  ): LearningPath {
    const steps: LearningStep[] = [];

    // Prioritize high severity gaps first
    const sortedGaps = [...gaps].sort((a, b) => {
      const weight = { High: 3, Medium: 2, Low: 1 };
      return weight[b.severity] - weight[a.severity];
    });

    sortedGaps.forEach((gap, idx) => {
      const matchingCourse = courses.find((c) => c.domain === gap.domain);
      if (matchingCourse) {
        steps.push({
          id: `step-${idx + 1}`,
          title: matchingCourse.title,
          domain: gap.domain,
          type: 'Course',
          estimatedDuration: matchingCourse.duration,
          source: matchingCourse.source,
          rationale: `Targeted module addressing your ${gap.severity} severity gap in ${gap.skill}.`,
          status: idx === 0 ? 'In progress' : 'Not started',
          courseId: matchingCourse.id,
        });
      }
    });

    // Add practical AI-suggested steps
    steps.push({
      id: `step-${steps.length + 1}`,
      title: 'Practical Lab: Microdata Extraction & Statistical Anonymization Exercise',
      domain: 'Statistical',
      type: 'Practice',
      estimatedDuration: '12 Hours',
      source: 'AI-suggested',
      rationale: 'Hands-on dataset scrubbing in compliance with national survey privacy guidelines.',
      status: 'Not started',
      isAiSuggested: true,
    });

    steps.push({
      id: `step-${steps.length + 1}`,
      title: 'Executive Policy Briefing & Stakeholder Communication Capstone',
      domain: 'Behavioural',
      type: 'Reading',
      estimatedDuration: '2 Weeks',
      source: 'SWAYAM',
      rationale: 'Translates statistical analytical outputs into actionable public policy memorandums.',
      status: 'Not started',
    });

    const completed = steps.filter((s) => s.status === 'Completed').length;
    const progressPercent = Math.round((completed / steps.length) * 100);

    return {
      id: `path-${Date.now()}`,
      userId: profile.userId,
      title: `Competency Enhancement Curriculum: ${profile.careerGoal.slice(0, 40)}...`,
      careerGoal: profile.careerGoal,
      steps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progressPercent,
      isCompleted: false,
    };
  },

  // Deterministic Quiz Generator from text/topic
  generateQuizQuestions(
    sampleText: string,
    count: number,
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed'
  ): QuestionRecord[] {
    const pool: QuestionRecord[] = [
      {
        id: 'quiz-q-1',
        question: 'Based on the provided curriculum and guidelines, what is the central objective of NEP-2020 regarding credit portability?',
        options: [
          'Enabling flexible academic mobility through the Academic Bank of Credits (ABC)',
          'Eliminating standard examinations entirely across all universities',
          'Restricting course selections strictly to a single faculty department',
          'Prohibiting digital certificates in favor of physical paper ledgers only',
        ],
        correctIndex: 0,
        explanation: 'NEP-2020 establishes the Academic Bank of Credits (ABC) to digitally store academic credits earned across recognised higher education institutions, facilitating multidisciplinary entry-exit pathways.',
        difficulty: 'Easy',
        skillTag: 'NEP-2020 Architecture',
      },
      {
        id: 'quiz-q-2',
        question: 'According to official survey documentation, what is a primary source of Non-Sampling Error in large-scale fieldwork?',
        options: [
          'Inaccurate respondent recall, interviewer bias, or measurement instrument defects',
          'The random mathematical fluctuation inherent in sampling frames',
          'Using calculators instead of mental arithmetic',
          'Surveying respondents during morning hours exclusively',
        ],
        correctIndex: 0,
        explanation: 'Non-sampling errors arise from data collection execution, respondent misunderstanding, coverage defects, and data entry errors rather than chance variation in sample choice.',
        difficulty: 'Medium',
        skillTag: 'Data Quality & Audit',
      },
      {
        id: 'quiz-q-3',
        question: 'Under the National Data Sharing and Accessibility Policy (NDSAP), how are public datasets classified for open portal access?',
        options: [
          'Open Access (shareable without restriction), Registered Access, and Restricted/Negative Access',
          'Only classified defense datasets may be published publicly',
          'All government data must be placed behind commercial paywalls',
          'Unclassified data is deleted after 30 days automatically',
        ],
        correctIndex: 0,
        explanation: 'NDSAP categorizes government data assets into Open, Registered, and Restricted lists to balance proactive citizen transparency with national security safeguards.',
        difficulty: 'Medium',
        skillTag: 'Open Data Governance',
      },
      {
        id: 'quiz-q-4',
        question: 'In statistical inference, what occurs when a researcher commits a Type I Error (False Positive)?',
        options: [
          'Rejecting a true null hypothesis',
          'Failing to reject a false null hypothesis',
          'Selecting a sample size that is too small',
          'Using the median instead of the mean',
        ],
        correctIndex: 0,
        explanation: 'A Type I error occurs when the test rejects a null hypothesis that is actually true in the underlying population (probability equal to alpha).',
        difficulty: 'Hard',
        skillTag: 'Inference Theory',
      },
      {
        id: 'quiz-q-5',
        question: 'Which principle governs the Digital Personal Data Protection (DPDP) Act regarding data collection limits?',
        options: [
          'Purpose Limitation: Personal data should only be collected to the extent necessary for the declared lawful purpose',
          'Unlimited archival storage of all citizen traffic without consent',
          'Free redistribution of government survey rosters to private marketing firms',
          'Exemption of all public sector enterprises from digital security audits',
        ],
        correctIndex: 0,
        explanation: 'The DPDP Act enforces purpose limitation and data minimization: entities may collect and retain personal data only for specific, explicit, and legitimate purposes consented to by the individual.',
        difficulty: 'Medium',
        skillTag: 'DPDP Compliance',
      },
    ];

    const result = pool.slice(0, count);
    while (result.length < count) {
      const idx = result.length + 1;
      result.push({
        id: `quiz-gen-${idx}`,
        question: `Question ${idx} (Grounded in uploaded document): What key insight or protocol is stipulated in the source text regarding public data verification?`,
        options: [
          'Standardized verification protocols ensure empirical integrity across administrative tiers.',
          'Data verification is optional and left to individual discretion.',
          'Verification should only occur if public complaints are received.',
          'External unverified sources should supersede administrative registers.',
        ],
        correctIndex: 0,
        explanation: 'Directly supported by the document’s emphasis on data validation and quality assurance.',
        difficulty: difficulty === 'Mixed' ? (idx % 2 === 0 ? 'Medium' : 'Easy') : difficulty,
        skillTag: 'Document Excerpt Analysis',
      });
    }

    return result;
  },

  // Deterministic Chat Assistant responses
  getChatResponse(query: string, lang: 'en' | 'hi'): string {
    const q = query.toLowerCase();

    if (lang === 'hi') {
      if (q.includes('sampling') || q.includes('नमूनाकरण') || q.includes('सांख्यिकी')) {
        return `**सांख्यिकीय नमूनाकरण (Survey Sampling) मार्गदर्शन:**
1. **मुख्य अवधारणाएँ:** सरल यादृच्छिक नमूनाकरण (SRS), स्तरीकृत नमूनाकरण (Stratified Sampling), और क्लस्टर नमूनाकरण की बुनियादी गणनाएँ समझें।
2. **अनुशंसित पाठ्यक्रम:** स्वयं (SWAYAM) पर 'Fundamentals of Survey Sampling & NSSO Methodologies' (आईआईटी कानपुर) और iGOT कर्मयोगी पर 'Official Statistics of India'।
3. **NEP-2020 क्रेडिट:** इन पाठ्यक्रमों के पूर्ण होने पर प्रमाण पत्र सीधे अकादमिक बैंक ऑफ क्रेडिट्स (ABC) में क्रेडिट पोर्टेबिलिटी के पात्र हैं।`;
      }
      return `**स्टेटस्किल-एआई अध्ययन सहायक:**
नमस्ते! मैं आपकी दक्षता प्रोफ़ाइल और एनईपी-2020 दिशा-निर्देशों के आधार पर सहायता के लिए उपस्थित हूँ।
- आपके लक्षित मानकों को प्राप्त करने के लिए अनुकूली मूल्यांकन (Adaptive Assessment) के परिणाम आपके डैशबोर्ड पर उपलब्ध हैं।
- आप स्वयं (SWAYAM), एनपीटीईएल (NPTEL) अथवा iGOT कर्मयोगी के प्रमाणित पाठ्यक्रमों से अपने अंतराल दूर कर सकते हैं।
कृपया बताएँ कि आप किस विषय अथवा पाठ्यक्रम के विषय में अधिक जानना चाहते हैं?`;
    }

    if (q.includes('sampling') || q.includes('statistics') || q.includes('survey')) {
      return `### Recommended Strategy for Statistical Competency
1. **Focus on Official Frameworks:** Review NSSO survey stratification standards and Horvitz-Thompson variance estimators.
2. **Core Course Recommendation:** Enroll in *Fundamentals of Survey Sampling & NSSO Methodologies* (SWAYAM / IIT Kanpur) or *Official Statistics of India* on iGOT Karmayogi.
3. **NEP-2020 Alignment:** SWAYAM course completion qualifies for credit transfer into your Academic Bank of Credits (ABC).
4. **Mentorship:** Dr. Anita Rao (ISI Advisory Board) is currently accepting mentorship inquiries regarding survey methodologies.`;
    }

    if (q.includes('nep') || q.includes('credit') || q.includes('abc')) {
      return `### NEP-2020 & Credit Portability Overview
- **Academic Bank of Credits (ABC):** NEP-2020 enables learners to bank verified course credits from SWAYAM, NPTEL, and recognized universities.
- **Multidisciplinary Pathways:** Allows science and humanities students to attain computational and official statistical credentials with full mobility.
- **Continuous Skilling:** Supports government employees under Mission Karmayogi for continuous competency progression.`;
    }

    return `### StatSkillAI Competency Guidance
Thank you for your inquiry. As an AI learning guide grounded in your profile and NEP-2020:
- **Assessment Review:** Please check your latest Adaptive Assessment scores. Focus on domains where your current score is below the 70 benchmark.
- **Curated Modules:** Check your **Personalised Learning Path** for sequential coursework on SWAYAM, NPTEL, and iGOT Karmayogi.
- **Verified Mentors:** Connect with verified domain practitioners in our Human Mentorship directory for personalized academic and career guidance.`;
  },

  // Deterministic Admin Insights
  generateAdminInsights(aggregateStats: any): AdminAnalyticsInsight {
    return {
      timestamp: new Date().toISOString(),
      executiveSummary: `Workforce competency audit across 5 operational departments indicates an overall institutional average score of ${aggregateStats.workforceAverageScore || 68}/100 with a ${aggregateStats.participationRate || 86}% active assessment participation rate. Priority intervention is recommended for automated statistical pipelines and data privacy assurance.`,
      keyFindings: [
        'Economic Statistics & Census and Data Analytics cells lead in statistical inference (averaging 78+ points), but demonstrate a 16-point deficit in distributed data pipelines.',
        'IT & Infrastructure division exhibits robust cyber readiness (82 points) but low familiarity with administrative survey sampling standards.',
        'Overall training course completion stands at 64%, with 22 critical skill gaps requiring scheduled upskilling under Mission Karmayogi guidelines.',
      ],
      criticalRisks: [
        'Single-point vulnerability in manual microdata validation leading to potential processing delays during national census rounds.',
        'Adoption rate of Digital Personal Data Protection (DPDP) consent compliance protocols is currently below 60% in field operations.',
      ],
      recommendedActions: [
        'Mandate the 6-week iGOT Karmayogi module on "Official Statistics & Microdata Integration" for all Junior Statistical Officers.',
        'Deploy cross-functional peer workshops pairing IT infrastructure engineers with senior demographic statisticians.',
        'Incentivize verified mentor office hours and link completed learning path credits to annual capability reviews.',
      ],
    };
  },
};
