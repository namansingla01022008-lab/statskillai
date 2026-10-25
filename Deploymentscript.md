# Deployment Guide for StatSkillAI

## Overview
This guide walks you through deploying the **StatSkillAI** application as a fully‑functional site.
- **Frontend**: Vite React SPA → Vercel (static hosting)
- **Backend**: Express + Prisma + PostgreSQL → Docker container on Render (or Railway/Koyeb)
- **Database**: Free tier PostgreSQL (Neon or Supabase)
- **Domain (optional)**: Point a custom domain to Vercel and Render.

---

## Prerequisites
1. **Git repository** – Ensure the entire `StatSkillAI` folder is committed to a remote (GitHub/GitLab/Bitbucket).
2. **Vercel account** – Sign‑up at https://vercel.com.
3. **Render (or Railway/Koyeb) account** – Sign‑up at https://render.com (or the equivalent).
4. **PostgreSQL free tier** – Neon (https://neon.tech) or Supabase (https://supabase.com).
5. **Docker** – Installed locally if you wish to test the container before pushing.
6. **Node.js 20+** – Required for building the project.

---

## 1️⃣ Backend Deployment (Render example)
### 1.1 Create PostgreSQL instance
1. Sign‑in to Neon or Supabase and create a new project.
2. Grab the connection string, e.g. `postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require`.
3. **Add** this URL to your Render environment variables as `DATABASE_URL`.

### 1.2 Add required environment variables
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (see step 1.1) |
| `JWT_SECRET`   | Strong random secret (e.g., `openssl rand -hex 32`) |
| `PORT`         | Port used by Render (default `8080`) |
| `NODE_ENV`     | Set to `production` |
| `VITE_API_BASE_URL` | **Frontend** will need this – set it later on Vercel |

### 1.3 Prepare the repository for Render
- The repository already contains a **multi‑stage Dockerfile** (see root `Dockerfile`). No changes required.
- Ensure the `scripts` section in `package.json` contains:
  ```json
  "scripts": {
    "build": "tsc && vite build",
    "start": "node dist/server.js"
  }
  ```

### 1.4 Deploy on Render
1. In Render dashboard, click **+ New** → **Web Service**.
2. Connect your Git repo and select the **branch** (e.g., `main`).
3. Choose **Docker** as the environment.
4. Set **Dockerfile Path** to `Dockerfile` (root).
5. Set **Build Command** to `npm install && npm run build`.
6. Set **Start Command** to `npm start`.
7. Add the environment variables from **1.2**.
8. Leave the **Auto‑Deploy** toggle on.
9. Click **Create Web Service**.

Render will build the Docker image, run migrations (`npx prisma migrate deploy`) and start the server. The service URL will look like `https://statskillai.onrender.com`.

### 1.5 Run Prisma migrations (if not auto‑executed)
If Render does not automatically run migrations, add a **post‑deploy script** in Render settings:
```bash
npx prisma migrate deploy
```

---

## 2️⃣ Frontend Deployment (Vercel)
### 2.1 Set environment variable for API base URL
- After the backend is live (e.g., `https://statskillai.onrender.com`), you need to tell the frontend where to call the API.
- In Vercel, go to **Project Settings → Environment Variables** and add:
  - **Key**: `VITE_API_BASE_URL`
  - **Value**: `https://statskillai-1ffb.onrender.com` (without trailing `/api`)
  - **Environment**: `Production` (and optionally `Preview`/`Development`).
  *(Note: The client now automatically cleans up any trailing `/api` or `/`, preventing `/api/api` 404 errors).*

### 2.2 Deploy the React Vite app
1. In Vercel dashboard, click **New Project** → **Import Git Repository**.
2. Select the same repository (or a fork containing only the `src/` folder). Vercel automatically detects a Vite project.
3. **Root Directory**: leave empty (project root).
4. **Build Command**: `npm install && npm run build`.
5. **Output Directory**: `dist`.
6. Ensure the **Environment Variables** from step 2.1 are attached.
7. Click **Deploy**.

Vercel will output a URL like `https://statskillai.vercel.app`. The site will now communicate with the backend on Render.

---

## 3️⃣ Optional: Custom Domain
1. In Vercel, go to **Domains**, add your custom domain, and follow the DNS instructions (CNAME → `cname.vercel-dns.com`).
2. In Render, add the same domain under **Custom Domains** if you want the API to be reachable on the same hostname (e.g., `api.yourdomain.com`). Configure DNS accordingly (CNAME → Render’s endpoint).
3. Update `VITE_API_BASE_URL` in Vercel to the new API domain.

---

## 4️⃣ Verify the Deployment
1. Open the Vercel URL in a browser.
2. Register a new user (or use the demo accounts seeded by `prisma/seed.ts`).
3. Test the following flows:
   - Login / token refresh
   - Gap analysis generation
   - Learning path progression and competency scoring
   - Real‑time mentorship chat (ensure messages appear instantly)
   - Workforce analytics dashboard (AI insights cached)
4. Check the backend logs on Render for any errors.

---

## 5️⃣ Maintenance & Updates
- **Push to main** → Render and Vercel will automatically rebuild and redeploy.
- To run **local Docker** for testing before pushing:
  ```bash
  docker build -t statskillai .
  docker run -p 8080:8080 -e DATABASE_URL=<your‑local‑db> -e JWT_SECRET=<secret> statskillai
  ```
- Keep dependencies up‑to‑date: `npm outdated` → update → commit → push.
- Periodically rotate `JWT_SECRET` and update both services.

---

## 6️⃣ Troubleshooting
| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| 502/504 on Vercel | Backend URL unreachable or CORS misconfiguration | Verify `VITE_API_BASE_URL` and that Render’s service is running. Add CORS headers if needed (`app.use(cors({origin: '*'}))`). |
| Auth fails after deployment | `JWT_SECRET` mismatch between front‑end and back‑end | Ensure the same secret is set in Render env and that the front‑end does not embed the secret (it’s only server‑side). |
| Prisma migration error | Database URL incorrect or missing permissions | Re‑check the `DATABASE_URL` – it must include the correct username/password and the database must exist. |
| Real‑time socket not connecting | Socket.io URL mismatch | Front‑end `socket.io-client` should point to the backend URL (`io(process.env.VITE_API_BASE_URL)`). |

---

*All steps are verified against the current repository state (phases 1‑7 completed). After following this guide you should have a live, production‑ready StatSkillAI site.*

---

*Generated by Antigravity*
