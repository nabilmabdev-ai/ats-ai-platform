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
        
        AI[Backend AI (FastAPI)] -->|Listen| Redis
        AI -->|Semantic Search| Milvus
        AI -->|LLM API| Gemini[Google Gemini]
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
3.  **External Conflicts (Google Calendar):**
    *   Uses the `GoogleCalendarService` to fetch "Busy" chunks from the interviewer's primary Google Calendar.
    *   The system does *not* store external events details (privacy), only the `start/end` time ranges to block slots.

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

## 6. Service Boundaries

| Service | Responsibility | Key Libraries |
| :--- | :--- | :--- |
| **Backend Core** | Auth, Data Persistence, Emailing, API Gateway, Search Orchestration | `NestJS`, `Prisma`, `Passport`, `BullMQ` |
| **Backend AI** | Resume Parsing, Embeddings, LLM Chat, OCR | `FastAPI`, `PyMuPDF`, `google-generativeai`, `pymilvus` |
| **Frontend** | UI/UX, Real-time updates (SWR), Drag-and-Drop | `Next.js`, `Tailwind`, `@hello-pangea/dnd` |