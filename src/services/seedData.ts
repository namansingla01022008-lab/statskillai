import {
  User,
  LearnerProfile,
  Course,
  Career,
  Dataset,
  Opportunity,
  Mentor,
  Mentorship,
  DirectMessage,
  OrgEmployee,
  AssessmentAttempt,
  GapAnalysis,
  LearningPath,
  DomainType,
  QuestionRecord,
  MentorshipSessionBooking,
  MentorshipFeedbackRecord,
} from '../types';
import { FALLBACK_QUESTIONS } from './aiFallbacks';

function getHistoricalDomainQuestions(domain: DomainType): QuestionRecord[] {
  const easy = FALLBACK_QUESTIONS[domain]?.Easy || [];
  const medium = FALLBACK_QUESTIONS[domain]?.Medium || [];
  const hard = FALLBACK_QUESTIONS[domain]?.Hard || [];
  return [...easy.slice(0, 2), ...medium.slice(0, 2), ...hard.slice(0, 1)];
}

export const SEED_USERS: User[] = [
  {
    id: 'user-learner-student',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@univ.edu.in',
    role: 'learner',
    profileType: 'Student',
    designation: 'B.Tech / BCA Data Science Final Year',
    department: 'School of Computational & Statistical Sciences',
  },
  {
    id: 'user-learner-gov',
    name: 'Priya Verma',
    email: 'priya.verma@mospi.gov.in',
    role: 'learner',
    profileType: 'Government Employee',
    designation: 'Assistant Section Officer & Junior Statistical Investigator',
    department: 'Ministry of Statistics & Programme Implementation (MoSPI)',
  },
  {
    id: 'user-learner-private',
    name: 'Vikram Malhotra',
    email: 'vikram.m@analyticscloud.in',
    role: 'learner',
    profileType: 'Private-Sector Professional',
    designation: 'Senior Business Intelligence & Governance Analyst',
    department: 'Enterprise Data Solutions Group',
  },
  {
    id: 'user-mentor-1',
    name: 'Dr. Anita Rao',
    email: 'dr.anita.rao@isical.ac.in',
    role: 'mentor',
    designation: 'Senior Principal Statistician & NEP Educational Advisor',
    department: 'Indian Statistical Institute (ISI) Alumni Advisory Board',
  },
  {
    id: 'user-mentor-2',
    name: 'Rajesh Kulkarni',
    email: 'rajesh.kulkarni@nic.in',
    role: 'mentor',
    designation: 'Chief Technology Architect & E-Governance Specialist',
    department: 'National Informatics Centre (NIC) Skill Cell',
  },
  {
    id: 'user-admin',
    name: 'Sunil Mehta',
    email: 'sunil.mehta@nsdcindia.org',
    role: 'admin',
    designation: 'Director of Human Capital & Strategic Skilling',
    department: 'National Skill Development & Competency Monitoring Division',
  },
];

export const SEED_ORGANISATIONS = [
  {
    id: 'org-mospi',
    name: 'Ministry of Statistics and Programme Implementation (MoSPI)',
    sector: 'Government / Public Sector',
    description: 'Nodal ministry for planned development of statistical systems and national survey initiatives.',
  },
  {
    id: 'org-nic',
    name: 'National Informatics Centre (NIC)',
    sector: 'Public Sector / Digital Governance',
    description: 'Premier science & technology institution providing ICT infrastructure to Government of India.',
  },
  {
    id: 'org-isi',
    name: 'Indian Statistical Institute (ISI)',
    sector: 'Higher Education & Research',
    description: 'Institution of National Importance devoted to research, teaching, and application of statistics.',
  },
  {
    id: 'org-niti',
    name: 'NITI Aayog Data & Governance Cell',
    sector: 'Public Policy & Think Tank',
    description: 'Apex public policy think tank fostering cooperative federalism and evidence-based governance.',
  },
  {
    id: 'org-rbi',
    name: 'Reserve Bank of India (RBI) Data Office',
    sector: 'Banking & Financial Supervision',
    description: 'Central monetary institution managing national econometric series and financial supervision.',
  },
  {
    id: 'org-tcs',
    name: 'Tata Consultancy Services - Public Sector Practice',
    sector: 'Information Technology & Consulting',
    description: 'Global IT leader executing large-scale sovereign digital platforms and citizen services.',
  },
  {
    id: 'org-infosys',
    name: 'Infosys Public Governance & AI Unit',
    sector: 'Enterprise Tech & AI Platforms',
    description: 'Delivering next-generation digital services, citizen portals, and enterprise analytics.',
  },
  {
    id: 'org-census',
    name: 'Office of the Registrar General & Census Commissioner',
    sector: 'Demographic & Statistical Research',
    description: 'Responsible for conduct of decennial population census and civil registration systems.',
  },
];

