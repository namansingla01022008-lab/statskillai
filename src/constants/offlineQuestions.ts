// Preloaded Sanitized Question Set for Zero-Trust Offline Assessments
// Contains Question Text and Options ONLY — Zero Answer Keys, Zero Hashes, Zero Explanations.
export const PRELOADED_OFFLINE_QUESTIONS = [
  {
    "id": "off-stat-e1",
    "domain": "Statistical",
    "difficulty": "Easy",
    "question": "Which of the following sampling techniques gives every member of the population a known and equal non-zero chance of selection?",
    "options": [
      "Simple Random Sampling without Replacement",
      "Quota Sampling",
      "Convenience Sampling",
      "Snowball Sampling"
    ]
  },
  {
    "id": "off-stat-e2",
    "domain": "Statistical",
    "difficulty": "Easy",
    "question": "In descriptive statistics, which measure of central tendency is least sensitive to extreme outliers?",
    "options": [
      "Arithmetic Mean",
      "Median",
      "Variance",
      "Mid-range"
    ]
  },
  {
    "id": "off-stat-e3",
    "domain": "Statistical",
    "difficulty": "Easy",
    "question": "Which primary organization under MoSPI conducts nationwide socio-economic household sample surveys in India?",
    "options": [
      "National Sample Survey Office (NSSO)",
      "Central Board of Indirect Taxes",
      "Geological Survey of India",
      "Election Commission of India"
    ]
  },
  {
    "id": "off-stat-m1",
    "domain": "Statistical",
    "difficulty": "Medium",
    "question": "In stratified multistage sampling for rural household surveys in India, what is typically selected as the Primary Sampling Unit (PSU)?",
    "options": [
      "The individual household member",
      "The revenue census village",
      "The private agricultural plot",
      "The postal pin-code boundary only"
    ]
  },
  {
    "id": "off-stat-m2",
    "domain": "Statistical",
    "difficulty": "Medium",
    "question": "When conducting hypothesis testing, what does a p-value of 0.02 indicate at a significance level (alpha) of 0.05?",
    "options": [
      "Fail to reject the null hypothesis because 0.02 < 0.05",
      "Reject the null hypothesis as the observed result is statistically significant",
      "The null hypothesis is 98% true",
      "The test power is insufficient and must be discarded"
    ]
  },
  {
    "id": "off-stat-h1",
    "domain": "Statistical",
    "difficulty": "Hard",
    "question": "What is the \"Design Effect\" (DEFF) in complex survey estimation?",
    "options": [
      "The ratio of the variance under the complex survey design to the variance under simple random sampling of identical size",
      "The proportion of questionnaires lost during field operations",
      "The cost reduction achieved by using digital tablets instead of paper",
      "The ratio between standard deviation and mean in an exponential curve"
    ]
  },
  {
    "id": "off-tech-e1",
    "domain": "Technical",
    "difficulty": "Easy",
    "question": "In relational databases (SQL), which clause is used to filter records after aggregation with a GROUP BY statement?",
    "options": [
      "WHERE",
      "HAVING",
      "ORDER BY",
      "LIMIT"
    ]
  },
  {
    "id": "off-tech-e2",
    "domain": "Technical",
    "difficulty": "Easy",
    "question": "In Python pandas library, which method is used to inspect summary statistics (mean, std, min, max) of numeric dataframe columns?",
    "options": [
      "df.info()",
      "df.describe()",
      "df.summary()",
      "df.head()"
    ]
  },
  {
    "id": "off-tech-m1",
    "domain": "Technical",
    "difficulty": "Medium",
    "question": "Which index type in PostgreSQL is best suited for accelerating equality comparisons on large foreign key lookup columns?",
    "options": [
      "B-Tree Index",
      "GIN Index",
      "BRIN Index",
      "GiST Index"
    ]
  },
  {
    "id": "off-tech-m2",
    "domain": "Technical",
    "difficulty": "Medium",
    "question": "What is the primary benefit of vectorization in NumPy compared to native Python for-loops?",
    "options": [
      "Compiles loops into parallelized C/SIMD instructions, eliminating Python interpreter overhead",
      "Compresses memory by converting floating points to 8-bit integers",
      "Encrypts data arrays in system RAM",
      "Allows arrays to have dynamic heterogeneous types"
    ]
  },
  {
    "id": "off-tech-h1",
    "domain": "Technical",
    "difficulty": "Hard",
    "question": "In distributed data pipelines, what guarantees \"idempotency\" when writing batch transformations to an analytical lakehouse?",
    "options": [
      "Atomic upsert (MERGE INTO) using a deterministic natural business key or unique mutationId",
      "Appending records continuously without checking previous keys",
      "Increasing consumer timeout windows to 24 hours",
      "Running transformations exclusively on a single worker node"
    ]
  },
  {
    "id": "off-dig-e1",
    "domain": "Digital",
    "difficulty": "Easy",
    "question": "Under India’s Digital Personal Data Protection (DPDP) Act 2023, what is an entity that determines the purpose and means of processing personal data termed?",
    "options": [
      "Data Principal",
      "Data Fiduciary",
      "Data Processor",
      "Data Auditor"
    ]
  },
  {
    "id": "off-dig-e2",
    "domain": "Digital",
    "difficulty": "Easy",
    "question": "Which of the following is a foundational component of India Stack for digital identity verification?",
    "options": [
      "Aadhaar / e-KYC",
      "BHIM UPI",
      "DigiLocker",
      "FASTag"
    ]
  },
  {
    "id": "off-dig-m1",
    "domain": "Digital",
    "difficulty": "Medium",
    "question": "In digital public infrastructure (DPI), what architectural design pattern ensures interoperability without vendor lock-in?",
    "options": [
      "Open specifications, minimalist protocol APIs, and decentralized participant registries (e.g. Beckn protocol)",
      "A proprietary monolithic centralized database managed by a single vendor",
      "Closed source mobile applications distributed only through private enterprise MDMs",
      "Restricting network protocols strictly to offline manual pen-drives"
    ]
  },
  {
    "id": "off-dig-m2",
    "domain": "Digital",
    "difficulty": "Medium",
    "question": "In India’s Data Empowerment and Protection Architecture (DEPA), what role does an Account Aggregator (AA) perform?",
    "options": [
      "Acts as a consent manager to facilitate encrypted, user-approved data sharing without seeing the data payload",
      "Stores citizen bank passwords on a central government mainframe",
      "Acts as a credit rating agency that determines interest rates",
      "Deletes citizen identity documents after 30 days"
    ]
  },
  {
    "id": "off-dig-h1",
    "domain": "Digital",
    "difficulty": "Hard",
    "question": "What is the primary cryptographic purpose of a Content Security Policy (CSP) nonce in modern web applications?",
    "options": [
      "Ensures only cryptographically tagged server-generated scripts can execute, preventing Cross-Site Scripting (XSS)",
      "Encrypts network packets over TLS 1.3",
      "Speeds up service worker file downloads by 50%",
      "Stores passwords in the browser cache storage"
    ]
  },
  {
    "id": "off-beh-e1",
    "domain": "Behavioural",
    "difficulty": "Easy",
    "question": "In public administration and civil service delivery, what is the primary objective of citizen-centric grievance redressal portals (such as CPGRAMS)?",
    "options": [
      "To provide timely, transparent, and accountable resolution of citizen grievances against public authorities",
      "To penalize citizens who lodge inquiries",
      "To replace civil court hearings entirely",
      "To archive citizen feedback without taking action"
    ]
  },
  {
    "id": "off-beh-e2",
    "domain": "Behavioural",
    "difficulty": "Easy",
    "question": "Which behavior best fosters \"psychological safety\" in a high-performing analytical project team?",
    "options": [
      "Encouraging open questions, constructive disagreement, and treating errors as learning opportunities",
      "Assigning public blame whenever a statistical model is imperfect",
      "Discouraging team members from voicing doubts during planning",
      "Restricting communication solely to top-down hierarchical directives"
    ]
  },
  {
    "id": "off-beh-m1",
    "domain": "Behavioural",
    "difficulty": "Medium",
    "question": "When communicating complex statistical findings with non-technical public policymakers, what is the most effective approach?",
    "options": [
      "Translate statistical uncertainty into clear policy trade-offs, intuitive visual charts, and actionable executive takeaways",
      "Present raw R/Python code scripts directly to the cabinet committee",
      "Omit all nuances and claim 100% statistical certainty on all predictions",
      "Use obscure econometric jargon to impress the stakeholders"
    ]
  },
  {
    "id": "off-beh-m2",
    "domain": "Behavioural",
    "difficulty": "Medium",
    "question": "In public procurement and government contracting (e.g. Government e-Marketplace / GeM), which principle is paramount to preventing conflicts of interest?",
    "options": [
      "Transparent competitive bidding, strict recusal where personal interest exists, and auditable evaluation criteria",
      "Awarding contracts directly to close family associates without tenders",
      "Refusing to publish vendor selection criteria",
      "Altering technical specifications after bidding has closed"
    ]
  },
  {
    "id": "off-beh-h1",
    "domain": "Behavioural",
    "difficulty": "Hard",
    "question": "In project governance, what does the Logical Framework Approach (LogFrame) establish?",
    "options": [
      "A structured causal matrix linking inputs, activities, outputs, outcomes, and impact with verifiable indicators and risk assumptions",
      "A software compiler rule that rejects boolean logic flaws",
      "An automated spreadsheet formula for calculating employee payroll deductions",
      "A contract negotiation template between vendors"
    ]
  }
];
