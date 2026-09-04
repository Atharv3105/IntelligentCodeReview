<div align="center">

# 🧠 AI Interview & Code Review Intelligence Platform

**Production-grade, local-first technical interview, coding practice, and career preparation ecosystem.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA_NIM-Nemotron--120B-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://build.nvidia.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-step-by-step-setup">Manual Setup</a> •
  <a href="#-configuration--environment">Configuration</a> •
  <a href="#-api-endpoints">API Reference</a> •
  <a href="#-troubleshooting">Troubleshooting</a>
</p>

</div>

---

## 📖 Overview

The **AI Interview & Code Review Intelligence Platform** is a full-stack, local-first technical preparation suite designed to simulate real-world FAANG+ coding assessments and technical behavioral interviews. 

It combines **sandboxed multi-language code execution**, an **interactive SQL laboratory**, **real-time voice & text AI mock interviews**, and a **career readiness engine** into an integrated, developer-focused workspace.

---

## 🌟 Key Features

### 🎙️ 1. Live Voice & Text AI Mock Interviews
- **Adaptive AI Interviewer**: Conducts realistic technical and system-design interviews with dynamic follow-up questions tailored to your responses.
- **Speech-to-Text & Text-to-Speech**: Hands-free conversation powered by browser Web Speech APIs with automatic fallback to text chat.
- **Server-Persisted Live Transcripts**: Partial and final captions stream in real time over WebSockets and automatically save to the database so sessions can be resumed smoothly.
- **Comprehensive Rubric Evaluations**: In-depth scorecards measuring Technical Proficiency, Problem Solving, and Communication Skills with targeted suggestions.

### ⚡ 2. Sandboxed Code Execution (Judge0)
- **Multi-Language Support**: Run and evaluate code in **Python**, **JavaScript**, **C++**, and **Java**.
- **Isolated Execution**: Secure, sandboxed execution with strict memory and CPU runtime limits.
- **Instant Test Suite Verification**: Validates public and hidden test cases with immediate feedback on runtime, memory consumption, and standard output/error.

### 🗄️ 3. Interactive SQL Laboratory
- **Live Database Sandbox**: Execute complex SQL queries directly against isolated SQLite/PostgreSQL schemas.
- **Automated Query Grader**: Compares result tables against target outputs, validating columns, ordering, and data types.
- **Schema & Execution Plans**: View database diagrams, schema structures, and query execution hints.

### 🤖 4. Resilient Multi-Provider AI Gateway
- **NVIDIA NIM Integration**: Primary support for state-of-the-art models like `nvidia/nemotron-3-super-120b-a12b`.
- **Seamless Provider Failover**: Built-in adapter pattern supporting **OpenAI** (`gpt-4o-mini`), **Google Gemini**, and **Groq** (`llama-3.1-8b-instant`).
- **AI-Powered Assistance**: Code review, intelligent hints, algorithmic concept explanations, and personalized study plans.

### 🎯 5. Practice Arenas & Assessments
- **Curated Collections**: Access problem sets including **Blind 75**, **NeetCode 150**, and custom AI-generated challenges.
- **Mock Test Arena**: Timed, multi-problem examinations with real-time proctoring indicators and score breakdown.
- **Subject-Wise Practice**: Targeted practice across Core CS subjects (DBMS, OS, Computer Networks, OOP, System Design).

### 📈 6. Career Hub & Skill Readiness Analytics
- **Personalized Readiness Metric**: Calculates an overall readiness score based on problem accuracy, speed, and interview scores.
- **Interactive Radar Charts**: Visualizes strengths and growth opportunities across algorithmic categories.
- **Global Leaderboard & XP**: Gamified progression with level tiers, XP rewards, and global rank tracking.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client["Frontend Client (Port 5173 / 3000)"]
        UI["React 18 + Vite + Tailwind CSS"]
        Monaco["Monaco Code Editor"]
        STT["Web Speech API (STT / TTS)"]
        SocketClient["Socket.IO Client"]
    end

    subgraph Backend["Backend API (Port 5000)"]
        Express["Express.js Server"]
        AuthMiddleware["JWT Auth & Refresh Rotation"]
        RateLimiter["Redis-Backed Rate Limiting"]
        SocketServer["Socket.IO Event Hub"]
        IE["Interview Engine"]
        AIGW["Multi-Provider AI Gateway"]
    end

    subgraph ExternalAI["AI Services"]
        NVIDIA["NVIDIA NIM (Nemotron-120B)"]
        OpenAI["OpenAI (GPT-4o-mini)"]
        Gemini["Google Gemini"]
        Groq["Groq (Llama-3.1)"]
    end

    subgraph Infra["Infrastructure Services (Docker)"]
        Postgres[("PostgreSQL 16\n(Port 5433)")]
        RedisDB[("Redis 7 Cache & Queue\n(Port 6380)")]
        Judge0["Judge0 Sandbox\n(Port 2358)"]
    end

    UI -->|REST API| Express
    SocketClient <-->|WebSocket Events| SocketServer
    Express --> AuthMiddleware --> RateLimiter
    Express --> IE
    Express --> AIGW
    IE --> Postgres
    Express --> Postgres
    Express --> RedisDB
    Express --> Judge0
    AIGW -->|Primary| NVIDIA
    AIGW -.->|Fallback| OpenAI
    AIGW -.->|Fallback| Groq
    AIGW -.->|Fallback| Gemini
