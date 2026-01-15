# Audit Logging

The Audit Logging system provides a trail of critical actions taken within the system for security and compliance purposes.

## Architecture

### Backend
- **Module**: `AuditModule`
- **Data Model**: `AuditLog` (Prisma)
  - Fields: `actorId`, `action` (e.g., CREATE_JOB), `target` (e.g., Job:123), `details` (JSON), `transient` metadata (IP, UserAgent).
- **Service**: `AuditService`
  - `log(action, actorId, target, details)`: Asynchronously writes to the database.
- **Triggers**:
  - `UPDATE_CANDIDATE`: Logs field-level differences (Old vs New) for recruiter edits.
  - `MERGE_CANDIDATES`: Logs when profiles are merged.
  - `ASSIGN_INTERVIEWER`: Logs when an interviewer is manually assigned or changed for an interview.
  - `ASSIGN_OWNER`: Logs when a recruiter/owner is assigned to an application.
  - `DISTRIBUTE_APPS`: Logs when applications are bulk-distributed to recruiters.



- **Interceptor**: `AuditInterceptor` (Optional Global Handler)
  - Can be attached to controllers to automatically log specific mutations (POST/PUT/DELETE).

### Frontend
- **Page**: `/settings/audit`
  - Admin-only view (Role checks to be enforced).
  - Displays a tabular view of system activity.
  - Fields shown: Timestamp, Actor, Action, Target, Details.

## Usage
To verify compliance actions or investigate security incidents, admins can access the Audit Logs in the Settings area.
