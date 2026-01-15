# Job Management & Workflow

This document details the lifecycle of a Job (Vacancy) within the ATS, including status transitions, approval logic, and automated distribution.

## Job Status Lifecycle

The system enforces a strict state machine for job vacancies to ensure quality control and proper authorization.

### States
1.  **DRAFT**: Initial state. Job is visible only to the creation team. No external distribution.
2.  **PENDING_APPROVAL**: The job is ready for review.
    *   **Action**: Notification sent to Admins.
    *   **Guard**: Job cannot be published until approved.
3.  **PUBLISHED**: The job is live.
    *   **Action**: `approvedAt` timestamp set. `approvedBy` user recorded.
    *   **Side Effect**: Job is distributed to external boards (LinkedIn, Indeed) via the Distribution Service.
    *   **Notification**: Hiring Manager is notified if they did not publish it themselves.
4.  **CLOSED**: The job is no longer accepting applicants.
    *   **Action**: All active candidates (not Hired/Offered) are automatically moved to `REJECTED`.

## Approval Workflow

### 1. Requesting Approval
When a recruiter finishes drafting a job, they change the status to `PENDING_APPROVAL`.
- **System**: Logs the status change.
- **Notification**: Alerts all users with `ADMIN` role that "Job [Title] needs approval".

### 2. Publishing (Approval)
An Admin (or authorized user) changes the status to `PUBLISHED`.
- **System**:
    - Sets `approvedById` to the current user.
    - Sets `approvedAt` to `now()`.
    - Updates `distribution` status for connected platforms (LinkedIn, Indeed) to `POSTED`.
- **Notification**: Alerts the Hiring Manager (if different from the Approver) that their job is live.

## Distribution
Distribution is simulated in the current version but architected to support real integrations.
- **LinkedIn**: Status tracks to `distribution.linkedin.status`
- **Indeed**: Status tracks to `distribution.indeed.status`

## Automated Actions
- **Silver Medalist Sourcing**: When a job is created, the system automatically searches for "Silver Medalists" (past high-quality rejected candidates) and invites them if they match the new job requirements.
