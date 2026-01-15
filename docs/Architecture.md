Here is the **`docs/ARCHITECTURE.md`** file. This is the most critical document after the README because it explains the complex logic behind your Hybrid Search (RRF) and Async Event pipelines.

***

# System Architecture & Core Logic

This document outlines the technical design of the HT Recruitment OS. It details the interaction between the Node.js Core, the Python AI Service, and the specialized search engines.

## 1. High-Level Overview

The system follows a **Microservices-lite** pattern. We use a high-performance Node.js monolith for business logic and orchestrate heavy AI tasks to a dedicated Python service via Redis queues.

```mermaid
graph TD
    User[Frontend / User] -->|HTTP/REST| Core[Backend Core (NestJS)]
    Ext[Chrome Extension] -->|HTTP/REST| Core
    
    subgraph Data Layer
        PG[(PostgreSQL)]
        Redis[(Redis / BullMQ)]
        Milvus[(Milvus Vector DB)]
        Meili[(MeiliSearch)]
    end

    subgraph Services
        Core -->|Read/Write| PG
        Core -->|Jobs| Redis
        Core -->|Keyword Search| Meili
        Core -->|Keyword Search| Meili
        
        AI[Backend AI (FastAPI)] -->|Listen| Redis
        AI -->|Semantic Search| Milvus
        AI -->|LLM API| Gemini[Google Gemini]
    end

    subgraph AI Architecture [Python Service Internal]
        Main[Main Entry] --> Routers
        Routers --> Services[Service Layer]
        Services --> Gemini[GeminiService]
        Services --> Milvus[MilvusService]
        Services --> PDF[PdfService]
    end

    Core -- 1. Queue Parsing Task --> Redis
    Redis -- 2. Process Task --> AI
    AI -- 3. Store Vectors --> Milvus
    AI -- 4. Return Data --> Core
```

---

## 2. Search Engine (Reciprocal Rank Fusion)

This is the core differentiator of the platform. We do not rely on a single search method. Instead, we use **RRF (Reciprocal Rank Fusion)** to combine keyword precision with semantic understanding.

### The Problem
*   **Keywords:** Searching for "React" misses "Frontend Engineer".
*   **Vectors:** Searching for "Finance" might return "Bank", but misses exact skill matches like "CPA".

### The Solution: RRF Algorithm
Located in: `apps/backend-core/src/search/search.service.ts`

1.  **Parallel Execution:**
    *   **Vector Query:** The query is embedded via Gemini (in Python) and searched against **Milvus**. This captures *intent*.
    *   **Keyword Query:** The query is sent to **MeiliSearch**. This captures *exact matches* and metadata.
2.  **Scoring Strategy:**
    We normalize the scores from two different databases using rank position:
    $$ Score = \frac{1}{k + rank_{vector}} + \frac{1}{k + rank_{keyword}} $$
    *(Where $k$ is a smoothing constant, typically 60).*
3.  **Result:** Candidates who appear in the top results of *both* engines bubble to the top.

---

## 3. Asynchronous Event Pipelines

To prevent the API from hanging during heavy file processing, we use **BullMQ (Redis)**.

### Pipeline: Candidate Ingestion
1.  **Upload:** User uploads a PDF to `Backend-Core`.
2.  **Queue:** Core adds a job `process-application` to the `applications` queue.
3.  **Processing (Python):**
    *   The worker streams the file.
    *   **Text Extraction:** Attempts efficient extraction via `PyMuPDF`.
    *   **OCR Fallback:** If text length < 50 chars (scanned image), it triggers **Gemini Vision** to read the image.
4.  **Vectorization:**
    *   The text is summarized and embedded into a 768-dimensional vector.
    *   Stored in Milvus with metadata (Experience, Location).
5.  **Completion:** The JSON result is sent back to Core to update the Postgres record.

---

## 4. Smart Scheduling Logic

Located in: `apps/backend-core/src/interviews/calendar.service.ts`

The scheduler solves the "Double Booking" problem by checking three layers of availability:

1.  **Work Hours:** Checks the interviewer's configured timezone and working hours (e.g., 9 AM - 5 PM Paris Time).
2.  **Internal Conflicts:** Queries the Postgres `Interview` table for existing bookings.