export const SEED_COURSES: Course[] = [
  {
    "id": "nptel-stat-101",
    "title": "Essentials of Data Science With R Software - 1: Probability and Statistical Inference",
    "domain": "Statistical",
    "provider": "NPTEL",
    "source": "NPTEL",
    "duration": "12 Weeks",
    "level": "Intermediate",
    "description": "Covers probability foundations, discrete and continuous distributions, and point estimation using R. Teaches hypothesis testing and interval estimation for real-world datasets.",
    "portalUrl": "https://nptel.ac.in/courses/111104146",
    "sourceUrl": "https://nptel.ac.in/courses/111104146",
    "sourceName": "NPTEL / IIT Kanpur",
    "licenseNote": "NPTEL Open Courseware, Ministry of Education, Government of India",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z",
    "skillsCovered": [
      "Probability Theory",
      "Statistical Inference",
      "Hypothesis Testing",
      "R Programming"
    ],
    "topic": "Statistical Inference",
    "language": "English"
  },
  {
    "id": "nptel-stat-102",
    "title": "Essentials of Data Science With R Software - 2: Sampling Theory and Linear Regression Analysis",
    "domain": "Statistical",
    "provider": "NPTEL",
    "source": "NPTEL",
    "duration": "12 Weeks",
    "level": "Advanced",
    "description": "Explores simple, stratified, cluster, and systematic sampling methodologies alongside variance estimation. Teaches multiple linear regression modeling and diagnostics in R.",
    "portalUrl": "https://nptel.ac.in/courses/111104147",
    "sourceUrl": "https://nptel.ac.in/courses/111104147",
    "sourceName": "NPTEL / IIT Kanpur",
    "licenseNote": "NPTEL Open Courseware, Ministry of Education, Government of India",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z",
    "skillsCovered": [
      "Sampling Theory",
      "Survey Sampling",
      "Linear Regression",
      "Variance Estimation",
      "R Programming"
    ],
    "topic": "Sampling and Survey Methodology",
    "language": "English"
  },
  {
    "id": "nptel-stat-103",
    "title": "Descriptive Statistics with R Software",
    "domain": "Statistical",
    "provider": "NPTEL",
    "source": "NPTEL",
    "duration": "8 Weeks",
    "level": "Beginner",
    "description": "Focuses on summarization, central tendency, dispersion, skewness, and exploratory visualization of quantitative data. Implements data presentation techniques using open-source R.",
    "portalUrl": "https://nptel.ac.in/courses/111104120",
    "sourceUrl": "https://nptel.ac.in/courses/111104120",
    "sourceName": "NPTEL / IIT Kanpur",
    "licenseNote": "NPTEL Open Courseware, Ministry of Education, Government of India",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z",
    "skillsCovered": [
      "Descriptive Statistics",
      "Data Visualization",
      "Central Tendency",
      "Dispersion",
      "R Programming"
    ],
    "topic": "Descriptive Statistics",
    "language": "English"
  },
  {
    "id": "nptel-stat-104",
    "title": "Introduction to Statistical Hypothesis Testing",
    "domain": "Statistical",
    "provider": "NPTEL",
    "source": "NPTEL",
    "duration": "8 Weeks",
    "level": "Intermediate",
    "description": "Provides rigorous instruction on hypothesis formulation, Type I and II errors, p-values, and parametric tests. Covers one-sample, two-sample, and ANOVA significance tests.",
    "portalUrl": "https://nptel.ac.in/courses/103106120",
    "sourceUrl": "https://nptel.ac.in/courses/103106120",
    "sourceName": "NPTEL / IIT Madras",
    "licenseNote": "NPTEL Open Courseware, Ministry of Education, Government of India",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z",
    "skillsCovered": [
      "Hypothesis Testing",
      "ANOVA",
      "p-values",
      "Significance Testing",
      "Confidence Intervals"
    ],
    "topic": "Statistical Inference",
    "language": "English"
  },
  {
    "id": "nptel-tech-201",
    "title": "Python for Data Science",
    "domain": "Technical",
    "provider": "NPTEL",
    "source": "NPTEL",
    "duration": "4 Weeks",
    "level": "Beginner",
    "description": "Introduces foundational Python syntax, sequences, NumPy array operations, and pandas DataFrame transformations. Equips learners with essential scripting skills for processing large datasets.",
    "portalUrl": "https://nptel.ac.in/courses/106106212",
    "sourceUrl": "https://nptel.ac.in/courses/106106212",
    "sourceName": "NPTEL / IIT Madras",
    "licenseNote": "NPTEL Open Courseware, Ministry of Education, Government of India",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z",
    "skillsCovered": [
      "Python",
      "NumPy",
      "pandas",
      "Data Manipulation",
      "Scripting"
    ],
    "topic": "Data Analysis with Python and R",
    "language": "English"
  },
  {
    "id": "nptel-tech-202",
    "title": "Data Analytics with Python",
    "domain": "Technical",
    "provider": "NPTEL",
    "source": "NPTEL",
    "duration": "12 Weeks",
    "level": "Intermediate",
    "description": "Teaches exploratory data analytics, probability distributions, regression modeling, and cluster analysis using Python. Demonstrates predictive analytics using classification and regression trees.",
    "portalUrl": "https://nptel.ac.in/courses/106107220",
    "sourceUrl": "https://nptel.ac.in/courses/106107220",
    "sourceName": "NPTEL / IIT Roorkee",
    "licenseNote": "NPTEL Open Courseware, Ministry of Education, Government of India",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z",
    "skillsCovered": [
      "Python",
      "Data Analytics",
      "Regression Analysis",
      "Clustering",
      "Machine Learning Basics"
    ],
    "topic": "Data Analysis with Python and R",
    "language": "English"
  },
  {
    "id": "igot-gov-301",
    "title": "Code of Conduct for Government Employees",
    "domain": "Behavioural",
    "provider": "iGOT Karmayogi",
    "source": "iGOT Karmayogi",
    "duration": "4 Weeks",
    "level": "Beginner",
    "description": "Instructs public servants on the Central Civil Services (Conduct) Rules, ethical obligations, and conflict of interest resolution. Emphasizes transparency, impartiality, and public integrity.",
    "portalUrl": "https://igotkarmayogi.gov.in/course/code-of-conduct",
    "sourceUrl": "https://igotkarmayogi.gov.in/course/code-of-conduct",
    "sourceName": "iGOT Karmayogi / ISTM",
    "licenseNote": "Mission Karmayogi, Capacity Building Commission, Government of India",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z",
    "skillsCovered": [
      "Public Ethics",
      "Civil Service Rules",
      "Conflict Resolution",
      "Integrity",
      "Accountability"
    ],
    "topic": "Government-Sector Competency",
    "language": "English"
  },
  {
    "id": "igot-gov-302",
    "title": "Data-Driven Decision Making for Government Professionals",
    "domain": "Digital",
    "provider": "iGOT Karmayogi",
    "source": "iGOT Karmayogi",
    "duration": "6 Weeks",
    "level": "Intermediate",
    "description": "Trains administrative personnel on leveraging empirical evidence, data indicators, and dashboard metrics for program design. Emphasizes evidence-based public policy implementation.",
    "portalUrl": "https://igotkarmayogi.gov.in/course/data-driven-decision-making",
    "sourceUrl": "https://igotkarmayogi.gov.in/course/data-driven-decision-making",
    "sourceName": "iGOT Karmayogi / MeitY",
    "licenseNote": "Mission Karmayogi, Capacity Building Commission, Government of India",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z",
    "skillsCovered": [
      "Evidence-Based Policy",
      "Data Governance",
      "Key Performance Indicators",
      "Public Administration"
    ],
    "topic": "Data Governance and E-Governance",
    "language": "English"
  },
  {
    "id": "mospi-nssta-401",
    "title": "Official Statistics and National Statistical System Induction Programme",
    "domain": "Statistical",
    "provider": "NSSTA",
    "source": "NSSTA",
    "duration": "8 Weeks",
    "level": "Advanced",
    "description": "Comprehensive capacity building on Indian statistical architecture, national accounts, CPI, IIP, and survey fieldwork. Prepares statistical cadre officers for national data collection initiatives.",
    "portalUrl": "https://mospi.gov.in/training-programmes",
    "sourceUrl": "https://mospi.gov.in/training-programmes",
    "sourceName": "MoSPI / National Statistical Systems Training Academy",
    "licenseNote": "National Statistical Systems Training Academy, MoSPI, Government of India",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z",
    "skillsCovered": [
      "Official Statistics",
      "National Accounts",
      "Consumer Price Index",
      "Survey Operations",
      "NSSO Standards"
    ],
    "topic": "Official Statistics and National Accounts",
    "language": "English"
  },
  {
    "id": "swayam-stat-501",
    "title": "Introduction to Probability and Statistics",
    "domain": "Statistical",
    "provider": "SWAYAM",
    "source": "SWAYAM",
    "duration": "8 Weeks",
    "level": "Beginner",
    "description": "Covers sample spaces, probability rules, conditional probability, random variables, and expectation. Introduces statistical distribution models for decision-making.",
    "portalUrl": "https://swayam.gov.in/explorer?category=STATISTICS",
    "sourceUrl": "https://swayam.gov.in/explorer?category=STATISTICS",
    "sourceName": "SWAYAM / IIT Madras",
    "licenseNote": "SWAYAM National Online Education Platform, Ministry of Education, Government of India",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z",
    "skillsCovered": [
      "Probability",
      "Random Variables",
      "Conditional Probability",
      "Statistical Modeling"
    ],
    "topic": "Probability",
    "language": "English"
  },
  {
    "id": "template-unverified-course-01",
    "title": "[TEMPLATE] Advanced Time-Series Econometrics for Macro Forecasting",
    "domain": "Statistical",
    "provider": "other",
    "source": "other",
    "duration": "10 Weeks",
    "level": "Advanced",
    "description": "Template unverified course entry illustrating isolation rules. This entry must remain hidden from users until live URL verification.",
    "portalUrl": "https://swayam.gov.in/template-entry-requires-verification",
    "sourceUrl": "https://swayam.gov.in/template-entry-requires-verification",
    "sourceName": "Pending Verification Portal",
    "licenseNote": "Sample template row demonstrating unverified entry lifecycle",
    "status": "unverified",
    "lastVerifiedAt": null,
    "skillsCovered": [
      "Time Series",
      "Econometrics",
      "Forecasting"
    ],
    "topic": "Regression",
    "language": "English"
  }
];

