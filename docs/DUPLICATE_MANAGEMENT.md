# Duplicate Management

This document outlines how the **HT Recruitment OS** handles duplicate candidates to maintain data integrity and prevent pollution. The system employs different strategies depending on the source of the data (Bulk Import vs. Chrome Extension).

## 1. Core Principle available
The primary unique identifier for a candidate is their **Email Address**. However, secondary "fuzzy" matching strategies are also available to catch duplicates that might have slight variations or missing emails.

---

## 2. Bulk Data Import (CSV)

When importing candidates via the CSV Importer (`/settings/import`), the system runs in **"Silent Mode"** to handle existing data gracefully without erroring out.

### A. Strict Deduplication (Email)
The importer performs an `upsert` operation based on the **Email** column.

*   **If Email matches an existing candidate:**
    1.  **Profile Update:** The existing candidate's **Name**, **Phone**, and **Location** are updated with the values from the CSV.
    2.  **Application Logic:**
        *   **Same Job:** If the candidate already has an application for the *same job*, the system updates the **Metadata** and **Resume** but **preserves the current Application Status** (e.g., if they were "Rejected", they stay "Rejected").
        *   **Different Job:** A new Application record is created for the new job, linked to the existing Candidate profile.

### B. Fuzzy Matching (Phone/Name)
If enabled in the configuration, the system can use the **Telephone** column for fuzzy matching.
*   **Logic:** Matches based on `LastName` + `PhoneNumber` (typically checking the last 6 digits or normalized format).
*   **Behavior:** merged similar to the Email match scenario.

---

## 3. Chrome Extension Sourcing (LinkedIn)

The Chrome Extension (`/docs/chrome-extension`) injects data directly into the system (`POST /candidates`). Since LinkedIn profiles often lack public email addresses, the deduplication logic here is more aggressive.

### A. Strict Match
*   **Check:** Exact **Email** match.
*   **Action:** Updates the existing profile with scraped data (e.g., updated "About" section, new "Experience").

### B. Fuzzy Match (Fallback)
If no email is provided (common on LinkedIn), the system attempts to find a match using:
*   **Logic:** `LastName` (case-insensitive) **AND** `PhoneNumber` (last 6 digits).
*   **Action:**
    *   **Match Found:** Merges the new scrapped data into the existing profile.
    *   **No Match:** Creates a new Candidate profile.

---

## 4. Resume Handling (AI Parsing)
When a duplicate is processed, the system also handles the Resume/CV:

*   **URL Provided:** If the import/source includes a Resume URL, it is downloaded and processed.
*   **AI Re-Vectorization:** The new resume is parsed by the AI Service (`apps/backend-ai`) to update the candidate's **Vector Embedding**. This ensures that even if the candidate profile is old, their semantic searchability is updated to reflect their latest CV.
