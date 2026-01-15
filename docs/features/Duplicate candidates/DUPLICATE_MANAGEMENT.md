# Duplicate Management

This document outlines how the **HT Recruitment OS** handles duplicate candidates to maintain data integrity and prevent pollution. The system employs different strategies depending on the source of the data (Bulk Import vs. Chrome Extension).

## 1. Core Architecture
The system relies on a centralized **`DeduplicationService`** to identify potential duplicates across all ingestion points.

### Matching Strategies
1.  **Strict Match (Email):** The primary identifier. Exact match on normalized email address.
2.  **Strict Match (LinkedIn):** Checks for matching LinkedIn Profile URLs.
3.  **Fuzzy Match (Name + Phone):**
    *   **Logic:** Matches candidates with the same **Last Name** (case-insensitive) AND similar **Phone Number**.
    *   **Algorithm:** Phone numbers are parsed and normalized to **E.164 format** (e.g., `+14155550100`) using `google-libphonenumber` before comparison. This ensures `(415) 555-0100` matches `415.555.0100`.

---

## 2. Bulk Data Import (CSV)

When importing candidates via the CSV Importer (`/settings/import`), the system utilizes the `DeduplicationService` to merge data intelligently.

### A. Strict Deduplication
If an **Email** or **LinkedIn URL** match is found:
1.  **Profile Update:** Existing candidate details (Name, Phone, Location) are updated with CSV data.
2.  **Application Logic:**
    *   **Same Job:** Updates metadata/resume, preserves status.
    *   **Different Job:** Creates a new Application linked to the existing Candidate.

### B. Fuzzy Deduplication
If no email match is found, the system checks for **Name + Phone** duplicates.
*   **Behavior:** If a fuzzy match is found with **High Confidence**, the system **Merges** the incoming CSV row into the existing candidate record instead of creating a duplicate.

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

---

## 5. Proactive Prevention (Recruiter Edit)

When a recruiter edits an existing profile (e.g. updating an email address), the system aggressively protects against duplicate creation.

### Workflow: Email Change
1.  **Validation:** Recruiter changes a candidate's email in the **Edit Modal**.
2.  **Check:** System checks if the new email belongs to *another* existing candidate.
3.  **Conflict:** If a match is found, the update is **Blocked** (409 Conflict).
4.  **Resolution:** The recruiter is prompted to **Merge** the current profile into the existing one, ensuring data isn't lost or fragmented.

---

## 6. Proactive Prevention (Manual Entry)

To prevent duplicates entering the system during manual data entry (e.g., when a recruiter manually adds a candidate), the system implements a "Did You Mean?" interception layer.

### Workflow
1.  **Real-Time Check:** As data is typed into the **Add Candidate Form**, the frontend debounces input and queries `POST /candidates/check-duplicity`.
2.  **Detection:** The backend checks for matches on **Last Name**, Email, or normalized Phone.
3.  **Warning UI:** If a match is found, the user is presented with a **"Did You Mean?"** alert showing the existing profile.
4.  **Choice:** The user can:
    *   **View Existing:** Open the profile of the matched candidate.
    *   **Ignore:** Continue creating a new profile (rare edge cases).

---

## 6. CVthèque Doctor (Retroactive Resolution)

The **CVthèque Doctor** is a dedicated Health Dashboard for identifying and resolving duplicates that may have slipped through or were imported before strict rules were in place.

### A. Scanning & Grouping
*   **Service:** `ScanService` runs periodically (or on-demand) to scan the database.
*   **Optimization:** Uses **cursor-based batch processing** (100 candidates/batch) to efficiently scan large databases without memory overhead.
*   **Logic:** It clusters candidates into **`DuplicateGroup`** entities based on fuzzy matching rules. It intelligently appends to existing OPEN groups rather than creating redundant duplicates.
*   **Persistence:** Groups are stored in the database with a status (`OPEN`, `RESOLVED`, `IGNORED`).

### B. Resolution Dashboard
The dashboard (`/cv-doctor`) provides a **Split View** interface for side-by-side comparison of duplicate candidates.
*   **Merge Action:**
    *   The user selects a **Primary Profile**.
    *   All secondary data (Applications, Interviews, Offer history) is moved to the Primary Profile.
    *   The Secondary Profile is deleted.
    *   Smart merging logic handles conflicting fields (e.g., combining tags, preserving most recent resume).
    *   **Ignore Action:**
    *   If the system flagged false positives (e.g., distinct people with same name), the user can mark as "Not a Duplicate".
    *   This creates a **`DuplicateExclusion`** record to prevent these two candidates from ever being flagged again.

---

## 7. Related Profiles (Linked Accounts)

Sometimes, two profiles are **distinct** but **related** (e.g., same name, or known duplicates that must be kept separate for compliance reasons).

*   **Logic:** When a user selects **"Not a Duplicate"** (Ignore) in the Resolution Dashboard, the system doesn't just hide the match—it **Links** them.
*   **Visibility:** These exclusions are surfaced in the **Candidate Profile** as a **"Related Profiles"** badge.
*   **Workflow:** This allows recruiters to easily toggle between two similar profiles ("Did you mean the *other* John Smith?") without merging their data.

