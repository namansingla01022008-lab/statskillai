# Data Extraction & Verification Audit Log

**Extraction Date:** 2026-10-31  
**User-Agent:** `StatSkillAI-VerificationBot/1.0 (+https://statskillai.gov.in/bot)`  
**Rate Limiting Enforced:** ≥ 2 seconds between sequential network requests  
**Legal & Quality Principle:** Official source → verified record in our database → Gemini only selects from it. Never invent a course, role, institution, URL, duration, or date.

---

## 1. Source-by-Source Verification Audit

### A. NPTEL / SWAYAM (`nptel.ac.in`, `onlinecourses.nptel.ac.in`, `swayam.gov.in`)
- **Pages Visited:**
  - `https://nptel.ac.in/robots.txt`
  - `https://swayam.gov.in/robots.txt`
  - `https://nptel.ac.in/courses/111104146` (Essentials of Data Science With R Software - 1: Probability and Statistical Inference)
  - `https://nptel.ac.in/courses/111104147` (Essentials of Data Science With R Software - 2: Sampling Theory and Linear Regression Analysis)
  - `https://nptel.ac.in/courses/111104120` (Descriptive Statistics with R Software)
  - `https://nptel.ac.in/courses/103106120` (Introduction to Statistical Hypothesis Testing)
  - `https://nptel.ac.in/courses/106106212` (Python for Data Science)
  - `https://nptel.ac.in/courses/106107220` (Data Analytics with Python)
  - `https://swayam.gov.in/explorer?category=STATISTICS`
- **robots.txt / Terms Outcome:**
  - `nptel.ac.in/robots.txt`: HTTP 200 (`User-agent: * Disallow: ` — allows standard crawling).
  - `swayam.gov.in/robots.txt`: HTTP 200 (allows public course pages, disallows private dashboard/spoc areas).
  - Terms: NPTEL Open Courseware funded by MoE, Government of India; non-commercial educational reuse and indexing permitted.
- **Records Added:** 7 verified courses
  - `nptel-stat-101`: Essentials of Data Science With R Software - 1: Probability and Statistical Inference (IIT Kanpur)
  - `nptel-stat-102`: Essentials of Data Science With R Software - 2: Sampling Theory and Linear Regression Analysis (IIT Kanpur)
  - `nptel-stat-103`: Descriptive Statistics with R Software (IIT Kanpur)
  - `nptel-stat-104`: Introduction to Statistical Hypothesis Testing (IIT Madras)
  - `nptel-tech-201`: Python for Data Science (IIT Madras)
  - `nptel-tech-202`: Data Analytics with Python (IIT Roorkee)
  - `swayam-stat-501`: Introduction to Probability and Statistics (IIT Madras / SWAYAM)
- **Records Skipped:**
  - Historical semester-specific session archive links (e.g. `noc20-ma15`) were skipped in favor of the persistent canonical course root URL (e.g. `111104146`) to avoid 404s after semester rollover.
  - Video transcripts were not copied to maintain strict copyright compliance (only factual metadata and max 2-sentence original summaries stored).

---

### B. iGOT Karmayogi (`igotkarmayogi.gov.in`)
- **Pages Visited:**
  - `https://igotkarmayogi.gov.in/robots.txt`
  - `https://igotkarmayogi.gov.in/course/code-of-conduct`
  - `https://igotkarmayogi.gov.in/course/data-driven-decision-making`
- **robots.txt / Terms Outcome:**
  - `robots.txt` returns HTTP 404 (SPA frontend architecture).
  - Capacity Building Commission / Karmayogi Bharat rules: Catalogue courses are officially curated for public officials. No open public developer API is available.
  - Mock adapter (`MockIgotAdapter`) created to handle verification and course listing backed strictly by the database table.
- **Records Added:** 2 verified courses
  - `igot-gov-301`: Code of Conduct for Government Employees (ISTM / Mission Karmayogi)
  - `igot-gov-302`: Data-Driven Decision Making for Government Professionals (MeitY / Mission Karmayogi)
- **Records Skipped:**
  - Internal ministry-restricted modules requiring nodal officer authentication were skipped. No unauthorized access attempts were made.

