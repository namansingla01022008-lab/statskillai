# StatSkillAI — Complete Platform Documentation

> **AI-Powered Competency Measurement, Skill-Gap Diagnostic & Career Development Platform**
> Aligned with NEP 2020 & Mission Karmayogi · CU Hackathon 2026

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Learner Features](#3-learner-features)
4. [Mentor Features](#4-mentor-features)
5. [Admin Features](#5-admin-features)
6. [Security & Authentication](#6-security--authentication)
7. [API Reference](#7-api-reference)
8. [Setup & Deployment](#8-setup--deployment)
9. [Codebase Structure](#9-codebase-structure)
10. [Future Features Roadmap](#10-future-features-roadmap)

---

## 1. Platform Overview

StatSkillAI is a full-stack, production-ready web application that bridges the gap between **competency assessment** and **career development** for India's workforce. Built on real-time AI (Google Gemini), it serves three user cohorts aligned with NEP 2020 and Mission Karmayogi.

### Key Metrics

| Metric | Value |
|--------|-------|
| User Roles | 3 (Learner, Mentor, Admin) |
| Competency Domains | 4 (Technical, Statistical, Digital, Behavioural) |
| Database Models | 16 |
| API Route Modules | 10 |

### User Roles

| Role | Profile | Goal |
|------|---------|------|
| Learner | Students, Govt. Employees, Private-Sector Professionals | Assess skills, close gaps, earn opportunities |
| Mentor | Verified domain experts (ISI, NIC, MOSPI) | Guide mentees via directives & live messaging |
| Admin | Institutional administrators (NSDC, MoSPI) | Monitor workforce, manage catalogs & applicants |

### Problems Solved

- No objective skill measurement across 4 competency domains
- Disconnected workforce data (no real-time institutional analytics)
- Fragmented course catalogs (SWAYAM / NPTEL / iGOT are siloed)
- Static assessments with no feedback loop to career matching

### Solution Highlights

- AI-adaptive psychometric evaluations across 4 domains
- Automated gap analysis with severity classification (High / Medium / Low)
- Personalised learning pathways from verified Indian national portals
- Real-time 1-on-1 mentorship via Socket.io with typing indicators
- Institutional workforce heatmaps with AI policy advisories
- AI-generated MCQs from uploaded PDFs or pasted text
- Bilingual interface (English / Hindi) + WCAG 2.1 AA accessibility

---

## 2. Technical Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript + Vite 8 | SPA with full type-safety |
| UI & Styling | Tailwind CSS 4 | Responsive, accessible design |
| Charting | Recharts 3 | Radar, line, bar, heatmap charts |
| Animations | Motion (Framer Motion v12) | Page transitions |
| Backend | Node.js 25 + Express 4.21 | REST API + middleware |
| Real-Time | Socket.io 4.8 | JWT-authenticated WebSocket channels |
| Database ORM | Prisma 6.19 + PostgreSQL | Type-safe DB access + migrations |
| AI | @google/genai v2.4 (Gemini) | Question gen, gap analysis, AI chat |
| Auth | JWT + bcryptjs | Dual-token sessions (7-day + 30-day) |
| Security | Helmet + express-rate-limit | Headers, DDoS, brute-force protection |

### System Architecture

```
Browser (React SPA)
  +-- ApiService (JWT Bearer) + Socket.io Client
        ¦
        ? HTTPS / WSS
Express Server (server.ts)
  +-- Helmet · CORS · Rate Limiter
  +-- JWT Middleware (authenticate) · requireRole (RBAC)
  +-- /api/auth  /api/profile  /api/assessments  /api/gaps
  +-- /api/paths /api/courses  /api/opportunities /api/mentorship
  +-- /api/analytics  /api/quizzes  /api/gemini/*
  +-- Socket.io 4.8 (WebSocket rooms)
  +-- Gemini AI Proxy (multi-model fallback)
        ¦                    ¦
  PostgreSQL (16 tables)   Google Gemini API
```

### Gemini AI Model Fallback Chain

```
GEMINI_MODEL env var ? gemini-3.5-flash ? gemini-3-flash-preview
  ? gemini-3.1-flash-lite ? gemini-3.8-flash ? Local Offline Fallback
```

### Database Models (16)

| Model | Purpose |
|-------|---------|
| User | Base identity for all roles |
| LearnerProfile | Competency targets & career goals |
| AssessmentAttempt | Full per-attempt record with scoring |
| QuestionRecord | Offline MCQ bank |
| GapAnalysis | AI diagnostic report (upsert per user) |
| LearningPath | Sequenced skill progression container |
| LearningStep | Individual step with domain & status |
| Course | National course catalog (SWAYAM/NPTEL) |
| Opportunity | Jobs, fellowships, internships |
| Application | Candidate applications with pipeline |
| Mentor | Verified expert profiles |
| Mentorship | Active mentor-learner relationships |
| DirectMessage | Real-time message threads |
| QuizRecord | AI quiz history with scores |
| Organisation | Nodal government entities |
| AppSettings | Per-user a11y & locale preferences |

---

## 3. Learner Features

### Feature 1 — AI-Adaptive Competency Assessment

5-question adaptive psychometric assessment per domain. Difficulty adjusts in real time.

**Scoring:**
- Starts at Medium difficulty (2 pts)
- Correct ? Hard (3 pts) | Wrong ? Easy (1 pt)
- `Final Score = (Earned Weight / Max Weight) × 100`

**Capabilities:**
- Gemini AI generates unique questions per domain, difficulty, and profile type
- 60+ offline fallback MCQs if Gemini unavailable
- 60-second per-question timer (auto-submit, togglable)
- Immediate gap recalculation server-side after submission

### Feature 2 — AI Skill-Gap Analysis Engine

```
Assessment scores ? Compare vs. targets ? Classify severity
  ? Gemini synthesizes summary ? Persist to DB ? Radar chart
```

| Severity | Condition | Action |
|----------|-----------|--------|
| High | Target - Current >= 25 pts | First priority |
| Medium | 15 <= gap < 25 pts | Secondary priority |
| Low | gap < 15 pts | Maintenance |

### Feature 3 — Personalised Learning Path Generator

Gemini synthesizes a 6-10 step pathway mapped to SWAYAM / NPTEL / iGOT / NCS courses.

- Mentor-recommended steps preserved across AI regenerations
- Step statuses: Not started ? In progress ? Completed (DB persisted)
- Domain filter + progress percentage auto-calculated

### Feature 4 — AI Document Quiz Generator

Upload PDF (max 10 MB) or paste text ? Gemini generates custom MCQs.

| Option | Values |
|--------|--------|
| Input | PDF upload or plain text |
| Count | 1-10 questions |
| Difficulty | Easy / Medium / Hard / Mixed |
| History | All quizzes persisted to DB |
| Export | Download as .txt |

### Feature 5 — Career Opportunity Matching

**Match Formula:**
```
Match % = (Skill Overlap × 55%) + (Domain Level Ratio × 45%)
          clamped between 45% and 98%
```
- Real-time Socket.io status notifications when admin changes pipeline

### Feature 6 — Human Mentorship Platform

- Directory of verified domain experts; filter by field and language
- Real-time 1-on-1 DM via Socket.io with typing indicators
- Mentor directives and course recommendations preserved in learning path
- Star rating and comments after completing mentorship

### Feature 7 — Floating AI Learning Assistant

Persistent Gemini chat assistant (bottom-right) contextually aware of domain scores, gaps, and career goals. Full history persists across sessions.

---

## 4. Mentor Features

| Feature | Description |
|---------|-------------|
| Mentee Roster Dashboard | View pending requests and active mentees; accept/decline |
| Mentee Profile Drilldown | Full read access to radar chart, scores, gaps, learning path |
| Written Directives | Issue notes stored in Mentorship record; Socket.io notification to learner |
| Course Recommendations | Add catalog course as mentor-recommended step (preserved on regeneration) |
| Direct Message Thread | Real-time Socket.io chat with typing indicators; messages persisted |
| Row-Level Security | Only assigned mentor-mentee pair can access thread (403 otherwise) |

---

## 5. Admin Features

### Workforce Analytics Dashboard

- Heatmap: Department x Domain (Critical / Moderate / Target Met / Advanced)
- Click any cell ? individual employee drill-down
- Privacy Mode: anonymise names (DPDP Act compliance)
- KPI widgets, bar + line charts
- Gemini AI generates institutional risk advisory with session cache
- CSV export for offline reporting

### Catalog Manager

Create / Delete courses (SWAYAM/NPTEL/iGOT) and opportunities (jobs, fellowships).

### Applicant Tracking Pipeline

```
Submitted ? Under Review ? Shortlisted ? Closed
```
Each status change sends real-time Socket.io toast to learner.

### Other Admin Powers

- Mentor verification (grant/revoke badge + date stamp)
- System settings: language, high-contrast, font size
- Factory data reset (restore demo state)

---

## 6. Security & Authentication

### Auth Flow

1. Register/Login ? bcrypt 12-round hash ? JWT access token (7d) + refresh token (30d)
2. HTTP-only cookies + Bearer header
3. Auto-refresh via `POST /api/auth/refresh`
4. Socket.io: JWT required in handshake; unauthenticated connections rejected

### Password Rules

Min 8 chars, Max 128, requires uppercase + lowercase + digit + special character.

### Security Middleware

- Helmet (security headers)
- CORS (credentials enabled)
- Rate limiter: 100 req/15min (auth), 300 req/min (API)
- express-json limit: 25 MB (for PDF base64 payloads)

---

## 7. API Reference

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | None | Register; returns JWT tokens |
| POST | /api/auth/login | None | Login; returns JWT tokens |
| GET | /api/auth/me | JWT | Verify session |
| POST | /api/auth/refresh | Refresh JWT | Issue new access token |
| POST | /api/auth/logout | JWT | Clear session cookies |
| POST | /api/auth/demo-switch | None | Issue JWT for any seed user |

### Core Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET/PUT | /api/profile | learner | Profile CRUD |
| GET | /api/profile/domain-scores | learner | Latest scores per domain |
| POST | /api/assessments/submit | learner | Submit + trigger gap recalc |
| GET/POST | /api/gaps | learner | Gap analysis get + save |
| GET/POST | /api/paths | learner | Path get + save (mentor steps preserved) |
| PATCH | /api/paths/steps/:id/status | learner | Update step status |
| GET | /api/courses | public | Course catalog |
| POST/DELETE | /api/courses | admin | Create/delete course |
| POST | /api/opportunities/:id/apply | learner | Submit application |
| GET | /api/analytics/workforce | admin | Workforce roster + KPIs |
| POST | /api/gemini/generate | JWT | Proxy Gemini (with fallback) |
| GET | /api/health | public | Health check |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| join_mentorship | Client ? Server | Join message room |
| typing_start/stop | Client ? Server | Typing indicator |
| new_message | Server ? Client | Real-time message delivery |
| user_notification | Server ? Client | Toast for status updates |

---

## 8. Setup & Deployment

### Local Development

```bash
git clone https://github.com/yourrepo/statskillai.git
cd statskillai
npm install
cp .env.example .env          # fill GEMINI_API_KEY, DATABASE_URL, JWT_SECRET
npx prisma db push
npx tsx prisma/seed.ts
npm run dev                   # ? http://localhost:3000
```

### Required Env Variables

| Variable | Required | Notes |
|----------|----------|-------|
| GEMINI_API_KEY | Yes | Get from aistudio.google.com |
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | Min 32 chars |
| PORT | No | Default: 3000 |
| NODE_ENV | No | Set to "production" for dist/ serving |

### Production Deployment

| Service | Provider | Config |
|---------|----------|--------|
| Frontend | Vercel | Build: npm run build, Output: dist/ |
| Backend | Render | Start: npm start, set all env vars |
| Database | Neon / Supabase | Free PostgreSQL tier |

### Demo Accounts (Default password: DemoPassword123!)

| Role | Name | Email |
|------|------|-------|
| Learner | Aarav Sharma (Student) | aarav.sharma@univ.edu.in |
| Learner | Priya Verma (Govt) | priya.verma@mospi.gov.in |
| Learner | Vikram Malhotra (Private) | vikram.m@analyticscloud.in |
| Mentor | Dr. Anita Rao | dr.anita.rao@isical.ac.in |
| Mentor | Rajesh Kulkarni | rajesh.kulkarni@nic.in |
| Admin | Sunil Mehta | sunil.mehta@nsdcindia.org |

---

## 9. Codebase Structure

```
statskillai/
+-- server.ts               # Express + Vite server entry
+-- package.json            # Dependencies & scripts
+-- tsconfig.json           # TypeScript config
+-- vite.config.ts          # Vite bundler config
+-- index.html              # SPA root HTML
¦
+-- prisma/
¦   +-- schema.prisma       # 16-model PostgreSQL schema
¦   +-- seed.ts             # Idempotent demo data seeder
¦
+-- server/
¦   +-- db.ts               # Prisma singleton
¦   +-- socket.ts           # Socket.io init + room helpers
¦   +-- middleware/auth.ts  # JWT, RBAC, password validation
¦   +-- routes/
¦       +-- auth.ts         # Auth endpoints
¦       +-- profile.ts      # Profile CRUD
¦       +-- assessments.ts  # Attempts + submit + gap recalc
¦       +-- gaps.ts         # Gap analysis upsert
¦       +-- paths.ts        # Learning path + step status
¦       +-- courses.ts      # Course catalog CRUD
¦       +-- opportunities.ts# Opportunities + applications
¦       +-- mentorship.ts   # Mentors, mentorships, DMs
¦       +-- analytics.ts    # Workforce analytics
¦       +-- quizzes.ts      # Quiz history
¦
+-- src/
    +-- main.tsx            # React bootstrap
    +-- App.tsx             # Routes, ProtectedRoute, layout
    +-- types/index.ts      # All TypeScript interfaces
    +-- constants/          # competency.ts, translations.ts
    +-- context/AppContext.tsx  # Global auth + socket state
    +-- services/
    ¦   +-- apiService.ts   # REST client + Socket.io manager
    ¦   +-- geminiService.ts# All Gemini AI calls
    ¦   +-- aiPrompts.ts    # Gemini prompt templates
    ¦   +-- aiFallbacks.ts  # 60+ offline MCQ bank
    ¦   +-- storageService.ts # LocalStorage cache
    +-- components/
    ¦   +-- common/         # Header, Sidebar, ScoreBadge, etc.
    ¦   +-- learner/        # RadarChart, HistoryChart, FloatingAssistant
    ¦   +-- admin/          # SkillGapHeatmap, DrilldownModal
    +-- pages/
        +-- learner/        # Dashboard, Assessment, Gaps, Path, Quiz,
        ¦                   # Opportunities, Mentorship, Profile
        +-- mentor/         # MentorDashboard, MenteeDetailPage
        +-- admin/          # Analytics, Catalog, Applicants, Mentors, Settings
```

---

## 10. Future Features Roadmap

### High Priority

#### 1. Email Notifications (Nodemailer + SendGrid)
Users offline miss Socket.io notifications. Install `nodemailer` + `@sendgrid/mail`. Create `server/services/emailService.ts`. Trigger on application status change and mentorship accept/decline. Add `SENDGRID_API_KEY` to .env.

#### 2. Verifiable Digital Certificates
Generate downloadable PDF competency certificates when learner completes path or scores = 75. Use `pdf-lib` server-side. Create `GET /api/certificates/:userId`. Add `Certificate` Prisma model with UUID verification URL.

#### 3. Video Call Integration (WebRTC)
Enable mentor-mentee video calls inside the mentorship thread. Integrate Whereby Embedded SDK or 100ms.live. Render meeting URL in an iframe in `MentorshipPage.tsx`.

#### 4. Server-Side PDF Text Extraction
Install `pdf-parse`. Create `POST /api/quizzes/parse-pdf` multipart endpoint. Extract text before sending to Gemini — reduces payload size and cost significantly.

---

### Medium Priority

#### 5. Gamification — Badges, Streaks & Leaderboard
Add `Badge` Prisma model. Award badges for performance and consistency. Add opt-in leaderboard. Display in `ProfilePage.tsx` and `LearnerDashboard.tsx`.

#### 6. Multilingual Expansion (Tamil, Telugu, Bengali)
Extend `src/constants/translations.ts`. Add language selector in `Header.tsx`. Pass language to Gemini prompts in `aiPrompts.ts` (already structured for this).

#### 7. SWAYAM / NPTEL Live Course Sync
Daily cron job (node-cron) in `server.ts` to fetch and upsert courses from SWAYAM open API into the Prisma `Course` table automatically.

#### 8. Mobile App (React Native / Expo)
Bootstrap with `expo init`. Reuse all `src/services/` and `src/types/` TypeScript. Replace Tailwind with NativeWind. Add Firebase Cloud Messaging for push notifications.

#### 9. Predictive Scoring Analytics
Python/FastAPI microservice. Train linear regression on domain x attempt x time. Expose `POST /api/analytics/predict`. Render forecast chart in `LearnerDashboard.tsx`.

---

### Long-Term Vision

| Feature | Description |
|---------|-------------|
| UPI Mentorship Marketplace | Paid mentor slots via Razorpay; platform fee model |
| Blockchain Credential Registry | Verifiable credentials on Hyperledger Fabric / Polygon |
| DigiLocker Integration | Pull educational certs via UIDAI OAuth; auto-fill profiles |
| Voice AI Tutor | Google STT + TTS for voice-based assessment (rural users) |

---

*StatSkillAI · CU Hackathon 2026 · React 19 · Express · PostgreSQL · Prisma · Google Gemini · Socket.io*
