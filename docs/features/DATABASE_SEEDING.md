# Database Seeding & Data Generation

This document outlines the strategy and usage of the database seeding scripts in the `backend-core` application. We use **Prisma Seeding** combined with **@faker-js/faker** to generate realistic, high-volume test data tailored for **IO Solutions Morocco**.

## 🚀 How to Run

To reset the database and populate it with new seed data, run the following command from the `apps/backend-core` directory:

```bash
npx prisma db seed
```

## 🛠 Technology Stack

*   **Prisma Client**: Used for type-safe database access during seeding.
*   **@faker-js/faker**: Generates realistic fake data (names, emails, dates, etc.).

## 📂 Seed Script Structure (`prisma/seed.ts`)

The `main()` function in `seed.ts` orchestrates the process for the **Morocco Context**:

### 1. Cleanup
Deletes data in reverse dependency order to avoid Foreign Key constraint errors.

### 2. Company & Users (IO Solutions Morocco)
*   **Company**: Creates "IO Solutions Morocco" with address at **Zenith Millenium, Casablanca**.
*   **Settings**:
    *   Currency: **MAD**
    *   Email Templates: Configured for French/English ("Entretien chez IO Solutions").
    *   Branding: Placeholder headers/footers enabled.
*   **Users**: Creates standard roles (`admin`, `recruiter`, `manager`) with **Casablanca Timezone (UTC+1)** availability.

### 3. Templates & Settings
Seeds the necessary templates for the `/settings` page:
*   **Job Templates**: "Customer Service Specialist (Bilingual)" defaults.
*   **Screening Templates**: "Bilingual Agent Screening" with language check questions.
*   **Offer Templates**: "CDI Contract (Standard Morocco)" including **CNSS, AMO**, and Transport details.
*   **Question Templates**: Situational questions for Call Center candidates.

### 4. Jobs (Rabat/Casablanca)
Generates specific job postings based on real requirements:
*   *Customer service & sales specialist bilingual (Rabat)*
*   *English & french spoken customer service & sales specialist*
*   *Bilingual customer service and sales specialist (Evening Shift)*

### 5. Candidates & Applications
*   **Candidates**: Generated with Moroccan phone numbers (`+212 6...`) and locations (Casablanca, Rabat).
*   **Applications**: Simulates funnel from `APPLIED` to `HIRED` with rejection reasons suited for the industry.
*   **Metrics Optimization**:
    *   **Volume**: Generates **40-80 applications per job** to ensure data density.
    *   **Timeframe**: Applications are distributed over a **long period (past 12-18 months)**. This is **critical** for the Reporting Module, ensuring that Line Charts (Time-to-Hire, Velocity) show meaningful trends and variance rather than a flat line of "today's data".
    *   **Rejection Reasons**: Explicitly assigned for all `REJECTED` applications (e.g., "Language Skills", "Availability") to populate report breakdowns.

### 6. Duplicates (Feature Verification)
Creates specific duplicate scenarios to test the **Merge Candidate** flow:
*   **Exact Match**: Candidates with identical Emails (Should be blocked by API, but useful for DB integrity checks).
*   **Fuzzy Match**: Candidates with **Different Emails** but **Same Name & Phone** (e.g., "Youssef Alaoui" with +212600000000). These are used to verify the "Potential Duplicate" alert in the UI.

## 📊 Business Rules Supported
*   **Currency**: All financial data (Salary, Offers) is in **MAD**.
*   **Benefits**: Offers include CNSS, AMO, CIMR, and Transport.
*   **Local Sources**: Candidates sourced from 'Rekrute.com', 'Tanqeeb', etc.

## 🤖 AI & Feature Verification
The seed data is specifically designed to test advanced features immediately after setup:

### 1. Hybrid Search Ready
*   **Resume Content**: Candidates are seeded with synthetic "resume text" containing keywords like *Python, React, Customer Service, Bilingual*.
*   **Vectorization**: Running the python worker will automatically vectorize these profiles, allowing you to test **"Talent Intelligence"** semantic search immediately.

### 2. Operational Workflows
*   **Draft Offers**: The `seed:ops` script generates candidates in the `OFFER` stage with pre-generated **Draft Offers**. This allows testing the **Offer Management** workflow (Approval -> Send) without manually creating an app.
*   **Interviews**: Pre-schedules interviews for the "Calendar" view verification.

### 3. Dashboard & Reporting Analytics
*   **Trend Data**: Application dates are randomized over a curve to produce meaningful charts on the **Manager Dashboard**.
*   **Funnel Visualization**: Status distribution ensures all funnel stages (Screening, Interview, Offer, Hired) have data.
*   **Reporting Module**: The data specifically populates:
    *   **Source ROI**: (Rekrute vs LinkedIn).
    *   **Time-to-Hire**: Historical dates are set to show realistic 15-45 day hiring cycles.
    *   **Rejection Analysis**: Populates "Why are we rejecting?" charts.
