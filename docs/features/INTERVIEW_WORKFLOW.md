# Interview Workflow Guide

This document outlines the complete lifecycle of an interview in the **HT Recruitment OS**, from scheduling to the final hiring decision.

## 1. Scheduling ("Smart Schedule")

The platform uses an intelligent scheduling system to eliminate the back-and-forth of finding a time slot.

### The Flow
1.  **Trigger:** A recruiter clicks "Smart Schedule" from the dashboard or candidate profile.
2.  **Customization:** The recruiter selects candidates and can optionally:
    *   Add a **Custom Personal Message** (e.g., "Great chatting with you!").
    *   This message is injected into the invite email.
3.  **Link Generation:** The system generates a unique, secure link (e.g., `ats.com/book/abc-123`).

3.  **Availability Check:** When the candidate opens the link, the system checks:
    *   Interviewer's Work Hours (e.g., 9 AM - 6 PM).
    *   Existing ATS Bookings.
    *   Connected Google Calendar (Real-time "Busy" check).
4.  **Booking**: 
    *   **Step A (Invited)**: System creates a `PENDING` interview record (unscheduled).
    *   **Step B (Candidate Selects)**: The candidate selects a slot. The system:
        *   Updates record to `CONFIRMED`.
        *   Sets the `scheduledAt` date.
        *   **Notification**: The Interviewer receives an instant "Interview Booked" notification.
    *   Sends calendar invites to both parties.
    *   Sends calendar invites to both parties.
    *   Updates the Application status to `INTERVIEW`.

### Visibility
### Visibility & Audit
*   **Interviews List**: Pending (Unscheduled) interviews appear in the main `/interviews` list with a status of `PENDING`.
*   **Activity Log**: The sending of the invite is logged in the Candidate's timeline as a system note (e.g., *"System: Sent interview invite... Note: 'Looking forward...'"*).
*   **Calendar View**: Displays all `CONFIRMED` interviews and overlays "Busy" slots (gray blocks) from connected Google/Outlook calendars to help recruiters visualize availability holes.
*   **Interviewer Assignment**: Recruiters can manually assign or change the interviewer for any scheduled interview directly from the list view. This updates the record, logs the action, and **notifies the new interviewer**.




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
    *   **Logging:** Captures a structured **Rejection Reason** (e.g., "Skills Gap", "Culture Fit") which populates the "Rejection Analysis" report.
    *   **Effect:** The candidate is removed from the active pipeline.
    *   **Safety:** A confirmation modal asks for final verification.

2.  **ADVANCE to Offer** (Green)
    *   **Action:** Immediately updates Status to `OFFER`.
    *   **Effect:** The candidate moves to the "Offer" stage, ready for offer letter generation.
    *   **Safety:** A confirmation modal ensures this is intended.

### Visual Confirmation
The system uses a custom modal (matching the HT Pastel Soft UI) to prevent accidental clicks, replacing the browser's native `confirm()` dialog.
