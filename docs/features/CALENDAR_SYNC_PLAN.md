# Calendar Interface & Synchronization Plan

**Context**: The application now features a fully interactive Calendar UI with two-way sync support for Google and Outlook. The backend acts as the source of truth for unified availability.

---

## 1. The Case for a "Real" Calendar Interface
Moving from a List View (`/interviews`) to a Calendar View (Weekly/Monthly Grid) is critical for:
*   **Gap Analysis**: Recruiters can visually spot "free blocks" for scheduling, rather than reading a list of times.
*   **Context Switching**: Users already live in their Outlook/Google calendars. Mimicking this UI reduces cognitive load.
*   **Drag & Drop**: Rapidly rescheduling an interview by dragging it to a new slot is much faster than editing a form.
*   **Conflict Visibility**: Visualizing overlapping interviews or "busy" blocks from external calendars prevents double-booking errors immediately.

**Relevant Frontend Files**:
*   `apps/frontend/src/app/interviews/page.tsx` (Target for replacement/enhancement)
*   New Component: `CalendarGrid.tsx` (using libraries like `react-big-calendar` or `fullcalendar`)

---

## 2. Google Calendar Sync (Refinement)
**Current State**: We have `GoogleCalendarService` and some `User` fields (`googleAccessToken`), but the full OAuth flow and webhook listeners are likely incomplete or manual.

### Phase 1: Robust OAuth 2.0 Flow (Implemented)
*   **Goal**: seamless "One Click" connection in Settings.
*   **Implementation Details**:
    *   **Frontend**: "Connect Google Calendar" redirects to `API_URL/auth/google?userId=...`.
    *   **Backend**: 
        *   Accepts `userId` and passes it as `state` to Google.
        *   Callback (`/auth/google/callback`) retrieves `userId` from state.
        *   Exchanges code for `access_token` and `refresh_token` (offline mode enabled).
        *   Updates `User` record and redirects back to Settings.
*   **Files**: `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/users/users.service.ts`

### Phase 2: Two-Way Sync
*   **Outbound (ATS -> Google)**:
    *   **Trigger**: `InterviewsService.create` and `update`.
    *   **Logic**:
        *   Check if `user.googleAccessToken` exists.
        *   Use `googleapis` to `calendar.events.insert` or `patch`.
        *   Store `googleEventId` in `Interview` model (need schema update).
    *   **Retry Policy**: If token expired, use `refresh_token`. If that fails, marked as "Disconnected".
*   **Inbound (Google -> ATS)**:
    *   **Strategy**: Periodic Polling (Cron) + Incremental Sync.
    *   **Endpoint**: `GET /calendars/primary/events?syncToken=...`
    *   **Logic**:
        *   Store `nextSyncToken` in `User` model.
        *   On run, fetch changes since `syncToken`.
        *   If event deletes -> Cancel ATS interview.
        *   If event moves -> Update ATS `scheduledAt`.
        *   **Conflict**: If ATS has conflicting change, "Latest Write Wins" or prompt user (MVP: Latest Write).
*   **Files**: `src/interviews/google-calendar.service.ts` (enhanced), `src/tasks/sync.task.ts`

---

## 3. Microsoft Outlook (Graph API) Sync
**Context**: Requires registering an Azure AD App (Multi-tenant or Single-tenant).

### Phase 1: Azure Setup & Auth
*   **Goal**: Obtain `clientId` and `clientSecret`.
*   **Schema Changes**:
    *   `User` model: Add `outlookAccessToken`, `outlookRefreshToken`, `outlookExpiry` (DateTime).
*   **Auth Flow**:
    *   Construct OAuth2 URL for `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`.
    *   Scopes: `User.Read`, `Calendars.ReadWrite`, `offline_access`.
    *   Callback triggers token exchange via `https://login.microsoftonline.com/common/oauth2/v2.0/token`.

### Phase 2: Microsoft Graph Integration
*   **Service**: `OutlookCalendarService`.
*   **API**: `https://graph.microsoft.com/v1.0/me/calendar/events`.
*   **Logic**:
    *   **Fetching Busy Slots**: Query events between `start` and `end`.
    *   **Creating Events**: POST to `/events` with JSON body (Subject, Start, End, Body).
    *   **Token Refresh**: Graph tokens die fast (60-90 min). Middleware must check expiry and use `refresh_token` before every request.

---

## 4. Implementation Logic & Phases

### Phase A: The Backend Core (Unified Availability)
Before building the UI, the backend must be the "Source of Truth" for availability.
1.  **Unified `getFreeSlots`**:
    *   Input: `dateRange`, `interviewerId`.
    *   Logic: `WorkHours` - `InternalInterviews` - `GoogleBusy` - `OutlookBusy` = `FreeSlots`.
2.  **Relevant File**: `src/interviews/calendar.service.ts` (This is the brain).

### Phase B: The Frontend Calendar
1.  **Library Selection**: `react-big-calendar` is standard for React. `FullCalendar` is more powerful but heavier.
2.  **Data Fetching**:
    *   Fetch `interviews` (Events).
    *   Fetch `busySlots` (Background grey blocks from Google/Outlook).
3.  **Interactions**:
    *   Click Empty Space -> Open "Schedule Interview" Modal.
    *   Click Event -> Open "Reschedule/Cancel" Modal.

### Phase C: Sync "Cron" Jobs
To keep things simple initially, use a scheduled task (Cron) rather than complex webhooks.
*   **File**: `apps/backend-core/src/tasks/sync.service.ts` (New)
*   **Logic**: Every 15 mins, loop through connected users -> Fetch Google/Outlook changes -> Update ATS Interviews if needed.

---

## Technical Checklist
- [x] **Schema**: `User` model has Google auth fields. (Outlook fields pending).
- [x] **Dependencies**: `googleapis`, `react-big-calendar` installed.
- [x] **Frontend**: Basic Calendar UI implemented with Navigation.
- [x] **Azure**: Register app in Azure Portal for Outlook. (Codebase ready, credentials pending).
- [x] **GCP**: Verify Google Cloud Console credentials (Done).
- [x] **Sync Logic**: Implemented `CalendarService` unification, `SyncService`, and `TasksModule`.
- [x] **Frontend Integration**: Implemented Calendar View with external busy slot visualization.

