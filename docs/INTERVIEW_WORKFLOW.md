# Interview Workflow Guide

This document outlines the complete lifecycle of an interview in the **HT Recruitment OS**, from scheduling to the final hiring decision.

## 1. Scheduling ("Smart Schedule")

The platform uses an intelligent scheduling system to eliminate the back-and-forth of finding a time slot.

### The Flow
1.  **Trigger:** A recruiter clicks "Schedule Interview" on a Candidate profile.
2.  **link Generation:** The system generates a unique, secure link (e.g., `ats.com/book/abc-123`).
3.  **Availability Check:** When the candidate opens the link, the system checks:
    *   Interviewer's Work Hours (e.g., 9 AM - 6 PM).
    *   Existing ATS Bookings.
    *   Connected Google Calendar (Real-time "Busy" check).
4.  **Booking:** The candidate selects a slot. The system:
    *   Creates a `CONFIRMED` interview record.
    *   Sends calendar invites to both parties.
    *   Updates the Application status to `INTERVIEW`.

---

## 2. Conducting the Interview

Failed interviews often result from unstructured feedback. The OS enforces a structured approach suitable for both Manual and AI-assisted evaluations.

### The Interview Page
Located at `/applications/[id]/interview`, this page provides three tools:

#### A. AI Copilot (Real-time Notes)
*   **Input:** The interviewer types rough notes during the call.
*   **Analysis:** Clicking "Run AI Analysis" sends the notes to Gemini.
*   **Output:** The system extracts key Signal strengths, Weaknesses, and suggests a Rating (1-5).

#### B. Human Scorecard
*   **Structured Rating:** Recruiters must rate the candidate on specific skills required by the Job (parsed from the Job Description).
*   **Cultural Fit:** Standard behavioral ratings.

#### C. Question Bank
*   **AI Generation:** One-click generation of Role-Specific, Behavioral, and "Red Flag" checking questions based on the candidate's specific resume and the job description.
*   **Templates:** Interviewers can load shared question templates or save their own.

---

## 3. Post-Interview Decision (New)

Once the interview is complete, the loop must be closed. The system allows immediate actioning of the candidate.

### The Logic
At the bottom of the Interview Page, two **Final Decision** buttons are available:

1.  **REJECT Candidate** (Red)
    *   **Action:** Immediately updates Status to `REJECTED`.
    *   **Effect:** The candidate is removed from the active pipeline.
    *   **Safety:** A confirmation modal asks for final verification.

2.  **ADVANCE to Offer** (Green)
    *   **Action:** Immediately updates Status to `OFFER`.
    *   **Effect:** The candidate moves to the "Offer" stage, ready for offer letter generation.
    *   **Safety:** A confirmation modal ensures this is intended.

### Visual Confirmation
The system uses a custom modal (matching the HT Pastel Soft UI) to prevent accidental clicks, replacing the browser's native `confirm()` dialog.
