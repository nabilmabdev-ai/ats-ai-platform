# Smart Interview Scheduling & Calendar Sync Demo

**Goal**: Demonstrate how the ATS solves the "Email Ping Pong" problem using Smart Scheduling and Unified Availability.

**Target Audience**: Hiring Managers, Recruiters, and Potential Clients.

---

## 🏗️ Prerequisites
1.  **User Account**: Ensure you are logged in as a user with `RECRUITER` or `ADMIN` role.
2.  **Mock Data**:
    *   At least 2 Candidates in `INTERVIEW` stage who are *not* yet scheduled. (Status: `PENDING`).
    *   A connected Google or Outlook account (or use mock data) to show "Busy" slots on the calendar.

---

## 🎬 Scene 1: The "Blind" Recruiter Problem
_Context: Show the old way (or the problem) first._

1.  **Navigate** to `/interviews` (List View).
2.  **Point out** a candidate with "Not Scheduled".
3.  **Narrate**: "Normally, I'd have to open my Outlook, find free times, email the candidate 3 options, and wait 2 days for a reply. If my calendar changes in the meantime, those slots are gone."

---

## 🎬 Scene 2: The Unified Calendar View
_Context: Show how we visualize availability._

1.  **Click** the **"Calendar"** toggle on the `/interviews` page.
2.  **Observe**:
    *   **Blue Blocks**: Confirmed Interviews.
    *   **Gray/Dashed Blocks**: "Busy (Google)" or "Busy (Outlook)".
3.  **Narrate**: "This view pulls real-time data from my Google/Outlook calendar. The gray blocks are my personal meetings or lunch breaks. The system knows I cannot interview during these times."

---

## 🎬 Scene 3: The "Smart Schedule" Workflow
_Context: The "Magic" moment._

1.  **Click** the **"Smart Schedule"** button (Top Right).
2.  **Modal Opens**: It lists all candidates currently in `INTERVIEW` stage who need invites.
3.  **Action**:
    *   **Select** one or all candidates.
    *   **Type** a custom note in the "Custom Message" box (e.g., "Looking forward to meeting you!").
4.  **Click** **"Send Invites"**.
5.  **Narrate**: "I just sent personalized booking links to 5 candidates in one click. I didn't check my calendar once."

---

## 🎬 Scene 4: The Candidate Experience (Simulation)
_Context: Showing what the candidate sees._

1.  **Open** a new Incognito window.
2.  **Navigate** to a booking link (e.g., `http://localhost:3000/book/ACTIVE_TOKEN`).
    *   *Tip: You can grab a token from the `Interview` table in DB or console logs.*
3.  **Verify**:
    *   The email Personal Note appears in the invite (simulated).
    *   The calendar shown to the candidate **excludes** the Gray Blocks (Busy times).
    *   It **excludes** weekends/evenings (Work Hours logic).
4.  **Action**: Click a time slot (e.g., "Wednesday 10:00 AM") -> **Confirm**.
5.  **Result**: "Booking Confirmed" screen.

---

## 🎬 Scene 5: Closing the Loop
_Context: Showing the result back in the ATS._

1.  **Return** to the main ATS window.
2.  **Refresh** the Calendar View.
3.  **Observe**:
    *   The new interview appears as a **Blue Block** (Confirmed).
    *   (If Sync Enabled): "If I check my Google Calendar now, this event is already there with the Google Meet link."

---

## 🎬 Scene 6: Verification (Audit Trail)
_Context: Answering "How do I know it was sent?"_

1.  **Click** on the Candidate's name in the Interview event.
2.  **Navigate** to the **Application Details** page.
3.  **Check** the **Activity/Timeline** (or Comments section).
4.  **Observe**: A system note: *"System: Sent interview invite via Smart Schedule. Note: 'Looking forward to meeting you!'"*.
5.  **Narrate**: "Every action is logged. I can see exactly when the invite went out and what I said."


---

## ✅ Key Talking Points
*   **Zero Friction**: What took 3 emails now takes 1 click.
*   **Privacy First**: We don't see *what* the recruiter is doing (Dental Appt), just that they are *busy*.
*   **Live Sync**: "If I book a meeting in Outlook right now, this slot disappears from the booking link instantly."
*   **Reply-To Strategy**: The email comes from the "System" (for high deliverability) but if the candidate clicks Reply, it goes straight to **your** personal inbox. You never miss a message.
