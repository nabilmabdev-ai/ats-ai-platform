# Job Status Distinction: Closed vs. Archived

In the ATS AI Platform, **Closed** and **Archived** statuses both serve to remove jobs from the active workflow, but they carry different semantic meanings for reporting and process tracking.

## Summary Table

| Feature | Closed | Archived |
| :--- | :--- | :--- |
| **Primary Meaning** | Position Filled / Success | Position Cancelled / Legacy |
| **Pipeline State** | Read-Only (Frozen) | Read-Only (Frozen) |
| **Global Visibility** | Hidden by default | Hidden by default |
| **Metrics Impact** | Counts as "Hired" | Counts as "Cancelled" / None |

## Detailed Definitions

### 1. Closed (`CLOSED`)
**Use this status when the hiring goal was met.**

*   **Scenario**: You have successfully hired the required number of candidates for the role.
*   **Intent**: The job lifecycle completed naturally and successfully.
*   **Example**: "Senior React Developer" - Hired 2/2 candidates.

### 2. Archived (`ARCHIVED`)
**Use this status when the hiring process was stopped or for historical data.**

*   **Scenario**:
    *   The role was cancelled due to budget cuts or strategy changes.
    *   The position is on indefinite hold.
    *   The job data was imported from a legacy system for reference purposes only.
*   **Intent**: The job lifecycle was interrupted or is irrelevant to current metrics.
*   **Example**: "Q4 Sales Expansion" - Cancelled due to restructuring.

## Functional Behavior
Currently, the platform handles both statuses identically in the User Interface:
*   **Dashboard**: Applications from both statuses are hidden unless "Show Closed Jobs" is toggled on.
*   **Pipeline Board**: Drag-and-drop is disabled (Read-Only).
*   **Candidate Data**: Candidates from both remain fully accessible in the Talent Pool and search.