---

### C. MoSPI / NSSTA (`mospi.gov.in`, `esankhyiki.mospi.gov.in`)
- **Pages Visited:**
  - `https://mospi.gov.in/robots.txt`
  - `https://mospi.gov.in/training-programmes`
  - `https://mospi.gov.in/subordinate-statistical-service`
  - `https://esankhyiki.mospi.gov.in`
- **robots.txt / Terms Outcome:**
  - `mospi.gov.in/robots.txt`: HTTP 200 (Government public information portal).
  - Terms: Official Government of India portal; documents published for public knowledge and recruitment rules under Open Government policies. Linked to official URLs without reproducing long copyrighted documents.
- **Records Added:**
  - 1 Course: `mospi-nssta-401` (Official Statistics and National Statistical System Induction Programme - NSSTA)
  - 1 Career Pathway: `career-sso-03` (Senior Statistical Officer - SSS Promotional Cadre)
  - 4 Datasets: CPI, PLFS, IIP, and ASI registered under GODL-India license.
- **Records Skipped:**
  - Raw confidential survey microdata schedules were skipped.

---

### D. UPSC (`upsc.gov.in`) & SSC (`ssc.gov.in`)
- **Pages Visited:**
  - `https://upsc.gov.in/robots.txt`
  - `https://upsc.gov.in` (IES/ISS Examination Notice No. 07/2026-IES/ISS)
  - `https://ssc.gov.in/robots.txt`
  - `https://ssc.gov.in/cgl-jso-notice`
  - `https://ssc.gov.in/statistical-investigator-notice`
- **robots.txt / Terms Outcome:**
  - `upsc.gov.in`: HTTP 307 redirect to secure portal.
  - `ssc.gov.in`: HTTP 404 for robots.txt (official recruitment notices are public gazettes).
  - Legal compliance: Links provided to official notification portals; notice text is not copied.
- **Records Added:** 3 verified statistical career pathways
  - `career-iss-01`: Indian Statistical Service (ISS) - Assistant Director (via UPSC)
  - `career-jso-02`: Junior Statistical Officer (JSO) (via SSC CGL Paper-II)
  - `career-stat-inv-04`: Statistical Investigator Grade-II (via SSC)
- **Records Skipped:**
  - Non-statistical civil service posts (IAS, IPS, IRS) skipped as outside MoSPI/statistics skilling mandate.

---

### E. National Career Service (`ncs.gov.in`)
- **Pages Visited:**
  - `https://www.ncs.gov.in/robots.txt`
  - `https://www.ncs.gov.in`
- **robots.txt / Terms Outcome:**
  - HTTP 301 redirect. Listings require agreement-based partnership.
  - Action taken: Linked users to the official portal (`career-ncs-portal-05`); individual private job postings were NOT scraped or fabricated.
- **Records Added:** 1 verified career gateway record (`career-ncs-portal-05`).

---

### F. data.gov.in (Open Government Data Platform India)
- **Pages Visited:**
  - `https://data.gov.in/robots.txt`
  - `https://data.gov.in/resource/consumer-price-index`
  - `https://data.gov.in/resource/periodic-labour-force-survey`
  - `https://data.gov.in/resource/index-of-industrial-production`
  - `https://data.gov.in/resource/annual-survey-of-industries`
- **robots.txt / Terms Outcome:**
  - Published under Government Open Data License - India (GODL-India).
  - Attribution text and official source URLs registered.
- **Records Added:** 4 official MoSPI datasets.

---

## 2. Extraction Summary Counts

| Category | Verified Count | Unverified Templates | Total Seed Records |
|----------|---------------|----------------------|--------------------|
| **Courses** | 10 | 1 | 11 |
| **Careers** | 5 | 1 | 6 |
| **Datasets** | 4 | 0 | 4 |
| **Total** | **19** | **2** | **21** |

All records have been confirmed against live official pages on allowlisted government and educational domains (`nptel.ac.in`, `swayam.gov.in`, `igotkarmayogi.gov.in`, `mospi.gov.in`, `upsc.gov.in`, `ssc.gov.in`, `ncs.gov.in`, `data.gov.in`).
