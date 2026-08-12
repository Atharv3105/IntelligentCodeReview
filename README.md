# AI Interview Intelligence Platform

Production-quality, local-first technical interview and career preparation platform powered by local **PostgreSQL**, **Redis**, **Judge0**, and **AI Gateway**.

---

## ⚡ Quick Start (Windows)

Simply double-click `run.bat` or run in your terminal:

```cmd
run.bat
```

This automated batch script will:
1. Initialize `.env` configuration from template if missing
2. Verify Docker Desktop is running
3. Launch local PostgreSQL, Redis, and Judge0 Docker containers
4. Run Prisma database migrations and seed system data & problems
5. Start both Frontend (`http://localhost:5173`) and Backend (`http://localhost:5000`)

---

## 🛠️ Manual Step-by-Step Setup

If you prefer to run steps individually:

### 1. Configure Environment
```bash
cp .env.example .env
```
Ensure your `AI_API_KEY` (OpenAI, Gemini, or Groq) is added in `.env`.

### 2. Start Infrastructure Containers
```bash
docker compose -f docker/docker-compose.yml up postgres redis judge0 --build -d
```

### 3. Migrate and Seed Database
```bash
cd backend
npx prisma generate
npx prisma db push
node prisma/seed.js
cd ..
```

### 4. Start Development Application
```bash
npm run dev
```

---

## 🌟 Architecture Overview

- **Frontend**: React 18, Vite, Tailwind CSS, Monaco Editor, Socket.IO
- **Backend API**: Node.js, Express, Prisma ORM, Bull Queue
- **Database**: PostgreSQL (Local)
- **Cache & Queue**: Redis (Local)
- **Code Execution**: Judge0 (Sandboxed Execution)
- **AI Integration**: Multi-provider AI Gateway (OpenAI, Gemini, Groq)