// All fabricated unverified opportunity records removed per Phase 1 data integrity requirements.
// Real government career pathways are seeded into SEED_CAREERS below.
export const SEED_OPPORTUNITIES: Opportunity[] = [];

export const SEED_CAREERS: Career[] = [
  {
    "id": "career-iss-01",
    "roleTitle": "Indian Statistical Service (ISS) - Junior Time Scale / Assistant Director",
    "pathway": "Indian Statistical Service Cadre",
    "requiredSkills": [
      "Official Statistics",
      "Sampling Theory",
      "Survey Design",
      "National Accounts",
      "Econometrics"
    ],
    "requiredQualification": "Bachelor's Degree with Statistics / Mathematical Statistics / Applied Statistics as one of the subjects, or a Master's degree in Statistics / Mathematical Statistics / Applied Statistics from a recognized university.",
    "entryRoute": "Direct recruitment through the Union Public Service Commission (UPSC) Indian Statistical Service (ISS) Examination.",
    "sourceUrl": "https://upsc.gov.in",
    "sourceName": "Union Public Service Commission (UPSC) Official Notice",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z"
  },
  {
    "id": "career-jso-02",
    "roleTitle": "Junior Statistical Officer (JSO)",
    "pathway": "Subordinate Statistical Service (SSS)",
    "requiredSkills": [
      "Descriptive Statistics",
      "Sampling Theory",
      "Probability",
      "Statistical Inference",
      "Data Verification"
    ],
    "requiredQualification": "Bachelor's Degree in any subject from a recognized University with at least 60% Marks in Mathematics at 12th standard level OR Bachelor's Degree in any subject with Statistics as one of the subjects at degree level.",
    "entryRoute": "Direct recruitment through Staff Selection Commission (SSC) Combined Graduate Level (CGL) Examination - Paper-II Statistics.",
    "sourceUrl": "https://ssc.gov.in/cgl-jso-notice",
    "sourceName": "Staff Selection Commission (SSC) Official Notice",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z"
  },
  {
    "id": "career-sso-03",
    "roleTitle": "Senior Statistical Officer (SSO)",
    "pathway": "Subordinate Statistical Service (SSS)",
    "requiredSkills": [
      "Survey Operations",
      "Data Quality Audit",
      "Advanced Sampling",
      "National Accounts",
      "Microdata Validation"
    ],
    "requiredQualification": "Subordinate Statistical Service Rules: Minimum 5 years of regular service as Junior Statistical Officer in the Ministry of Statistics and Programme Implementation.",
    "entryRoute": "Promotional pathway and departmental examination from Junior Statistical Officer (JSO) cadre.",
    "sourceUrl": "https://mospi.gov.in/subordinate-statistical-service",
    "sourceName": "Ministry of Statistics and Programme Implementation (MoSPI) Service Rules",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z"
  },
  {
    "id": "career-stat-inv-04",
    "roleTitle": "Statistical Investigator Grade-II",
    "pathway": "Registrar General of India / Central Ministries",
    "requiredSkills": [
      "Demographic Statistics",
      "Census Enumeration",
      "Survey Sampling",
      "Data Entry Audit",
      "Data Verification"
    ],
    "requiredQualification": "Bachelor's Degree with Statistics as one of the main subjects studied in all the three years or all six semesters.",
    "entryRoute": "Staff Selection Commission (SSC) Combined Graduate Level (CGL) Examination - Paper-II Statistics.",
    "sourceUrl": "https://ssc.gov.in/statistical-investigator-notice",
    "sourceName": "Staff Selection Commission (SSC) Official Recruitment Notice",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z"
  },
  {
    "id": "career-ncs-portal-05",
    "roleTitle": "Public Sector & Private Analytics Openings (National Career Service Gateway)",
    "pathway": "National Career Service Opportunities",
    "requiredSkills": [
      "Data Analysis with Python and R",
      "SQL and Databases",
      "Data Visualisation",
      "Statistical Inference"
    ],
    "requiredQualification": "Varies by specific vacancy notice; verified through the National Career Service portal agreement.",
    "entryRoute": "Direct application via National Career Service portal (ncs.gov.in) partnered listings.",
    "sourceUrl": "https://www.ncs.gov.in",
    "sourceName": "Ministry of Labour & Employment - National Career Service",
    "status": "verified",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z"
  },
  {
    "id": "template-unverified-career-01",
    "roleTitle": "[TEMPLATE] State Directorate Statistical Assistant",
    "pathway": "State Statistical Cadre",
    "requiredSkills": [
      "Descriptive Statistics",
      "State Survey Operations"
    ],
    "requiredQualification": "Bachelor's degree with Statistics/Economics/Mathematics (subject to state service gazette notification).",
    "entryRoute": "State Public Service Commission Examination.",
    "sourceUrl": "https://www.ncs.gov.in/template-role-verification-pending",
    "sourceName": "Pending State Commission Gazette Verification",
    "status": "unverified",
    "lastVerifiedAt": null
  }
];

