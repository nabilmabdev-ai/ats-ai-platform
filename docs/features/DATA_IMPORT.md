Here is **`docs/DATA_IMPORT.md`**. This document explains the bulk data ingestion capabilities, the strict formatting rules for CSVs, and the hidden business logic (like location filtering and job matching) embedded in the import service.

***

# Bulk Data Import Guide

The **HT Recruitment OS** includes a robust `CsvImportService` designed to ingest large volumes of candidate data from legacy ATS exports or LinkedIn Recruiter CSVs.

This guide details the required format, the auto-mapping logic, and the "Silent Mode" deduplication rules.

---

## 1. CSV File Specification

The importer is flexible and attempts to normalize headers (removing spaces, special characters, and casing). However, for best results, use the standard headers below.

**File Requirements:**
*   **Format:** `.csv` only.
*   **Separator:** Auto-detected (Comma `,` or Semicolon `;`).
*   **Encoding:** UTF-8 recommended.

### Required Columns

| Header | Description | Validation Logic |
| :--- | :--- | :--- |
| `email` | **Mandatory.** The unique identifier for the candidate. | Must be a valid email format. |
| `firstname` | Candidate's First Name. | Fallback: `firstnamefirst` |
| `lastname` | Candidate's Last Name. | Fallback: `lastnamelast` |

### Recommended Columns

| Header | Description | System Behavior |
| :--- | :--- | :--- |
| `telephone` | Phone number (International format preferred). | Used for fuzzy matching if enabled. Fallback: `numerodetelephoneinternational`. |
| `location` | Current city/country. | Used for the "Morocco Filter" (see Section 3). Fallback: `countrycity`, `dansquelpaysetesvoussitue`. |
| `poste` | The Job Title the candidate applied for. | If the job exists in the DB, the candidate is assigned to it. If not, a "General Import" job bucket is created. |
| `resumecv` | **Public URL** to the resume PDF/Doc. | The system will download this file, parse it via AI, and vectorise it. **Local file paths are not supported.** |

### Metadata Columns (Advanced)

The importer automatically maps specific columns into the `metadata` JSON field for analytics.

*   `french`, `english`, `spanish`: Maps to `languages` array.
*   `fromsource`, `referredby`: Maps to `sourcing.channel` and `sourcing.detail`.
*   `linkedInProfile`: Maps to `linkedinUrl`.

---

## 2. The Import Workflow

1.  **Upload:** The user uploads a CSV file via the "Import Candidates" link in the Sidebar.
2.  **Analysis Phase:**
    *   The system scans the file *without* saving data.
    *   It identifies **Missing Job Titles**.
    *   It counts candidates passing the **Location Filter**.
    *   *Result:* User sees a summary and can click "Create Missing Jobs" before proceeding.
3.  **Batch Creation & Ingestion Phase:**
    *   When confirmed, an **Import Batch** record is created in the database.
    *   The browser receives a Batch ID and begins polling for progress.
    *   **Background Processing:** The server processes rows asynchronously.
    *   **Resume Download:** If `resumecv` contains a valid URL, the file is streamed to the AI Service (`apps/backend-ai`) for parsing.
    *   **Deduplication:** The system performs an `upsert` on the `Candidate` table using the email address.

---

## 3. Managing Imports (Stop & Delete)

The new Async Import System provides granular control over long-running ingestion tasks.

### Monitoring Progress
The "Import History" panel on the right side of the page shows all recent import batches.
*   **Status:** `PENDING` -> `PROCESSING` -> `COMPLETED`.
*   **Progress Bar:** Shows real-time row processing status.
*   **Errors:** Counts rows that failed validation.

### Stopping an Import
You can halt a running import at any time.
1.  Click the **Stop (Red Circle)** icon next to a `PROCESSING` batch.
2.  The system will stop processing *new* rows immediately.
3.  Rows already processed are preserved.

### Deleting an Import
You can revert an import if needed.
1.  Click the **Trash** icon next to any batch.
2.  **Effect:**
    *   The `ImportBatch` record is deleted.
    *   All `Application` records created *specifically* by this batch are **deleted**.
    *   `Candidate` profiles are **preserved** (to safely handle shared/updated candidates) but are unlinked from the deleted batch.

---

## 4. Business Logic & Filters

> **⚠️ Critical:** The importer contains hardcoded logic to filter candidates based on location.

### A. The "Morocco Filter"
Located in `csv-import.service.ts` -> `isMoroccoCandidate()`.

The system **skips** rows unless the location column matches specific keywords:
*   *Keywords:* "Morocco", "Maroc", "Casablanca", "Rabat", "Tangier", "Marrakech", "Agadir", "Fes", "Meknes", "Sale".
*   *Phone Check:* Alternatively, if the phone number starts with `+212` or `00212`.

**To disable this:** You must modify `src/csv-import/csv-import.service.ts` and remove the `if (!this.isMoroccoCandidate(row))` check in `processRow`.

### B. Job Bucket Assignment
The system tries to find a `Job` in the database where `title` matches the CSV `poste` column (case-insensitive).

*   **Match Found:** Application created linked to that Job ID.
*   **No Match:**
    1.  System looks for a job named **"General Import"**.
    2.  If not found, it creates a new Draft Job named "General Import".
    3.  Candidate is assigned to this bucket.

---

## 5. "Silent Mode" Deduplication

To prevent database pollution, the importer uses specific strategies when it encounters existing data.

### Scenario A: Strict Match (Email / LinkedIn)
If `john.doe@gmail.com` already exists, or a matching LinkedIn URL is found:
1.  **Profile Update:** The candidate's phone, name, and location are updated.
2.  **Application Merge:**
    *   If an application for the *same job* exists: The metadata and resume are updated. The status is preserved.
    *   If it's a *new job*: A new application record is created.

### Scenario B: Fuzzy Match (Name + Phone)
If no email is found, but `LastName` and `Phone` (normalized to E.164) match an existing candidate:
*   The system treats this as the **Same Candidate**.
*   The record is updated (merged) rather than creating a duplicate.

### Scenario C: AI Resume Parsing
If a resume URL is provided, the system queues a **Background Job** (`process-application`) in Redis.
*   This ensures the HTTP upload doesn't timeout while waiting for Python/Gemini to analyze thousands of PDFs.
*   AI Parsing results (Skills, Experience Years) will populate asynchronously a few seconds/minutes after the import finishes.

---

## 6. Sample CSV Template

Copy the header row below to prepare your data for import.

```csv
firstname,lastname,email,telephone,location,poste,resumecv,french,english,linkedinProfile
John,Doe,john@example.com,+212600123456,Casablanca,Senior Developer,https://mysite.com/resume.pdf,Native,Fluent,https://linkedin.com/in/johndoe
Jane,Smith,jane@test.com,+212600998877,Rabat,Marketing Manager,,Intermediate,Native,
```