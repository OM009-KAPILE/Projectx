# ProjectX — AI-Powered Cross-College Student Team Formation Platform

> **ProjectX** is not a simple student marketplace. It is an intelligent, AI-driven project team formation and collaboration platform designed to help university students discover the exact interdisciplinary skills needed to build ambitious software and hardware systems.

---

## 🌟 The Three Headline Innovations

### 1. AI Skill-Gap Detection
- **Decomposition**: Analyzes raw project pitches (e.g. *"Autonomous drone trajectory planner using Graph Neural Networks and ROS"*).
- **Role Extraction**: Identifies concrete architectural roles (e.g., *Lead UI Architect*, *GNN & Optimization Specialist*, *Embedded Systems & ROS Engineer*) with required proficiencies and criticality flags.
- **Team Gap Matrix**: Evaluates existing members' verified capabilities against project needs to flag open **Critical Gaps**.

### 2. Intelligent Cross-College Matching
- **Explainable Ranking**: Ranks candidates using a weighted scoring model:
  - Skill overlap with missing critical roles (50%)
  - Verified repository and code proof confidence (20%)
  - Cross-college institutional diversity synergy (15%)
  - Profile completeness & portfolio strength (15%)
- **Synergy Rationales**: Transparent explanations (e.g. *"94% Match: Bob Miller (MIT CSAIL) fills the critical PyTorch & GNN gap with 2 verified repos"*).

### 3. Progressive Project Disclosure (IP Protection)
- **Safe Public Listing**: Sanitizes proprietary text into a safe public teaser, displaying problem domain, participating colleges, and open roles while protecting secret algorithms and internal code repositories.
- **Private Workspace Vault**: Exclusively unlocked once a candidate is officially accepted into the team by the project creator (unlocks private GitHub repos, confidential notes, interactive Kanban board, real-time team chat, and project health intelligence).

---

## 🏗️ Monorepo Architecture

```
projectx/
├── apps/
│   ├── backend/        # Node.js + Express + TypeScript REST & Socket.IO Server
│   ├── ai-service/     # Python + FastAPI AI Intelligence & Heuristic Engine
│   ├── web/            # React 18 + TypeScript + Vite + Tailwind CSS (Light & Dark UI)
│   └── mobile/         # Flutter Cross-Platform Client (iOS, Android, macOS)
├── packages/
│   ├── common/         # Shared TypeScript Schemas (Zod), DTOs, Enums & Types
│   └── db/             # Prisma ORM Schema, SQLite/Postgres Migrations & Seed Data
├── docker-compose.yml  # Containerized Full-Stack Deployment
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies & Build Common Packages
```bash
npm install
npm run build:packages
```

### 2. Initialize Database & Seed Sample Universities / Students
```bash
# Initializes SQLite database and seeds 6 partner universities (Stanford, MIT, IIT Bombay, Berkeley, CMU, Waterloo)
npm run db:generate
npx prisma db push --schema=packages/db/prisma/schema.prisma
npm run db:seed
```

### 3. Start Python FastAPI AI Microservice
```bash
cd apps/ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Start Node.js Backend Server
```bash
npm run dev:backend
# API running on http://localhost:4000
```

### 5. Start React Web Client
```bash
npm run dev:web
# Web UI running on http://localhost:5173
```

---

## 🧪 Automated Testing

### Run Backend Integration Tests (Jest + Supertest):
```bash
npm --prefix apps/backend run test
```

### Run AI Microservice Unit Tests (Pytest):
```bash
cd apps/ai-service && .venv/bin/pytest
```

---

## 👥 Demo Personas (1-Click Switcher Available in UI)

| Persona | University | Role / Specialty | Key Verified Skills |
| :--- | :--- | :--- | :--- |
| **Alice Chen** | Stanford University | Project Lead & Frontend | React, TypeScript, UI/UX, Tailwind |
| **Bob Miller** | MIT CSAIL | AI / Graph Neural Networks | PyTorch, GNNs, Python, FastAPI |
| **Rohan Sharma** | IIT Bombay | Hardware & Embedded | ROS2, Embedded C++, STM32 |
| **Clara Rossi** | UC Berkeley | Distributed Systems | Go, PostgreSQL, Docker, Raft |
| **David Zhang** | Carnegie Mellon | Computer Vision & SLAM | NeRF, 3D Perception, PyTorch |
# Projectx