```

---

## 💻 Tech Stack

| Domain | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Monaco Editor (`@monaco-editor/react`), Lucide Icons, Socket.IO Client, Axios |
| **Backend API** | Node.js, Express.js, Prisma ORM, Bull Queue, Socket.IO, Pino Logger, Joi/Zod, Bcrypt, JsonWebToken |
| **Database & Cache**| PostgreSQL 16 (Alpine), Redis 7 (Alpine), Prisma Client |
| **Code Execution** | Judge0 v1.13.1 (Docker Sandboxed Runner) |
| **AI Providers** | NVIDIA NIM, OpenAI API, Google Generative AI, Groq SDK |
| **DevOps & Tools** | Docker, Docker Compose, Nodemon, Vitest, Concurrently |

---

## 📁 Repository Structure

```text
IntelligentCodeReview/
├── backend/
│   ├── config/              # Environment, DB, Prisma & AI configs
│   ├── controllers/         # Endpoint request handlers (Auth, AI, Interview, etc.)
│   ├── middleware/          # JWT authentication, RBAC, error handling, rate limits
│   ├── prisma/
│   │   ├── schema.prisma    # PostgreSQL Prisma models & relations
│   │   └── seed.js          # Default admin, starter problems & skills seed
│   ├── routes/              # Express API route declarations
│   ├── services/            # Business logic (AI Gateway, Interview Engine, Sockets)
│   ├── worker/              # Background Bull queue worker process
│   ├── Dockerfile           # Backend container build instructions
│   ├── package.json
│   └── server.js            # Express & Socket.IO server entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components, Modals, AppShell layout
│   │   ├── context/         # AuthContext, SocketContext, ThemeContext
│   │   ├── hooks/           # Custom React hooks (STT, audio, sockets)
│   │   ├── pages/           # InterviewSession, SQLLab, ProblemPage, Dashboard, etc.
│   │   ├── services/        # Axios API clients & endpoints
│   │   ├── App.jsx          # Client route definitions & guards
│   │   └── main.jsx         # React application root
│   ├── Dockerfile           # Production frontend container
│   ├── package.json
│   └── vite.config.js       # Vite configuration
├── docker/
│   └── docker-compose.yml   # Multi-container orchestration (Postgres, Redis, Judge0)
├── scripts/
│   └── dev.js               # Multi-service development launcher
├── .env.example             # Complete environment configuration template
├── package.json             # Root workspace script definitions
├── run.bat                  # Automated 1-click Windows runner
└── README.md                # Platform documentation
```

---

## ⚡ Quick Start

### Windows (Automated 1-Click Launcher)

The fastest way to get started on Windows:

1. Make sure **Docker Desktop** is running.
2. Double-click **`run.bat`** or run in your terminal:

```cmd
run.bat
```

The script will automatically:
- Create `.env` from `.env.example` if not present.
- Start local Docker containers for **PostgreSQL** (port `5433`), **Redis** (port `6380`), and **Judge0** (port `2358`).
- Generate Prisma client and push schema migrations.
- Seed initial users, problems, and SQL challenges.
- Launch Frontend (`http://localhost:5173`) and Backend API (`http://localhost:5000`).

---

## 🛠️ Step-by-Step Setup