export const SEED_DATASETS: Dataset[] = [
  {
    "id": "dataset-cpi-01",
    "name": "Consumer Price Index (Rural, Urban, Combined) and Consumer Food Price Index",
    "publisher": "Ministry of Statistics and Programme Implementation (MoSPI)",
    "sourceUrl": "https://data.gov.in/resource/consumer-price-index",
    "licence": "GODL-India",
    "attributionText": "Source: Ministry of Statistics & Programme Implementation (MoSPI), Government of India (OGD Platform India / eSankhyiki under Government Open Data License - India).",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z"
  },
  {
    "id": "dataset-plfs-02",
    "name": "Periodic Labour Force Survey (PLFS) Key Indicators and Microdata",
    "publisher": "Ministry of Statistics and Programme Implementation (MoSPI)",
    "sourceUrl": "https://data.gov.in/resource/periodic-labour-force-survey",
    "licence": "GODL-India",
    "attributionText": "Source: National Sample Survey Office (NSSO), MoSPI, Government of India (microdata.gov.in / OGD Platform India under GODL-India).",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z"
  },
  {
    "id": "dataset-iip-03",
    "name": "Index of Industrial Production (IIP) Base Year 2011-12",
    "publisher": "Ministry of Statistics and Programme Implementation (MoSPI)",
    "sourceUrl": "https://data.gov.in/resource/index-of-industrial-production",
    "licence": "GODL-India",
    "attributionText": "Source: National Accounts Division, MoSPI, Government of India (published under GODL-India).",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z"
  },
  {
    "id": "dataset-asi-04",
    "name": "Annual Survey of Industries (ASI) Factory Sector Summary Results",
    "publisher": "Ministry of Statistics and Programme Implementation (MoSPI)",
    "sourceUrl": "https://data.gov.in/resource/annual-survey-of-industries",
    "licence": "GODL-India",
    "attributionText": "Source: Industrial Statistics Wing, MoSPI, Government of India (published under GODL-India).",
    "lastVerifiedAt": "2026-10-31T00:00:00.000Z"
  }
];

export const SEED_MENTORS: Mentor[] = [
  {
    id: 'mentor-rahul',
    userId: 'user-mentor-rahul',
    name: 'Rahul Sharma',
    title: 'Competitive Programming Specialist & Senior SDE',
    organisation: 'Ex-Directi / Top-Tier Product Architect',
    field: 'C++, DSA, Competitive Programming',
    experienceYears: 3,
    languages: ['English', 'Hindi'],
    bio: 'Specialized in Tree traversals, Graph algorithms, dynamic programming, and high-performance competitive coding. Mentored 150+ students into top-tier tech roles.',
    isVerified: true,
    verifiedDate: '2025-01-15',
    availability: 'Daily Evenings (6:00 PM - 9:00 PM)',
    rating: 4.8,
    totalReviews: 89,
    price: 10,
    totalSessions: 127,
    expertise: ['C++', 'DSA', 'Binary Trees', 'Graphs', 'Dynamic Programming', 'Competitive Programming'],
    availableSlots: [
      { id: 'rs-1', dayOfWeek: 'Monday', time: '10:00 AM' },
      { id: 'rs-2', dayOfWeek: 'Monday', time: '02:00 PM' },
      { id: 'rs-3', dayOfWeek: 'Monday', time: '06:00 PM' },
      { id: 'rs-4', dayOfWeek: 'Tuesday', time: '11:00 AM' },
      { id: 'rs-5', dayOfWeek: 'Tuesday', time: '05:00 PM' },
      { id: 'rs-6', dayOfWeek: 'Wednesday', time: '04:00 PM' },
      { id: 'rs-7', dayOfWeek: 'Saturday', time: '10:00 AM' },
    ],
  },
  {
    id: 'mentor-ananya',
    userId: 'user-mentor-ananya',
    name: 'Ananya Singh',
    title: 'AI/ML Research Scientist & Python Architect',
    organisation: 'Applied AI Labs / IIT Delhi Researcher',
    field: 'Python, AI/ML & Deep Learning',
    experienceYears: 4,
    languages: ['English', 'Hindi'],
    bio: 'Specialized in Python OOP, PyTorch, statistical machine learning pipelines, and production NLP models. Guides students on real-world AI architectures.',
    isVerified: true,
    verifiedDate: '2024-11-20',
    availability: 'Weekdays & Weekends',
    rating: 4.9,
    totalReviews: 142,
    price: 10,
    totalSessions: 214,
    expertise: ['Python', 'AI/ML', 'OOP', 'PyTorch', 'Data Science', 'Machine Learning'],
    availableSlots: [
      { id: 'as-1', dayOfWeek: 'Monday', time: '03:00 PM' },
      { id: 'as-2', dayOfWeek: 'Wednesday', time: '11:00 AM' },
      { id: 'as-3', dayOfWeek: 'Friday', time: '05:00 PM' },
      { id: 'as-4', dayOfWeek: 'Saturday', time: '02:00 PM' },
    ],
  },
  {
    id: 'mentor-arjun',
    userId: 'user-mentor-arjun',
    name: 'Arjun Verma',
    title: 'Cybersecurity Analyst & Certified Ethical Hacker',
    organisation: 'Cyber Defense Group / Cert-In Empanelled',
    field: 'Cybersecurity, Ethical Hacking & DPI Defense',
    experienceYears: 3,
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'Security consultant for public infrastructure and financial networks. Mentoring aspiring security engineers on penetration testing, web security, and threat intelligence.',
    isVerified: true,
    verifiedDate: '2024-09-10',
    availability: 'Tue, Thu, Sat Evenings',
    rating: 4.7,
    totalReviews: 64,
    price: 10,
    totalSessions: 98,
    expertise: ['Cybersecurity', 'Ethical Hacking', 'Network Security', 'DPI Protection', 'Web Security'],
    availableSlots: [
      { id: 'av-1', dayOfWeek: 'Tuesday', time: '06:00 PM' },
      { id: 'av-2', dayOfWeek: 'Thursday', time: '07:00 PM' },
      { id: 'av-3', dayOfWeek: 'Saturday', time: '04:00 PM' },
    ],
  },
  {
    id: 'mentor-priya',
    userId: 'user-mentor-priya',
    name: 'Priya Patel',
    title: 'Full Stack Engineer & Web Systems Lead',
    organisation: 'CloudScale Systems',
    field: 'Web Development, Full Stack React/Node',
    experienceYears: 2,
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Builds modern responsive web applications with TypeScript, React, and serverless Node.js architectures. Focuses on pragmatic hands-on coding.',
    isVerified: true,
    verifiedDate: '2025-02-01',
    availability: 'Flexible (Afternoons)',
    rating: 4.9,
    totalReviews: 53,
    price: 8,
    totalSessions: 85,
    expertise: ['Web Development', 'React', 'Node.js', 'TypeScript', 'Tailwind CSS'],
    availableSlots: [
      { id: 'pp-1', dayOfWeek: 'Monday', time: '01:00 PM' },
      { id: 'pp-2', dayOfWeek: 'Thursday', time: '03:00 PM' },
    ],
  },
  {
    id: 'mentor-vikram',
    userId: 'user-mentor-vikram',
    name: 'Vikram Malhotra',
    title: 'Algorithm Engineer & Code Specialist',
    organisation: 'ACM-ICPC Regionalist',
    field: 'Competitive Programming & Problem Solving',
    experienceYears: 1,
    languages: ['English', 'Hindi'],
    bio: 'Specialist in fast algorithmic thinking, recursion, and time complexity optimization for college students and coding interview prep.',
    isVerified: true,
    verifiedDate: '2025-03-12',
    availability: 'Weekends (Sat & Sun)',
    rating: 4.6,
    totalReviews: 28,
    price: 5,
    totalSessions: 45,
    expertise: ['Competitive Programming', 'C++', 'Data Structures', 'Recursion', 'BFS/DFS'],
    availableSlots: [
      { id: 'vm-1', dayOfWeek: 'Saturday', time: '11:00 AM' },
      { id: 'vm-2', dayOfWeek: 'Sunday', time: '04:00 PM' },
    ],
  },
  {
    id: 'mentor-1',
    userId: 'user-mentor-1',
    name: 'Dr. Anita Rao',
    title: 'Senior Principal Statistician & NEP Educational Advisor',
    organisation: 'Indian Statistical Institute (ISI) Advisory Cell',
    field: 'Survey Sampling, Official Statistics & Policy Evaluation',
    experienceYears: 18,
    languages: ['English', 'Hindi', 'Bengali'],
    bio: 'Former consultant to National Statistical Commission. Mentored 380+ civil servants and university graduates on evidence-backed governance.',
    isVerified: true,
    verifiedDate: '2024-03-15',
    availability: 'Evenings (Tue, Thu, Sat)',
    rating: 4.9,
    totalReviews: 38,
    price: 15,
    totalSessions: 380,
    expertise: ['Survey Sampling', 'Statistical Modeling', 'Official Statistics', 'Data Analysis'],
    availableSlots: [
      { id: 'ar-1', dayOfWeek: 'Tuesday', time: '05:00 PM' },
      { id: 'ar-2', dayOfWeek: 'Thursday', time: '06:00 PM' },
    ],
  },
  {
    id: 'mentor-2',
    userId: 'user-mentor-2',
    name: 'Rajesh Kulkarni',
    title: 'Chief Technology Architect & E-Governance Specialist',
    organisation: 'National Informatics Centre (NIC)',
    field: 'Enterprise Architecture, Digital Public Infrastructure & API Security',
    experienceYears: 14,
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'Lead architect behind digital authentication and public utility portals. Passionate about empowering engineering and student leaders.',
    isVerified: true,
    verifiedDate: '2024-01-20',
    availability: 'Weekends (Sat, Sun morning)',
    rating: 4.8,
    totalReviews: 29,
    price: 15,
    totalSessions: 290,
    expertise: ['Enterprise Architecture', 'Cloud Systems', 'API Security', 'System Design'],
    availableSlots: [
      { id: 'rk-1', dayOfWeek: 'Saturday', time: '09:00 AM' },
      { id: 'rk-2', dayOfWeek: 'Sunday', time: '10:00 AM' },
    ],
  },
];

