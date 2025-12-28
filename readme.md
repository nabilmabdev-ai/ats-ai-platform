HT Recruitment OS (ATS AI)
A Next-Gen Applicant Tracking System powered by Hybrid Search (RRF), Automated AI Screening, and Smart Scheduling.
This repository contains a full-stack SaaS platform designed to modernize recruitment. It uses a Microservices-lite architecture, separating business logic (Node.js) from high-intensity AI inference (Python).
🚀 Key Features
🧠 AI-Powered Parsing & Screening: Automatically extracts skills, experience, and contact info from PDFs using Gemini Vision/Text, scoring candidates against job descriptions.
🔍 Hybrid Search Engine: Implements Reciprocal Rank Fusion (RRF) to combine:
Semantic Search: Vector embeddings via Milvus (conceptual matching).
Keyword Search: Full-text search via MeiliSearch (exact matching).
📅 Smart Scheduling: Calendar conflict detection considering candidate timezones, interviewer work hours, and Google Calendar busy periods.
🧩 Chrome Sourcing Extension: Scrape LinkedIn profiles directly into the ATS with one click.
📄 Document Generation: Automated Offer Letter generation (PDF) using HTML templates.
⚡ Event-Driven Architecture: Uses BullMQ (Redis) for asynchronous PDF parsing, vectorization, and email notifications.
🏗️ Architecture
The system is split into three main applications and a browser extension:
Service	Path	Tech Stack	Port	Purpose
Frontend	/apps/frontend	Next.js 14, Tailwind, SWR	3000	User Interface & Dashboards.
Backend Core	/apps/backend-core	NestJS, Prisma, BullMQ	3001	Business Logic, API, Auth, SQL DB.
AI Service	/apps/backend-ai	FastAPI, Python, PyMuPDF	8000	Vectorization, LLM interaction, OCR.
Extension	/apps/chrome-extension	JS, Chrome API	N/A	LinkedIn Profile Scraper.
Infrastructure (Docker)
PostgreSQL: Primary relational database.
Redis: Message queue for BullMQ.
Milvus: Vector database for semantic search embeddings.
MeiliSearch: Search engine for fast keyword filtering.
🛠️ Prerequisites
Ensure you have the following installed:
Node.js (v18+) & npm
Python (v3.9+)
Docker & Docker Compose (Required for DBs)
⚡ Quick Start Guide
1. Start Infrastructure
Spin up the required databases using Docker.
code
Bash
# From root directory (ensure you have a docker-compose.yml configured for these services)
docker-compose up -d postgres redis milvus meilisearch
2. Setup Backend Core (NestJS)
code
Bash
cd apps/backend-core

# Install dependencies
npm install

# Setup Environment Variables
cp .env.example .env
# (Fill in DATABASE_URL, REDIS details, etc. See "Configuration" below)

# Initialize Database
npx prisma migrate dev --name init
npx prisma generate

# Seed Data (Crucial for first run)
npm run seed

# Start Server
npm run start:dev
3. Setup AI Service (Python)
code
Bash
cd apps/backend-ai

# Create Virtual Environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install Dependencies
pip install -r requirements.txt

# Setup Environment
cp .env.example .env
# (Add GEMINI_API_KEY)

# Start Server
uvicorn main:app --reload --port 8000
4. Setup Frontend (Next.js)
code
Bash
cd apps/frontend

# Install dependencies
npm install

# Setup Environment
cp .env.example .env.local
# (Ensure NEXT_PUBLIC_API_URL=http://localhost:3001)

# Start Server
npm run dev
⚙️ Configuration (.env)
Backend Core (apps/backend-core/.env)
code
Ini
DATABASE_URL="postgresql://user:password@localhost:5432/ats_db"
REDIS_HOST="localhost"
REDIS_PORT="6379"
JWT_SECRET="super-secret-key"

# AI Service Link
AI_SERVICE_URL="http://localhost:8000"

# Search Services
MEILI_HOST="http://localhost:7700"
MEILI_KEY="masterKey"

# Optional (for S3 uploads, defaults to local)
STORAGE_DRIVER="local" 
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
Backend AI (apps/backend-ai/.env)
code
Ini
GEMINI_API_KEY="your-google-ai-studio-key"
MILVUS_HOST="localhost"
MILVUS_PORT="19530"
Frontend (apps/frontend/.env.local)
code
Ini
NEXT_PUBLIC_API_URL="http://localhost:3001"
🧩 Chrome Extension Installation
The extension allows recruiters to source candidates directly from LinkedIn.
Open Chrome and navigate to chrome://extensions.
Enable Developer Mode (toggle in top right).
Click Load Unpacked.
Select the folder: apps/chrome-extension.
Usage: Go to a LinkedIn profile -> Click Extension Icon -> Enter Email -> Click "Import Profile".
🧪 Development & Seeding
The system comes with a robust seeder to populate the database with realistic test data (Jobs, Candidates, Applications, Interviews).
code
Bash
# In apps/backend-core
npm run seed
This script runs:
seed-foundation.ts: Users, Roles, Company Settings, Templates.
seed-jobs.ts: Jobs in various states (Draft, Published, Closed).
seed-candidates.ts: Candidates with resume text (includes "Silver Medalist" scenarios).
seed-interviews-offers.ts: Scheduled interviews and draft offers.
Default Login Credentials:
Email: recruiter@iosolutions.com
Password: password123
🧠 Search Logic Explanation
The SearchService (apps/backend-core/src/search/search.service.ts) uses Reciprocal Rank Fusion (RRF):
Keyword Query: Sent to MeiliSearch to find exact string matches (skills, names).
Semantic Query: Sent to Backend-AI to vectorize the query (via Gemini) and search Milvus for conceptual matches.
Fusion: The two result lists are merged. Candidates appearing in both lists get a boosted score.
Formula: score = 1 / (k + vector_rank) + 1 / (k + keyword_rank)
📂 Project Structure
code
Code
.
├── apps
│   ├── backend-ai       # Python FastAPI (Vectorization, OCR, LLM)
│   ├── backend-core     # NestJS (Business Logic, Orchestration)
│   ├── chrome-extension # LinkedIn Scraper
│   └── frontend         # Next.js (UI)
├── uploads              # Local storage for resumes/PDFs (if S3 not configured)
└── README.md
⚠️ Troubleshooting
1. "Connection Refused" on Parsing
Ensure Redis is running. The PDF parsing job is asynchronous.
Ensure backend-ai is running on port 8000.
2. "Milvus/Meili Connection Error"
Check Docker containers: docker ps.
Ensure environment variables in backend-core match the Docker configuration.
3. "OCR Fallback" logs in Python
If a PDF contains no selectable text (scanned image), the system automatically uses Gemini Vision capabilities. This is slower than text extraction.
📜 License
Private SaaS codebase. Unauthorized copying or distribution is prohibited.