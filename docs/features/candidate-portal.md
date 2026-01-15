# Candidate Portal

The Candidate Portal is a dedicated, secure interface designed specifically for candidates to access their profile and track application statuses without needing a complex username/password account managed by recruiters.

## Overview
- **Path**: `/portal`
- **Authentication**: Passwordless "Magic Link"
- **Goal**: Provide transparency and ease of access to candidates.

## Workflow

### 1. Access & Authentication
The portal uses a secure Magic Link flow to eliminate the friction of password management.
1.  **Request**: Candidate visits `/portal/login` and enters their email.
2.  **Validation**: Backend verifies the email exists in the `Candidate` database.
3.  **Token Generation**: A JWT with `type: 'magic-link'` is generated (expires in 15m).
4.  **Email**: System sends a link: `https://.../portal/login/verify?token=...`

### 2. Verification
1.  **Click**: Candidate clicks the email link.
2.  **Exchange**: The `/portal/login/verify` page captures the token and POSTs to `/auth/magic-login`.
3.  **Session**: The backend validates the signature and expiration, then issues a standard, long-lived **Session Token** (JWT).

### 3. Dashboard Experience
Upon successful login, the candidate is redirected to `/portal/dashboard`.
- **Welcome**: Personalized greeting.
- **Application Tracking**: A list of active applications showing:
    - **Job Title**
    - **Applied Date**
    - **Current Status** (e.g., Screening, Interview, Offer)
    - **Action Buttons**: (Future) Ability to view offer letters or schedule interviews.

## Technical Architecture

### Frontend
- **Layout**: Uses a separate `PortalLayout` (`/portal/layout.tsx`) that excludes the Recruiter Sidebar and Admin controls.
- **State**: Manages session via `localStorage` (or secure HttpOnly cookies in production).

### Backend
- **AuthService**: Handles Magic Link generation and verification.
- **Endpoints**:
    - `POST /auth/magic-link`: Triggers the email.
    - `POST /auth/magic-login`: Exchanges token for session.
    - `GET /candidates/me` (Planned): To fetch authenticated candidate details.

## Security Features
- **Short-lived Tokens**: Magic link tokens expire quickly (15 mins) to prevent reuse/intercept risks.
- **Role Isolation**: The portal session identifies the user specifically as a `CANDIDATE`, restricting access to Recruiter/Admin APIs.