export const SEED_PROFILES: Record<string, LearnerProfile> = {
  'user-learner-student': {
    userId: 'user-learner-student',
    fullName: 'Aarav Sharma',
    profileType: 'Student',
    highestEducation: 'Undergraduate Senior (B.Tech Computer Science / Data Analytics)',
    qualifications: 'Higher Secondary (PCM 94%), BCA Data Foundations',
    currentRoleOrCourse: 'Final Year B.Tech Student',
    yearsOfExperience: 0,
    organisationOrInstitution: 'Delhi Technological University',
    skills: ['Python', 'SQL', 'Data Structures', 'Pandas', 'Basic Probability'],
    interests: ['Statistical Sampling', 'National Surveys', 'E-Governance', 'Public Policy Tech'],
    previousTrainings: [
      {
        id: 'train-1',
        title: 'Introduction to Machine Learning on SWAYAM',
        provider: 'IIT Madras (SWAYAM)',
        year: '2025',
        certificateId: 'SWAYAM-CS-2025-9921',
      },
    ],
    careerGoal: 'Secure a fellowship or Junior Statistical Officer role with MoSPI or NITI Aayog to deploy modern analytics for public survey modernization.',
    targetDomainScores: { Technical: 75, Statistical: 75, Digital: 70, Behavioural: 65 },
    completeness: 92,
    updatedAt: '2026-09-28',
  },
  'user-learner-gov': {
    userId: 'user-learner-gov',
    fullName: 'Priya Verma',
    profileType: 'Government Employee',
    highestEducation: 'M.Sc. in Applied Statistics',
    qualifications: 'UGC-NET Qualified, Subordinate Statistical Service Certification',
    currentRoleOrCourse: 'Assistant Section Officer & Junior Statistical Investigator',
    yearsOfExperience: 5,
    organisationOrInstitution: 'Ministry of Statistics & Programme Implementation (MoSPI)',
    skills: ['Survey Design', 'Census Verification', 'SPSS', 'Administrative Audit', 'Official Statistics'],
    interests: ['Python for Microdata', 'Cloud Productivity', 'India Stack', 'Executive Leadership'],
    previousTrainings: [
      {
        id: 'train-2',
        title: 'National Accounts System & GDP Estimation Methodology',
        provider: 'National Statistical Systems Training Academy (NSSTA)',
        year: '2024',
        certificateId: 'NSSTA-2024-STAT-410',
      },
      {
        id: 'train-3',
        title: 'Code of Ethics and Conduct for Central Government Servants',
        provider: 'iGOT Karmayogi',
        year: '2025',
        certificateId: 'iGOT-ETH-8812',
      },
    ],
    careerGoal: 'Advance to Senior Statistical Officer by mastering automated Python data pipelines, DPDP compliance, and inter-ministerial data governance.',
    targetDomainScores: { Technical: 70, Statistical: 85, Digital: 75, Behavioural: 80 },
    completeness: 100,
    updatedAt: '2026-10-01',
  },
  'user-learner-private': {
    userId: 'user-learner-private',
    fullName: 'Vikram Malhotra',
    profileType: 'Private-Sector Professional',
    highestEducation: 'B.E. Computer Engineering + PG Diploma in Business Analytics',
    qualifications: 'Certified Data Management Professional (CDMP)',
    currentRoleOrCourse: 'Senior Business Intelligence & Governance Analyst',
    yearsOfExperience: 7,
    organisationOrInstitution: 'Enterprise Data Solutions Group',
    skills: ['PostgreSQL', 'Tableau', 'Power BI', 'ETL Architecture', 'Agile Leadership'],
    interests: ['Official Economic Indicators', 'Public Sector Consulting', 'Digital Public Goods'],
    previousTrainings: [
      {
        id: 'train-4',
        title: 'Enterprise Big Data & Cloud Security',
        provider: 'AWS Academy / Corporate Skill Unit',
        year: '2023',
        certificateId: 'CORP-AWS-7749',
      },
    ],
    careerGoal: 'Transition into civic tech leadership consulting for government digital public infrastructure and sovereign data analytics programs.',
    targetDomainScores: { Technical: 85, Statistical: 75, Digital: 80, Behavioural: 75 },
    completeness: 95,
    updatedAt: '2026-09-15',
  },
};

