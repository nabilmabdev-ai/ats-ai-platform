Here is **`docs/CSV_TEMPLATE.md`**. This document provides the exact specifications for bulk data ingestion, including the specific header mappings, metadata extraction rules, and the "Silent Mode" logic.

***

# CSV Import Specifications & Templates

This document details the required format for importing candidates into **HT Recruitment OS** via the Bulk Import tool.

The system uses a smart normalizer that strips special characters, accents, and spaces from headers. This means headers are case-insensitive and forgiving (e.g., `First Name`, `firstname`, and `First-Name` are treated identically).

---

## 1. File Requirements

*   **File Type:** `.csv` (Comma or Semicolon separated).
*   **Encoding:** UTF-8 (Required for special characters in names/locations).
*   **Max Size:** 10MB per file (recommended split for larger datasets).

---

## 2. Core Columns (Identity & Job)

These columns map directly to the `Candidate` and `Application` tables.

| Target Field | Accepted Headers | Status | Description |
| :--- | :--- | :--- | :--- |
| **Email** | `email` | **Required** | The unique identifier. Used for deduplication. |
| **First Name** | `firstname`, `firstnamefirst` | **Required** | |
| **Last Name** | `lastname`, `lastnamelast` | **Required** | |
| **Phone** | `telephone`, `phone`, `numerodetelephoneinternational` | Optional | Used for fuzzy matching. International format preferred (e.g., `+212...`). |
| **Location** | `location`, `countrycity`, `dansquelpaysetesvoussitue` | Optional | **Important:** Used by the [Region Filter](#4-filtering-logic). |
| **Job Title** | `poste`, `jobtitle`, `position` | Optional | Maps to an existing Job. If no match is found, creates/uses a "General Import" job. |
| **Resume** | `resumecv`, `resume`, `cv` | Optional | **Must be a public URL** (http/https). Local file paths (`C:\Users\...`) will fail. |
| **Cover Letter** | `coverletter`, `addacoverletter...` | Optional | Public URL to cover letter document. |

---

## 3. Metadata Mapping (Advanced)

The system automatically extracts specific columns into the `application.metadata` JSON field for analytics and sorting.

### Language Skills
Boolean or Text flags indicating proficiency.
*   **Headers:** `french`, `english`, `spanish`, `arabic`, `mandarin`, `cantonese`, `italian`, `russian`, `german`.

### Sourcing Channels
Used to populate the `metadata.sourcing` object.

| Source Type | Trigger Headers |
| :--- | :--- |
| **Referral** | `fromiosemployee`, `referredby`, `referredbyifapplicable` |
| **Job Board** | `indeed`, `linkedin`, `jobillico`, `ziprecruiter`, `kijiji`, `craigslist` |
| **Social** | `facebook`, `instagram` |
| **Job Fair** | `jobfairs` |

### Demographics & Preferences
*   `areyoulookingforfulltimeorparttime`: Maps to `preferences.type`.
*   `whatisyourpreferredworklocation...`: Maps to `preferences.location_pref`.
*   `ifyouareincanada...`: Maps to `demographics.work_eligibility` (Legacy field).

---

## 4. Filtering Logic ("The Morocco Filter")

To prevent spam or out-of-scope imports, the service (`CsvImportService`) enforces strict geographic filtering by default.

**A candidate is SKIPPED unless:**
1.  **Location Match:** The `location` column contains: *Morocco, Maroc, Casablanca, Rabat, Tangier, Marrakech, Agadir, Fes, Meknes, Sale*.
2.  **Phone Match:** The `telephone` column starts with `212` or `00212` or `+212`.

> **Note:** Rows that fail this check count as "Skipped" in the import summary. To disable this, contact the engineering team to update `isMoroccoCandidate()` in the backend.

---

## 5. Handling Resumes (The AI Queue)

The CSV importer does **not** process PDF contents immediately to avoid timeouts.

1.  **Step 1:** The system reads the `resumecv` URL.
2.  **Step 2:** It performs a `HEAD` request to verify the link is accessible.
3.  **Step 3:** It creates the Candidate/Application record instantly.
4.  **Step 4:** It queues a background job (`process-application`) to Redis.
5.  **Step 5:** The **Backend-AI** service downloads the file, performs OCR/Text Extraction, and vectorizes the profile asynchronously.

*Result:* You will see the candidate in the dashboard immediately, but their "AI Summary" and "Skills" might take 1-30 seconds to appear.

---

## 6. Example CSV Template

Copy and paste this into Excel or a text editor to start.

```csv
firstname,lastname,email,telephone,location,poste,resumecv,french,english,linkedinProfile
Amine,Benali,amine.b@example.com,+212600123456,Casablanca,Senior Java Developer,https://my-bucket.s3.amazonaws.com/resumes/amine.pdf,Native,Fluent,https://linkedin.com/in/aminebenali
Sarah,Connor,sarah.c@example.com,+212600998877,Rabat,Customer Service Rep,,Intermediate,Native,
John,Doe,john.d@gmail.com,5145550199,Montreal,Sales Manager,,Basic,Native,
```

**Behavior in example above:**
1.  **Amine:** Imported successfully. Resume queued for AI parsing.
2.  **Sarah:** Imported successfully. No resume attached (profile created).
3.  **John:** **SKIPPED**. Location is "Montreal" and phone is not +212.

---

## 7. Troubleshooting Common Errors

### "0 Candidates Imported"
*   **Check Separator:** Ensure your CSV uses standard commas (`,`) or semicolons (`;`).
*   **Check Location:** Ensure the `location` column exists and contains "Morocco" or a valid city (see Section 4).
*   **Check Headers:** Ensure the email header is exactly `email` or contains the word email.

### "Resume not attached"
*   **Check URL:** The `resumecv` column must contain a direct link (e.g., `https://.../file.pdf`).
*   **Check Access:** The server must be able to reach that URL. If it's behind a login (e.g., a private Google Drive link), the import will fail to download the file.

### "Job Title Mismatch"
*   If the `poste` column contains "Frontend Dev" but the Job in the system is "Senior Frontend Developer", the system tries a case-insensitive match.
*   If no match is found, the candidate is added to a job named **"General Import"**. Check that job bucket for missing candidates.