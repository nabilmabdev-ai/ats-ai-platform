# Sourcing Workflow

## Overview
The current sourcing workflow in the ATS AI Platform is primarily automated through a **Silver Medalist** matching system. There is no manual "Sourcing" stage where recruiters explicitly add candidates from external sources (like LinkedIn) via an extension yet. Instead, "Sourcing" refers to re-engaging past candidates who are good fits for new roles.

## Data Model
- **Status**: `AppStatus.SOURCED` is the specific status used to identify sourced candidates.
- **Tags**: Sourced applications are automatically tagged with `Silver Medalist` and `AI Sourced`.
- **Source**: There is no dedicated "Source" field (e.g., "Agency", "Referral") in the database schema. The source is implicit in the workflow (internal database).

## Silver Medalist Automation
When a new Job is created, the system automatically triggers a background process to find "Silver Medalists".

### Trigger
- **Event**: `JobsService.create()`
- **Action**: Calls `autoSourceSilverMedalists(jobId)`

### Logic
1.  **AI Matching**: The system sends the new job description to the AI Service (`/match-job`) to find relevant candidates from the existing talent pool.
2.  **Filtering**: Candidates returned by the AI are filtered based on the following criteria:
    - **Has Rejection**: The candidate must have been rejected in a previous application (`AppStatus.REJECTED`).
    - **Not Hired**: The candidate must not have been hired for any other role (`AppStatus.HIRED`).
    - **Not Applied**: The candidate must not have already applied to the current job.
3.  **Creation**: For the top 5 matching candidates:
    - A new `Application` is created.
    - Status is set to `AppStatus.SOURCED`.
    - Tags `['Silver Medalist', 'AI Sourced']` are added.
    - `aiScore` and `aiSummary` are populated with the match data.

## Candidate Merging
The merging logic (`CandidatesService.mergeCandidates`) handles `AppStatus.SOURCED` as the lowest priority status. If a sourced candidate applies manually (or is merged with an applicant), the status will likely be upgraded to `APPLIED` or higher, ensuring the active application takes precedence.

## Future Improvements (Potential)
- **External Sourcing**: Add a browser extension to parse LinkedIn profiles and create candidates with `AppStatus.SOURCED`.
- **Source Tracking**: Add a `source` string or enum to the `Candidate` or `Application` model to track origin (e.g., "LinkedIn", "Indeed", "Referral").
- **Manual Sourcing**: Allow recruiters to manually "Source" a candidate from the database to a job without waiting for the auto-trigger.