export const SEED_INITIAL_ATTEMPTS: Record<string, AssessmentAttempt[]> = {
  'user-learner-student': [
    {
      id: 'att-student-tech-1',
      userId: 'user-learner-student',
      domain: 'Technical',
      date: '2026-09-20',
      completed: true,
      score: 78,
      earnedWeight: 11,
      maxWeight: 14,
      questions: getHistoricalDomainQuestions('Technical'),
      userAnswers: [1, 2, 0, 3, 1],
    },
    {
      id: 'att-student-stat-1',
      userId: 'user-learner-student',
      domain: 'Statistical',
      date: '2026-09-22',
      completed: true,
      score: 55, // Critical gap!
      earnedWeight: 7,
      maxWeight: 13,
      questions: getHistoricalDomainQuestions('Statistical'),
      userAnswers: [2, 0, 1, 1, 0],
    },
    {
      id: 'att-student-dig-1',
      userId: 'user-learner-student',
      domain: 'Digital',
      date: '2026-09-24',
      completed: true,
      score: 68,
      earnedWeight: 9,
      maxWeight: 13,
      questions: getHistoricalDomainQuestions('Digital'),
      userAnswers: [0, 1, 2, 2, 1],
    },
    {
      id: 'att-student-beh-1',
      userId: 'user-learner-student',
      domain: 'Behavioural',
      date: '2026-09-25',
      completed: true,
      score: 62,
      earnedWeight: 8,
      maxWeight: 13,
      questions: getHistoricalDomainQuestions('Behavioural'),
      userAnswers: [1, 1, 3, 0, 2],
    },
  ],
  'user-learner-gov': [
    {
      id: 'att-gov-stat-1',
      userId: 'user-learner-gov',
      domain: 'Statistical',
      date: '2026-09-10',
      completed: true,
      score: 88,
      earnedWeight: 13,
      maxWeight: 15,
      questions: getHistoricalDomainQuestions('Statistical'),
      userAnswers: [0, 1, 2, 3, 0],
    },
    {
      id: 'att-gov-tech-1',
      userId: 'user-learner-gov',
      domain: 'Technical',
      date: '2026-09-12',
      completed: true,
      score: 52, // Critical gap in automated coding
      earnedWeight: 7,
      maxWeight: 13,
      questions: getHistoricalDomainQuestions('Technical'),
      userAnswers: [1, 0, 2, 0, 1],
    },
    {
      id: 'att-gov-dig-1',
      userId: 'user-learner-gov',
      domain: 'Digital',
      date: '2026-09-15',
      completed: true,
      score: 72,
      earnedWeight: 10,
      maxWeight: 14,
      questions: getHistoricalDomainQuestions('Digital'),
      userAnswers: [2, 1, 0, 3, 2],
    },
    {
      id: 'att-gov-beh-1',
      userId: 'user-learner-gov',
      domain: 'Behavioural',
      date: '2026-09-18',
      completed: true,
      score: 82,
      earnedWeight: 12,
      maxWeight: 15,
      questions: getHistoricalDomainQuestions('Behavioural'),
      userAnswers: [0, 2, 1, 3, 1],
    },
  ],
  'user-learner-private': [
    {
      id: 'att-priv-tech-1',
      userId: 'user-learner-private',
      domain: 'Technical',
      date: '2026-08-30',
      completed: true,
      score: 86,
      earnedWeight: 13,
      maxWeight: 15,
      questions: getHistoricalDomainQuestions('Technical'),
      userAnswers: [1, 2, 3, 0, 1],
    },
    {
      id: 'att-priv-stat-1',
      userId: 'user-learner-private',
      domain: 'Statistical',
      date: '2026-09-02',
      completed: true,
      score: 64, // Needs official stats & survey methodology
      earnedWeight: 9,
      maxWeight: 14,
      questions: getHistoricalDomainQuestions('Statistical'),
      userAnswers: [0, 1, 3, 2, 0],
    },
    {
      id: 'att-priv-dig-1',
      userId: 'user-learner-private',
      domain: 'Digital',
      date: '2026-09-05',
      completed: true,
      score: 80,
      earnedWeight: 12,
      maxWeight: 15,
      questions: getHistoricalDomainQuestions('Digital'),
      userAnswers: [2, 0, 1, 3, 2],
    },
    {
      id: 'att-priv-beh-1',
      userId: 'user-learner-private',
      domain: 'Behavioural',
      date: '2026-09-08',
      completed: true,
      score: 76,
      earnedWeight: 11,
      maxWeight: 14,
      questions: getHistoricalDomainQuestions('Behavioural'),
      userAnswers: [1, 2, 0, 1, 3],
    },
  ],
};

export const SEED_INITIAL_GAPS: Record<string, GapAnalysis> = {
  'user-learner-student': {
    id: 'gap-student-init',
    userId: 'user-learner-student',
    timestamp: '2026-09-25T14:30:00Z',
    strengths: [
      'Strong technical problem solving and algorithm analysis (Score: 78).',
      'Solid command of digital tools and cloud workflows.',
      'Active curiosity regarding national e-governance initiatives.',
    ],
    gaps: [
      {
        domain: 'Statistical',
        skill: 'Survey Sampling & NSSO Methodology',
        severity: 'High',
        reason: 'Current score of 55 is 20 points below the target threshold of 75. Crucial for public policy research fellowships.',
      },
      {
        domain: 'Behavioural',
        skill: 'Public Administrative Ethics & Stakeholder Negotiation',
        severity: 'Medium',
        reason: 'Current score of 62 is below target of 65. Formal communication and consensus building require refinement.',
      },
      {
        domain: 'Digital',
        skill: 'Digital Public Infrastructure (India Stack Standards)',
        severity: 'Low',
        reason: 'Current score of 68 is marginally below the 70 benchmark target.',
      },
    ],
    summary: 'The learner demonstrates commendable computer science fundamentals but requires prioritized immersion in survey sampling frameworks and official statistics before applying for national research fellowships.',
    priorityOrder: [
      'Survey Sampling & Probability Estimation',
      'Official Statistics of India Standards',
      'Public Governance Communication',
    ],
    domainScores: { Technical: 78, Statistical: 55, Digital: 68, Behavioural: 62 },
    targetScores: { Technical: 75, Statistical: 75, Digital: 70, Behavioural: 65 },
    overallScore: 66,
  },
};

