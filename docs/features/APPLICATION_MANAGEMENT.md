# Application Management

This guide covers the management of applications throughout their lifecycle, excluding the interview phase (covered in [Interview Workflow](INTERVIEW_WORKFLOW.md)).

## Application Ownership

To ensure accountability, every application can be assigned an **Owner** (typically a Recruiter).

### Assigning an Owner
Admins and Hiring Managers can manually assign or re-assign a recruiter to an application at any stage (e.g., Sourced, Applied, Screening).

1.  **Navigate** to the Application Details page.
2.  **Locate** the "Assigned Recruiter" section in the right sidebar.
3.  **Search & Select** the desired recruiter from the dropdown.

**Effects:**
*   The application record is updated with the new `ownerId`.
*   An `ASSIGN_OWNER` event is logged in the Audit Trail.
*   **Notification**: The assigned recruiter receives an instant notification (bell) informing them of the assignment.

3.  **Search & Select** the desired recruiter from the dropdown.

### Bulk Dispatch (Auto-Distribution)
For high-volume hiring, Hiring Managers can automatically distribute unassigned applications among a pool of recruiters.

1.  **Navigate** to the Dashboard.
2.  **Click** the **Dispatch** button (Share icon) in the header.
3.  **View** the total number of unassigned applications.
4.  **Add Recruiters** and specify the quantity of applications to assign to each.
5.  **Confirm Dispatch** to process the assignments.

**Effects:**
*   Applications are assigned to recruiters in FIFO order (First-In, First-Out).
*   A `DISTRIBUTE_APPS` event is logged in the Audit Trail.

## Status Management

Applications move through several stages:
`APPLIED` -> `SCREENING` -> `INTERVIEW` -> `OFFER` -> `HIRED`

### Offer Management
When an application reaches the `OFFER` stage, a new **Offer Management** tab becomes available. This specific workflow is detailed in [Offer Management](OFFER_MANAGEMENT.md).

*   **Forward Movement**: Moving candidates forward triggers automation (e.g., "Smart Schedule" invites when moving to `INTERVIEW`).
*   **Rejection**: Requires a specific reason. Can optionally send a rejection email.
*   **Backward Movement**: Restricted. Moving backwards (e.g., Offer to Interview) may cancel generated artifacts like Interview Invites or Offer Letters.
