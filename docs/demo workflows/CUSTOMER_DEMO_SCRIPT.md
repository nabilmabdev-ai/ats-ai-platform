# 🚀 ATS Platform: The "Killers Features" Demo Script (60 Minutes)

## 🎯 Objective
To prove that this is not just a database, but an **Intelligent Recruitment OS** that automates the hardest 40% of a recruiter's day.

## 🕒 Agenda Overview
1.  **Introduction & The "Control Tower"** (10 mins) - *Dashboard & Metrics*
2.  **Killer Feature #1: "The Needle in the Haystack"** (15 mins) - *Hybrid AI Search*
3.  **Killer Feature #2: "Zero-Data Entry"** (10 mins) - *Resume Parsing & Candidate Management*
4.  **Killer Feature #3: "The 30-Second Offer"** (15 mins) - *Pipeline & Smart Contracts*
5.  **Killer Feature #4: "Impossible to Double Book"** (5 mins) - *Smart Calendars*
6.  **Q&A** (5 mins)

---

## 🎬 Minute 0-10: The Control Tower (First Impression)
**Page**: `/dashboard`

*   **Narrative**: "Recruitment operations usually break down because of blind spots. We start with the Control Tower."
*   **The 'Wow' Trigger**:
    *   Show **Live Metrics**: "This isn't a static report. It's real-time."
    *   **Action**: Click on "Scheduled Interviews".
    *   **Value**: "Your team knows exactly who to call, when to call, and what's falling behind immediately."

---

## 🔍 Minute 10-25: Killer Feature #1 - "The Needle in the Haystack"
**Page**: `/search` (Tab: **Discovery**)

*   **The Problem**: "Most ATS searches are dumb. If you search 'Manager', you miss 'Lead'. If you search 'React', you miss 'Frontend Expert'."
*   **The Solution (Hybrid Search)**:
    *   **Action**: Type a *concept* query: *"Experienced developer who knows how to build finance apps and speaks French"*
    *   **Click**: "AI Search".
    *   **The 'Wow' Moment**: Show results that **do not** have the exact word "finance" but have "Banking" or "Fintech".
    *   **Explain**: "Our AI understands *intent*, not just keywords. We just found 3 candidates your competitors missed because they used a standard keyword search."
*   **Deep Dive**:
    *   **Filters**: Overlay "Location: Casablanca" and "Exp: >5 years".
    *   **Speed**: Emphasize sub-100ms response time on a large database.

---

## 🗂️ Minute 25-35: Killer Feature #2 - "Zero-Data Entry & Data Integrity"
**Page**: `/search` (Tab: **Database**) -> **Add Candidate Modal**

*   **The Narrative**: "Recruitment is messy. You have CVs in emails, old Excel sheets, and random folders. Deduplicating this manually is impossible. We automated it."

### Part A: The "One-Off" Import
*   **Action**: Click **"+ Add Candidate"**.
*   **The 'Wow' Moment**: Drag & Drop a complex, messy PDF resume.
*   **Observation**: Watch the system instantly extract Name, Email, Phone, Skills, and Experience.

### Part B: The "Mass Migration" (Excel Import)
*   **Narrative**: "What if you have 5,000 candidates in an old Excel file?"
*   **Action**:
    *   Click **"Import Candidates"**.
    *   Upload `legacy_database.xlsx`.
    *   **The 'Wow' Moment**: The system doesn't just dump data. It runs **Smart Deduplication**.
    *   **Logic**: "It checks Emails (Strict) AND Name+Phone (Fuzzy). If 'John Doe' exists, it updates his profile instead of creating a clone."
*   **Result**: "You just migrated 5 years of history in 2 minutes, with zero duplicates."

---

## 🚀 Minute 35-50: Killer Feature #3 - "The 30-Second Offer"
**Page**: `/applications` (Kanban Board)

*   **The Narrative**: "The candidate is great. Now, the paperwork nightmare begins. Usually, this takes 2 days of emails. We do it in 30 seconds."
*   **Action Flow**:
    1.  **Kanban**: Drag candidate from **Screening** -> **Offer**.
    2.  **Logic**: "The system knows we need an offer now."
    3.  **Click**: "Manage Offer".
    4.  **Template Magic**: Select *"CDI Standard (Morocco)"*.
    5.  **The 'Wow' Moment**: The system auto-calculates **CNSS**, **AMO**, and **Net Salary** based on the Gross input.
    6.  **Send**: Click "Send to Candidate".
*   **Value**: "Compliance is baked in. No manual calculation errors. No legal risks."

---

## 📅 Minute 50-55: Killer Feature #4 - "Impossible to Double Book"
**Page**: `/interviews`

*   **The Problem**: "Scheduling tag. 'Are you free Tuesday?' 'No, how about Wed?'."
*   **The Solution**:
    *   **Action**: "Smart Schedule".
    *   **The 'Wow' Moment**: The system pulls **your real Google/Outlook Calendar**, overlays the candidate's availability, and generates a **Single Link**.
    *   **Value**: "You send one link. They pick a slot. It's on everyone's calendar. Done."

---

## ❓ Minute 55-60: Q&A & Next Steps
*   **Closing Hook**: "We didn't just show you a database. We showed you an automated recruiting assistant that works 24/7."
*   **Call to Action**: "Ready to import your current database?"

---

## 🛠️ Demo Prep Checklist
*   [ ] **Seeding**: Run `npm run seed` 1 hour before to populate fresh data.
*   [ ] **AI Worker**: Ensure Python service is running for the Search demo.
*   [ ] **Asset**: Have a "Messy PDF" ready (e.g., weird formatting) to prove the parser's strength.
*   [ ] **Asset**: Have a "Good Match" candidate hidden in the DB that matches your "Concept Search" query.