export const SEED_INITIAL_LEARNING_PATH: Record<string, LearningPath> = {
  'user-learner-student': {
    id: 'path-student-init',
    userId: 'user-learner-student',
    title: 'Bridge to Official Statistics & Fellowship Readiness Path',
    careerGoal: 'Secure a fellowship or Junior Statistical Officer role with MoSPI or NITI Aayog.',
    createdAt: '2026-09-26T10:00:00Z',
    updatedAt: '2026-10-02T16:00:00Z',
    progressPercent: 37,
    isCompleted: false,
    steps: [
      {
        id: 'step-1',
        title: 'Essentials of Data Science With R Software - 2: Sampling Theory and Linear Regression',
        domain: 'Statistical',
        type: 'Course',
        estimatedDuration: '8 Weeks',
        source: 'SWAYAM',
        rationale: 'Directly addresses your primary high-severity gap in sampling design and probability estimation.',
        status: 'Completed',
        courseId: 'nptel-stat-102',
      },
      {
        id: 'step-2',
        title: 'Official Statistics and National Statistical System Induction Programme',
        domain: 'Statistical',
        type: 'Course',
        estimatedDuration: '6 Weeks',
        source: 'iGOT Karmayogi',
        rationale: 'Builds proficiency in standard MoSPI indices (CPI, IIP) required for technical fellowship interviews.',
        status: 'In progress',
        courseId: 'mospi-nssta-401',
      },
      {
        id: 'step-3',
        title: 'Descriptive Statistics with R Software',
        domain: 'Statistical',
        type: 'Practice',
        estimatedDuration: '4 Weeks',
        source: 'NCS',
        rationale: 'Translates raw survey microdata into actionable charts and policy-ready briefs.',
        status: 'In progress',
        courseId: 'nptel-stat-103',
      },
      {
        id: 'step-4',
        title: 'Essentials of Data Science With R Software - 1: Probability and Statistical Inference',
        domain: 'Statistical',
        type: 'Course',
        estimatedDuration: '12 Weeks',
        source: 'NPTEL',
        rationale: 'Strengthens formal hypothesis testing and ANOVA methods.',
        status: 'Not started',
        courseId: 'nptel-stat-101',
      },
      {
        id: 'step-5',
        title: 'Code of Conduct for Government Employees',
        domain: 'Behavioural',
        type: 'Course',
        estimatedDuration: '6 Weeks',
        source: 'SWAYAM',
        rationale: 'Bridges behavioural communication gap for multi-agency fellowship collaboration.',
        status: 'Not started',
        courseId: 'igot-gov-301',
      },
      {
        id: 'step-6',
        title: 'Practice Lab: Replicate NSSO Household Consumption Survey Variance Table',
        domain: 'Statistical',
        type: 'Practice',
        estimatedDuration: '10 Hours',
        source: 'AI-suggested',
        rationale: 'AI-suggested practical exercise: Calculate Jackknife and Bootstrap standard errors on sample microdata.',
        status: 'Not started',
        isAiSuggested: true,
      },
      {
        id: 'step-7',
        title: 'Data-Driven Decision Making for Government Professionals',
        domain: 'Digital',
        type: 'Training Programme',
        estimatedDuration: '6 Weeks',
        source: 'iGOT Karmayogi',
        rationale: 'Recommended by Dr. Anita Rao to master DPI citizen data flow standards.',
        status: 'Not started',
        isMentorRecommended: true,
        courseId: 'igot-gov-302',
      },
    ],
  },
};

export const SEED_MENTORSHIPS: Mentorship[] = [
  {
    id: 'mentorship-1',
    mentorId: 'mentor-1',
    mentorName: 'Dr. Anita Rao',
    mentorUserId: 'user-mentor-1',
    learnerId: 'user-learner-student',
    learnerName: 'Aarav Sharma',
    learnerProfileType: 'Student',
    goalMessage: 'Respected Ma\'am, I am a final-year student aiming for a MoSPI research fellowship. I would like your guidance on mastering official survey sampling methodologies.',
    status: 'Accepted',
    requestedAt: '2026-09-27T08:15:00Z',
    meetingSchedule: 'Bi-weekly advisory check-ins via portal messages',
    feedbackNotes: [
      'Initial Review: Aarav has robust algorithmic logic. I recommend prioritizing Course #nptel-stat-102 and focusing especially on stratified multistage sampling before taking up complex time series.',
      'Directive: Please practice calculating design effects (DEFF) on public household survey tables from the MoSPI data archive.',
    ],
    recommendedSteps: [
      {
        id: 'step-7',
        title: 'Digital Public Infrastructure & India Stack Integration',
        domain: 'Digital',
        type: 'Training Programme',
        estimatedDuration: '6 Weeks',
        source: 'iGOT Karmayogi',
        rationale: 'Understanding DigiLocker and consent architecture will make your survey modernization proposal stand out.',
        status: 'Not started',
        isMentorRecommended: true,
        courseId: 'igot-gov-302',
      },
    ],
  },
  {
    id: 'mentorship-2',
    mentorId: 'mentor-2',
    mentorName: 'Rajesh Kulkarni',
    mentorUserId: 'user-mentor-2',
    learnerId: 'user-learner-gov',
    learnerName: 'Priya Verma',
    learnerProfileType: 'Government Employee',
    goalMessage: 'Sir, I am preparing for the upcoming Senior Statistical Officer modernization track. Seeking guidance on automated Python microdata pipelines.',
    status: 'Completed',
    requestedAt: '2026-08-10T11:00:00Z',
    meetingSchedule: 'Monthly technical audit',
    feedbackNotes: [
      'Priya has successfully integrated pandas and database pipelines into her section workflow.',
    ],
    rating: 5,
    ratingComment: 'Excellent practical architectural advice. Helped our team transition from manual spreadsheets to automated SQL queries.',
  },
];

export const SEED_DIRECT_MESSAGES: DirectMessage[] = [
  {
    id: 'msg-1',
    mentorshipId: 'mentorship-1',
    senderId: 'user-learner-student',
    senderName: 'Aarav Sharma',
    senderRole: 'learner',
    text: 'Good morning Dr. Rao. I have completed the first four modules of the Survey Sampling course on SWAYAM. Should I proceed directly to stratified variance estimation?',
    timestamp: '2026-09-29T10:15:00Z',
  },
  {
    id: 'msg-2',
    mentorshipId: 'mentorship-1',
    senderId: 'user-mentor-1',
    senderName: 'Dr. Anita Rao',
    senderRole: 'mentor',
    text: 'Well done Aarav. Yes, ensure you clearly understand how the Horvitz-Thompson estimator behaves when selection probabilities differ across primary sampling units (PSUs). Let me know once you complete that chapter.',
    timestamp: '2026-09-29T14:40:00Z',
  },
  {
    id: 'msg-3',
    mentorshipId: 'mentorship-1',
    senderId: 'user-learner-student',
    senderName: 'Aarav Sharma',
    senderRole: 'learner',
    text: 'Thank you Ma\'am! I have added the DPI India Stack module as you recommended in my learning path.',
    timestamp: '2026-09-30T09:00:00Z',
  },
];