Follow these manual steps on **macOS**, **Linux**, or **Windows**:

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Docker Desktop** & **Docker Compose**
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/Atharv3105/IntelligentCodeReview.git
cd IntelligentCodeReview
```

### 3. Configure Environment Variables
```bash
# Copy template to root and backend
cp .env.example .env
cp .env.example backend/.env
```
Edit `.env` to configure your AI provider API key (e.g., `AI_API_KEY=nvapi-...` or `AI_API_KEY=sk-...`).

### 4. Start Infrastructure Containers
```bash
docker compose -f docker/docker-compose.yml up postgres redis judge0 --build -d
```
> **Note**: Verify container health with `docker ps`. Services will run on:
> - PostgreSQL: `localhost:5433`
> - Redis: `localhost:6380`
> - Judge0: `localhost:2358`

### 5. Install Dependencies
```bash
npm install
npm run install:all
```

### 6. Initialize & Seed Database
```bash
cd backend
npx prisma generate
npx prisma db push
node prisma/seed.js
cd ..
```

### 7. Start Development Servers
```bash
npm run dev
```

Platform URLs:
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Default Credentials

After running `node prisma/seed.js`, log in with the pre-configured administrator account:

| Attribute | Value |
| :--- | :--- |
| **Email** | `admin@interview-platform.local` |
| **Password** | `Admin@123456` |
| **Role** | System Administrator (`admin`) |

You can also register a new candidate account directly from the UI.

---

## ⚙️ Configuration & Environment

Key configuration variables in `.env`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Backend API server port |
| `POSTGRES_PORT` | `5433` | PostgreSQL host mapping |
| `DATABASE_URL` | `postgresql://interview_user:interview_pass@localhost:5433/interview_platform` | Prisma connection string |
| `REDIS_PORT` | `6380` | Redis host mapping |
| `REDIS_URL` | `redis://localhost:6380` | Redis connection URL |
| `JWT_SECRET` | *(64-char random string)* | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | *(64-char random string)* | Secret for signing refresh tokens |
| `AI_PROVIDER` | `nvidia` | Primary AI provider (`nvidia`, `openai`, `gemini`, `groq`) |
| `AI_API_KEY` | *(your-api-key)* | API key for the chosen provider |
| `AI_MODEL` | `nvidia/nemotron-3-super-120b-a12b` | Model identifier |
| `AI_FALLBACK_PROVIDER` | `groq` | Fallback provider when primary is unavailable |
| `AI_FALLBACK_MODEL` | `llama-3.1-8b-instant` | Model for fallback requests |
| `JUDGE_API_URL` | `http://localhost:2358` | Sandboxed Judge0 endpoint |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
- `POST /register` — Register a new account
- `POST /login` — Authenticate and receive access & refresh tokens
- `POST /refresh-token` — Rotate and exchange refresh token for access token
- `POST /logout` — Invalidate user session
- `GET /me` — Fetch current user profile

### 💻 Code Practice & Execution (`/api/problems`, `/api/submissions`)
- `GET /api/problems` — List problems with filters (difficulty, topic, collection)
- `GET /api/problems/:id` — Retrieve problem details, hints, starter code
- `POST /api/submissions/run` — Run code against sample test cases via Judge0
- `POST /api/submissions/submit` — Submit final solution for formal evaluation
- `GET /api/submissions/my` — Retrieve user submission history

### 🎙️ AI Mock Interviews (`/api/interviews`)
- `POST /api/interviews` — Create a new interview session
- `POST /api/interviews/:id/start` — Begin interview and load initial question
- `POST /api/interviews/:id/transcripts` — Stream and persist speech transcript entry
- `GET /api/interviews/:id/current-question` — Fetch current active question
- `POST /api/interviews/:id/questions/:qId/answer` — Submit answer for AI rubric evaluation
- `POST /api/interviews/:id/questions/:qId/followup` — Generate contextual follow-up question
- `POST /api/interviews/:id/next` — Advance to next question or complete interview

### 🗄️ SQL Laboratory (`/api/sql`)
- `GET /api/sql/challenges` — List SQL practice challenges
- `POST /api/sql/run` — Execute arbitrary SQL query in sandbox
- `POST /api/sql/submit` — Validate solution table against challenge expectations

### 🤖 AI Gateway Utilities (`/api/ai`)
- `POST /api/ai/review` — Perform code review and optimization recommendations
- `POST /api/ai/hint` — Request a progressive hint for the current problem
- `POST /api/ai/explain` — Explain algorithmic concepts or runtime complexity
- `POST /api/ai/study-plan` — Generate customized study schedule based on skill gaps

---

## ❓ Troubleshooting

<details>
<summary><strong>1. Docker Desktop is not running</strong></summary>

- Ensure Docker Desktop is installed and started.
- Run `docker info` in your terminal to verify Docker daemon connectivity before starting containers.
</details>

<details>
<summary><strong>2. Port Conflict on 5432 or 6379</strong></summary>

- By default, this platform maps PostgreSQL to **`5433`** and Redis to **`6380`** to avoid colliding with native local services.
- If you change these ports, make sure to update `POSTGRES_PORT` and `REDIS_PORT` in your `.env` file accordingly.
</details>

<details>
<summary><strong>3. PowerShell execution policy error running npm</strong></summary>

- If you encounter `PSSecurityException` when executing `npm run build` in PowerShell:
  - Run with `npm.cmd` instead of `npm`, or
  - Update your execution policy: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
</details>

<details>
<summary><strong>4. AI features return "AI key not configured"</strong></summary>

- Ensure you set a valid `AI_API_KEY` in `.env` (or `NVIDIA_NIM_API_KEY`).
- Free NVIDIA NIM API keys can be generated at [build.nvidia.com](https://build.nvidia.com/).
</details>

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is distributed under the **MIT License**. See `LICENSE` for more information.
