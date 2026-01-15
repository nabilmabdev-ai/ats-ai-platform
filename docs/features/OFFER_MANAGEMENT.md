# Offer Management & Workflow

This document details the lifecycle of an Offer within the ATS, including the approval workflow, PDF generation, and candidate interaction.

## Offer Status Lifecycle

The system enforces a state machine for offers to ensure financial and administrative compliance before sending them to candidates.

### States
1.  **DRAFT**: Initial state. The offer is being drafted by a Recruiter or Hiring Manager.
    *   **Capabilities**: Can regenerate PDF, edit terms (salary, equity, start date).
    *   **Guard**: Cannot be sent to the candidate.
2.  **PENDING_APPROVAL**: The offer is locked and awaits Admin review.
    *   **Action**: Notification sent to Admins (`ACTION_REQUIRED`).
    *   **Guard**: Offer terms cannot be modified without reverting to Draft.
3.  **APPROVED**: The offer has been sanctioned by an Admin.
    *   **Action**: Notification sent to the Creator (`SUCCESS`).
    *   **Capabilities**: Can be sent to the candidate.
4.  **SENT**: The offer has been emailed to the candidate.
    *   **Action**: Candidate receives an email with the PDF link.
5.  **ACCEPTED / DECLINED**: Final states based on candidate response.
    *   **Side Effect**: If `ACCEPTED`, the Application status moves to `HIRED`.

## Approval Workflow

### 1. Creating & Requesting Approval
*   **Context**: Application Details Page -> **Offer Management** Tab.
*   **Action**: User fills in details and generates a Draft.
*   **Request**: User clicks "Request Approval".
*   **System Action**:
    *   Status updates to `PENDING_APPROVAL`.
    *   Admins receive a bell notification linking to the application.

### 2. Admin Review & Approval
*   **Context**: Admin views the Application -> **Offer Management** Tab.
*   **Action**: Admin reviews the generated PDF and terms.
*   **Decision**:
    *   **Approve**: Status updates to `APPROVED`. Originator is notified.
    *   **Reject/Revert**: (Currently manual) Admin tells recruiter to regenerate, effectively keeping it in Draft/Pending cycle until approved.

### 3. Sending to Candidate
*   **Context**: Recruiter receives "Approved" notification.
*   **Action**: Recruiter clicks "Send onto Candidate".
*   **System Action**:
    *   Status updates to `SENT`.
    *   Email dispatched via `EmailService`.

## Integration
*   **Frontend**: `OfferManager` component embedded in `ApplicationPage`.
*   **Backend**: `OffersService` handles logic, `PdfModule` handles generation.
*   **Notifications**: Integrated with `NotificationsService` for synchronous updates.