// Helper to seed 65 realistic sample employees across 5 departments for Admin Analytics
export function generateSeedOrgEmployees(): OrgEmployee[] {
  const departments = [
    'Department of Economic Statistics & Census',
    'IT & Digital Infrastructure Division',
    'Planning, Policy & Strategic Administration',
    'National Data Analytics Cell',
    'Quality Assurance & Field Operations',
  ];

  const designations = [
    'Junior Statistical Officer',
    'Assistant Section Officer',
    'Senior Data Engineer',
    'Research Associate',
    'Quality Audit Supervisor',
    'Senior Statistical Officer',
    'Deputy Director of Statistics',
    'E-Governance Lead',
  ];

  const firstNames = [
    'Rohan', 'Sneha', 'Manish', 'Anjali', 'Kunal', 'Deepa', 'Suresh', 'Pooja',
    'Arjun', 'Meenakshi', 'Gaurav', 'Ritu', 'Naveen', 'Swati', 'Alok', 'Divya',
    'Karthik', 'Sunita', 'Vikas', 'Rashmi', 'Prateek', 'Shreya', 'Amit', 'Neha',
    'Varun', 'Pallavi', 'Siddharth', 'Tanvi', 'Abhishek', 'Monika', 'Devendra', 'Kavita',
    'Hemant', 'Jyoti', 'Tarun', 'Archana', 'Ashok', 'Bhavna', 'Chetan', 'Geeta',
    'Dinesh', 'Ila', 'Jitendra', 'Kalpana', 'Lalit', 'Madhavi', 'Nitin', 'Preeti',
    'Rahul', 'Sarita', 'Sachin', 'Usha', 'Vivek', 'Vandana', 'Yogesh', 'Zoya',
    'Bhupesh', 'Chitra', 'Eshwar', 'Gauri', 'Hari', 'Indu', 'Jayant', 'Kalyani', 'Lokendra'
  ];

  const lastNames = [
    'Gupta', 'Iyer', 'Patel', 'Singh', 'Choudhury', 'Reddy', 'Banerjee', 'Mishra',
    'Nair', 'Saxena', 'Deshmukh', 'Bhat', 'Joshi', 'Chauhan', 'Menon', 'Das',
    'Pandey', 'Agarwal', 'Verma', 'Kaur', 'Soni', 'Trivedi', 'Bose', 'Rathore'
  ];

  const employees: OrgEmployee[] = [];

  for (let i = 0; i < 65; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3 + 2) % lastNames.length];
    const dept = departments[i % departments.length];
    const desig = designations[(i * 2 + 1) % designations.length];
    
    // Vary scores by department profile
    let baseTech = 65;
    let baseStat = 65;
    let baseDig = 65;
    let baseBeh = 65;

    if (dept === 'Department of Economic Statistics & Census') {
      baseStat = 78;
      baseTech = 58;
      baseDig = 62;
      baseBeh = 68;
    } else if (dept === 'IT & Digital Infrastructure Division') {
      baseTech = 82;
      baseDig = 80;
      baseStat = 56;
      baseBeh = 64;
    } else if (dept === 'Planning, Policy & Strategic Administration') {
      baseBeh = 82;
      baseStat = 70;
      baseDig = 66;
      baseTech = 52;
    } else if (dept === 'National Data Analytics Cell') {
      baseTech = 76;
      baseStat = 84;
      baseDig = 75;
      baseBeh = 70;
    } else {
      // Quality Assurance & Field Operations
      baseBeh = 74;
      baseStat = 66;
      baseDig = 58;
      baseTech = 54;
    }

    // Add deterministic variance
    const delta1 = ((i * 7) % 21) - 10;
    const delta2 = ((i * 11) % 21) - 10;
    const delta3 = ((i * 13) % 21) - 10;
    const delta4 = ((i * 17) % 21) - 10;

    const scores = {
      Technical: Math.max(30, Math.min(98, baseTech + delta1)),
      Statistical: Math.max(30, Math.min(98, baseStat + delta2)),
      Digital: Math.max(30, Math.min(98, baseDig + delta3)),
      Behavioural: Math.max(30, Math.min(98, baseBeh + delta4)),
    };

    // Critical gaps: scores < 70
    const criticalGapsCount = Object.values(scores).filter((s) => s < 70).length;

    const trainingStatuses: ('Completed' | 'In progress' | 'Not started')[] = [
      'Completed', 'In progress', 'Completed', 'Not started', 'In progress'
    ];

    const participationStatuses: ('Active' | 'Pending' | 'Exempt')[] = [
      'Active', 'Active', 'Active', 'Pending', 'Active'
    ];

    employees.push({
      id: `emp-2026-${String(i + 1).padStart(3, '0')}`,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@statskill.gov.in`,
      department: dept,
      designation: desig,
      profileType: 'Government Employee',
      scores,
      participationStatus: participationStatuses[i % participationStatuses.length],
      trainingStatus: trainingStatuses[i % trainingStatuses.length],
      criticalGapsCount,
      lastAssessmentDate: `2026-09-${String((i % 25) + 1).padStart(2, '0')}`,
    });
  }

  return employees;
}

export const SEED_SESSION_BOOKINGS: MentorshipSessionBooking[] = [
  {
    id: 'booking-live-demo-1',
    sessionId: 'session-live-rahul',
    meetingId: 'LIVE-DSA-8921',
    studentId: 'user-learner-student',
    studentName: 'Aarav Sharma',
    mentorId: 'mentor-rahul',
    mentorName: 'Rahul Sharma',
    mentorTitle: 'Competitive Programming Specialist & Senior SDE',
    skillDomain: 'Technical',
    topic: 'DSA – Binary Trees & Recursive Traversals',
    date: '2026-10-31',
    timeSlot: '06:00 PM',
    durationMinutes: 5,
    price: 10,
    paymentStatus: 'Successful',
    sessionStatus: 'Upcoming',
    createdAt: '2026-10-30T10:00:00Z',
  },
  {
    id: 'booking-completed-1',
    sessionId: 'session-completed-anita',
    meetingId: 'LIVE-STAT-3401',
    studentId: 'user-learner-student',
    studentName: 'Aarav Sharma',
    mentorId: 'mentor-1',
    mentorName: 'Dr. Anita Rao',
    mentorTitle: 'Senior Principal Statistician & NEP Educational Advisor',
    skillDomain: 'Statistical',
    topic: 'Survey Sampling – Variance Estimation in NSSO Multi-Stage Surveys',
    date: '2026-10-25',
    timeSlot: '05:00 PM',
    durationMinutes: 5,
    price: 15,
    paymentStatus: 'Successful',
    sessionStatus: 'Completed',
    createdAt: '2026-10-24T14:30:00Z',
    completedAt: '2026-10-25T17:05:00Z',
  },
];

export const SEED_SESSION_FEEDBACKS: Record<string, MentorshipFeedbackRecord> = {
  'session-completed-anita': {
    id: 'fb-1',
    bookingId: 'booking-completed-1',
    sessionId: 'session-completed-anita',
    mentorId: 'mentor-1',
    studentId: 'user-learner-student',
    studentUnderstanding: 'High competence in basic stratified formulas; needs focused practice with complex multistage cluster weights.',
    strengths: [
      'Strong mathematical foundation in probability',
      'Quickly identifies sampling bias in simple random sampling',
      'Good conceptual clarity on design effects (DEFF)',
    ],
    weaknesses: [
      'Needs practice with finite population correction factors',
      'Cluster variance calculation edge cases under non-response',
    ],
    recommendedTopics: [
      'Multistage Sampling',
      'NSSO Survey Methodology',
      'Stratified Cluster Design',
    ],
    nextTasks: [
      'Solve 5 Variance Estimation problems from MoSPI handbook',
      'Revise Stratified vs Cluster sampling formulas',
      'Complete NSSO Unit 3 practice quiz',
    ],
    personalMessage: 'You have tremendous potential for the MoSPI fellowship Aarav. Focus on cluster weight calculations and you will excel in the technical interview.',
    rating: 5,
    review: 'Dr. Anita Rao’s real-world explanation of survey variance made the entire concept click for me!',
    isHelpful: true,
    skillBoostPoints: 5,
    skillBoostDomain: 'Statistical',
    previousScore: 60,
    updatedScore: 65,
    createdAt: '2026-10-25T17:46:00Z',
  },
};
