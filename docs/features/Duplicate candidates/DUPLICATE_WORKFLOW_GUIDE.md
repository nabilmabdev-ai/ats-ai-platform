# User Guide: Managing Duplicates in Your Daily Workflow

This guide explains how to leverage the **CVthèque Doctor** and **Proactive Prevention** features to maintain a clean and efficient candidate database.

## 1. When Sourcing New Candidates (Proactive)

**Scenario:** You are manually adding a candidate you just spoke with on the phone or found on LinkedIn.

**The Workflow:**
1.  Go to **Create New Job** > **Add Candidate** (or the global **Add Candidate** button).
2.  Start typing their **Name**, **Email**, or **Phone**.
3.  **Watch for the Alert:**
    *   If the system detects a similar profile (e.g., matching email or similar name + phone), a yellow **"Did you mean?"** box will appear.
4.  **Decision Time:**
    *   **⛔ STOP:** If it's the same person, click **"View Existing"**. You can then add them to the new job pipeline directly from their profile. *Benefit: Preserves their history and avoids fragmentation.*
    *   **✅ PROCEED:** If it is definitely a different person (e.g., same name but different company/location), ignore the warning and click **Create Profile**.

---

## 2. After Bulk Imports (Reactive Cleanup)

**Scenario:** You just imported 500 candidates from a CSV file. The system automatically merged exact email matches, but some "fuzzy" matches (name variations, typos) might need human eyes.

**The Workflow:**
1.  Navigate to the **Dashboard**.
2.  Look for the **CV Doctor** link in the header.
3.  **Review the Report:**
    *   Click **Refresh Scan** to trigger a real-time check of the database.
    *   You will see a list of "Duplicate Groups" flagged by the AI.
4.  **Process the Queue:**
    *   Click **Review & Resolve** on a group.
    *   **Compare:** Look at the Side-by-Side view. Check:
        *   Are the phone numbers the same?
        *   Is the work history overlapping?
        *   Is the LinkedIn URL identical?
    *   **Action:**
        *   **🔀 MERGE:** If they are the same person. Select the "Primary" profile (usually the one with the most complete data or recent activity). The system will move all applications and notes to the Primary and delete the duplicate.
        *   **🚫 NOT A DUPLICATE:** If they are different people (e.g., "John Smith" at Google vs. "John Smith" at Amazon).
            *   **Action:** Click "Not a Duplicate".
            *   **Result:** The system whitelists this pair. They will **Link** to each other on their profile pages (via a "Related Profiles" badge) so you can easily switch between them, but they will never clog up your duplicate report again.

---

## 3. Periodic Health Check (Weekly Routine)

**Scenario:** Keeping your database healthy over the long term.

**The Workflow:**
*   **Time:** Schedule 15 minutes every Friday.
*   **Action:** Visit **CVthèque Doctor**.
*   **Goal:** Reach **"Zero Duplicates"**.
*   **Why?** A clean database means:
    *   **Better Search Results:** You don't see the same person 3 times in search.
    *   **Smarter AI:** The AI matching algorithm works better when candidate history is consolidated.
    *   **Professionalism:** You won't accidentally email the same candidate twice for the same job.

## Best Practices
*   **Trust the Email:** If emails match, the system usually merges automatically. Trust this.
*   **Verify Phones:** The system normalizes phones (e.g., `+33 6...`). Use this to spot duplicates even if formatting differs.
*   **When in Doubt, Ask:** If you are unsure if two "John Does" are the same, check their Resume/CV documents before merging. Merging is irreversible!