### Visibility & Audit
*   **Interviews List**: Pending (Unscheduled) interviews appear in the main `/interviews` list with a status of `PENDING`.
*   **Activity Log**: The sending of the invite is logged in the Candidate's timeline as a system note (e.g., *"System: Sent interview invite... Note: 'Looking forward...'"*).
*   **Calendar View**: Displays all `CONFIRMED` interviews and overlays "Busy" slots from Google/Outlook.

### Smart Schedule Customization Steps
1.  **Trigger:** A recruiter clicks "Smart Schedule" from the dashboard or candidate profile.
2.  **Customization:** The recruiter selects candidates and can optionally:
    *   Add a **Custom Personal Message** (e.g., "Great chatting with you!").
    *   This message is injected into the invite email.
3.  **Link Generation:** The system generates a unique, secure link (e.g., `ats.com/book/abc-123`).

3.  **External Conflicts (Google/Outlook):**
    *   Uses `CalendarService` to fetch real-time "Busy" chunks from connected `GoogleCalendarService` and `OutlookCalendarService`.
    *   The system aggregates these external busy slots with internal interviews to calculate true availability.


### Slot Generation
The system generates slots in 60-minute increments relative to the **Interviewer's** timezone but returns them formatted in the **Candidate's** timezone.

---

## 5. Data Flow: Chrome Extension

1.  **Scraping:** The extension injects a content script into LinkedIn to scrape DOM elements (Name, Location, About).
2.  **Transmission:** Data is sent to `POST /candidates`.
3.  **Deduplication:**
    *   **Strict:** Checks exact Email match.
    *   **Fuzzy:** Checks `LastName` + `PhoneNumber` (last 6 digits) if enabled in Company Settings.
4.  **Processing:** Even though it's not a PDF, the raw text profile is sent to the AI service for **Vectorization**, ensuring sourced candidates are immediately searchable via semantic search.

---

## 6. Service Boundaries & Data Integrity

### Transactional Integrity
To ensure data consistency, critical write operations in **Backend Core** are wrapped in **Prisma Transactions**.
*   **Application Creation**: The `ApplicationsService.create` method ensures that creating a Candidate and creating an Application happen atomically. If one fails, both roll back, preventing "orphaned" candidates.

### Segregation

| **Frontend** | UI/UX, Real-time updates (SWR), Drag-and-Drop | `Next.js`, `Tailwind`, `@hello-pangea/dnd` |

---

---

## 7. Frontend Architecture

The frontend (`apps/frontend`) is built with **Next.js 16 (App Router)** and follows a strict separation of concerns to ensure performance and maintainability.

### Key Principles
1.  **Componentization**:
    *   **Pages**: (e.g., `page.tsx`) act as orchestrators. They shouldn't contain heavy UI logic.
    *   **Smart Components**: (e.g., `InterviewList.tsx`) handle user interactions.
    *   **Dumb Components**: (e.g., `StatsGrid.tsx`) receive data via props and render UI.
2.  **Data Fetching (SWR)**:
    *   We use **SWR** (Stale-While-Revalidate) for all GET requests.
    *   **Hooks**: Data fetching is encapsulated in custom hooks like `useDashboardData`. This ensures:
        *   Automatic Caching & Deduplication.
        *   Background Revalidation.
        *   Optimistic UI updates.
3.  **Global Error Boundary**:
    *   The entire application is wrapped in an `ErrorBoundary` component (`frontend/src/components/ErrorBoundary.tsx`).
    *   This prevents a single component crash (e.g., a chart failure) from breaking the whole app (White Screen of Death).

---

## 8. Key Application Routes

*   **`/dashboard`**: High-level metrics and stats.
*   **`/vacancies`**: Job creation and management.
*   **`/search` (Talent Intelligence)**:
    *   **Discovery**: AI-Powered candidate search.
    *   **Database**: Centralized Talent Pool view (Active/Passive candidates).
    *   **Add Candidate**: Manual entry & Resume upload.
*   **`/applications`**: Kanban pipeline board.
*   **`/cv-doctor`**: AI Resume analysis.

---

## 8. API & Stability Standards

To ensure a robust communication layer between Frontend and Backend, we enforce strict standards.

### 8.1 Standardized API Responses
All lists API endpoints (Jobs, Interviews, Candidates) return data in a unified envelope:

```json
{
  "data": [ ... ],       // The actual array of items
  "meta": {              // Pagination metadata (optional but recommended)
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### 8.2 Global Exception Handling
The NestJS backend implements a **Global Exception Filter** (`HttpExceptionFilter`).
*   **Purpose**: Catches *any* unhandled error thrown in the application.
*   **Behavior**: Returns a standardized JSON error response to the client, preventing "Internal Server Error" leaks or hanging requests.
*   **Logging**: Automatically logs the full stack trace to the server logs using the system Logger.

### 8.3 Logging Strategy
*   We use the **NestJS Logger** exclusively (no `console.log`).
*   This allows for structured logging (Timestamp, Context, Level) which is critical for production debugging.

---

## 9. Reporting & Analytics Module

The Reporting module provides real-time insights into the recruitment process without requiring a separate BI tool.

### Architecture
*   **Source of Truth:** All data is aggregated directly from **Postgres** (Application, Interview, Offer tables).
*   **History Tracking:** A dedicated `ApplicationHistory` table tracks every status change (e.g., `APPLIED` -> `SCREENING`). This allows us to calculate **Velocity** and **Time-to-Hire** metrics accurately, even if the current status is `HIRED`.
*   **Performance:**
    *   Heavy aggregations (like Pipeline Funnel) are computed in `ReportingService` using optimized Prisma `groupBy` queries.
    *   Frontend uses `SWR` for caching and revalidation.

### Key Metrics
1.  **Pipeline Funnel:** Conversion rates between stages.
2.  **Time to Hire:** Average days from Application creation to Offer acceptance.
3.  **Source Effectiveness:** Breakdown of candidates by origin (LinkedIn, Indeed, etc.).
---

## 10. Background Synchronization (Tasks)

Located in: `apps/backend-core/src/tasks/sync.service.ts`

To keep the ATS in sync with external providers (Google, Outlook) without blocking HTTP requests, we use a scheduled **Tasks Module** (`@nestjs/schedule`).

*   **Role**: Periodic synchronization (Cron Job).
*   **Frequency**: Every 15 minutes.
*   **Function**:
    *   Iterates through users with connected calendars.
    *   Refreshes OAuth tokens if needed.
    *   (Future) Performs incremental sync to PULL changes from external calendars into the database.

---

## 11. Email & Communication Layer

The platform uses a provider-agnostic `EmailService` designed for transactional reliability and privacy.

### Strategy: "Reply-To" Routing
To bridge the gap between ATS automation and personal recruiter inboxes without requiring full inbox read permissions:

1.  **Sender**: Emails are sent from a system address (e.g., `notifications@ats.com`) to ensure high deliverability and SPF/DKIM alignment.
2.  **Reply-To**: The header is dynamically set to the **Recruiter's actual email address**.
3.  **Result**: When a candidate replies, the email routes directly to the recruiter's Outlook/Gmail, bypassing the ATS database to respect privacy.

### Audit Trail
While payloads (replies) are private, the *act* of sending is logged. The system creates `Comment` records in the Application Activity Timeline whenever a Smart Schedule invite or Status Change email is triggered.

---

## 12. Audit Logging System

To ensure data integrity and compliance (GDPR), the system enforces strict audit trails for critical entity modifications.

### Core Logic
Located in: `apps/backend-core/src/candidates/candidates.service.ts` (and standard Prisma middleware)

1.  **Structure:** A dedicated `AuditLog` table records:
    *   **Actor:** Who made the change (User ID).
    *   **Action:** What happened (e.g., `UPDATE_CANDIDATE`).
    *   **Target:** The entity affected (e.g., `Candidate:uuid`).
    *   **Changes:** A JSON diff showing `{ "email": { "old": "...", "new": "..." } }`.

2.  **Triggers:**
    *   **Candidate Edits:** When a recruiter updates a candidate profile via the UI.
    *   **Merges:** When two candidates are merged, the event is logged.
    *   **System Actions:** Automated background jobs also produce audit trails where appropriate.



---

## 13. Real-time Notifications

To keep users engaged and aware of critical actions, the system includes an in-app notification layer.

### Architecture
*   **Backend**: `NotificationsModule` facilitates the creation and retrieval of notifications. It is integrated into `ApplicationsService` (Assignments) and `InterviewsService` (Bookings).
*   **Frontend**: A `NotificationBell` component polls the API (`GET /notifications`) to provide real-time feedback on new events.

### Key Events
1.  **Application Assignment**: When a recruiter is assigned to an application.
2.  **Interview Booking**: When a candidate confirms a slot.
3.  **Interview Re-assignment**: When an interview is transferred to a new interviewer.
