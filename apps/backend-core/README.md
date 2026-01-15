# ATS Backend Core

The core business logic and API layer for the HT Recruitment OS. Built with **NestJS 11**, it handles data persistence (PostgreSQL/Prisma), asynchronous tasks (BullMQ), and authentication.

## 🛠️ Tech Stack

*   **Framework**: NestJS 11
*   **Database**: PostgreSQL 16
*   **ORM**: Prisma
*   **Queue**: BullMQ (Redis)
*   **Search Integration**: MeiliSearch (Keyword) & Milvus (Vector - via Backend AI) 
*   **Scheduled Tasks**: `@nestjs/schedule`
*   **Logging**: `NestJS Logger` (No `console.log` in production)

## 🏗️ Modular Architecture

The application is structured into domain-specific modules:

*   **`auth/`**: JWT-based authentication and guards.
*   **`candidates/`**: Candidate profiles, deduplication logic, CRUD, and Resume Upload handling.
*   **`applications/`**: Managing the application lifecycle (Applied -> Hired).
    *   *Includes transactional integrity to prevent data inconsistency during creation.*
*   **`jobs/`**: Job descriptions, templates, and publishing.
*   **`deduplication/`**: ScanService and logic for identifying and resolving duplicate candidates.
*   **`offers/`**: Offer generation, approval workflows, and sending.
*   **`interviews/`**: Scheduling logic and calendar integration.
*   **`search/`**: Unified search service (RRF algorithm) communicating with MeiliSearch and Backend AI.
*   **`csv-import/`**: Bulk candidate import processing.

## 🛡️ Stability & Standards

### API Response Format
All list endpoints conform to a standardized envelope:
```json
{
  "data": [...],
  "meta": { "total": 100, "page": 1, "limit": 10 }
}
```

### Global Exception Filter
All unhandled exceptions are caught by `HttpExceptionFilter` which:
1.  Logs the error stack trace.
2.  Returns a standardized JSON error response to the client.

## 🏃‍♂️ Getting Started

### Prerequisites
*   Node.js v20+
*   Docker (Postgres, Redis, Milvus, MeiliSearch running)

### Installation

```bash
cd apps/backend-core
npm install
```

### Configuration

Setup `.env` file (copy from `.env.example`):

```ini
DATABASE_URL="postgresql://user:password@localhost:5432/ats_db"
# Redis for BullMQ
REDIS_HOST="localhost"
REDIS_PORT="6379"

# External Services
AI_SERVICE_URL="http://localhost:8000"
MEILI_HOST="http://localhost:7700"
MEILI_KEY="masterKey"
```

### Database Setup

```bash
# Apply migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

### ⚡ Seeding Data

This is critical for setting up the environment.

```bash
# Main Seed (Runs all sub-seeds)
npm run seed
```

Individual seed scripts:
*   `npm run seed:foundation` - Users (Recruiters), Roles, Default Settings.
*   `npm run seed:jobs` - Sample Jobs and Templates.
*   `npm run seed:candidates` - Fake candidates with resume text.
*   `npm run seed:ops` - Interviews and Draft Offers.

## 🚀 Running the Server

```bash
# Development (Watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## 🔄 Async Jobs (BullMQ)

*   **`pdf-parsing`**: Extracts text from uploaded resumes.
*   **`vectorization`**: Sends text to Backend AI for embedding creation.
*   **`email-notifications`**: Sends transactional emails (Offer letters, Interview invites).
