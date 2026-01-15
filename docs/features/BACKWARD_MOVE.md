# Backward Move Feature Documentation

## Overview
The "Backward Move" feature allows users to move candidates to previous stages in the hiring pipeline (e.g., from `INTERVIEW` back to `SCREENING`). Unlike forward moves, backward moves trigger strict validation rules and automatic side effects to ensure data consistency and compliance.

## Validation Rules & Permissions

### 1. Role-Based Permissions
| Role | Backward Move Allowed? | Notes |
| :--- | :--- | :--- |
| **Admin** | ✅ Yes | Can move any candidate, even from protected stages like HIRED. |
| **Recruiter** | ✅ Yes | Can move candidates backward from most stages. |
| **Interviewer** | ❌ No | Strictly blocked from moving candidates backward. |
| **Hiring Manager** | ⚠️ Restricted | Typically read-only or forward-only unless granted specific overrides. |

### 2. Protected States
- **HIRED**: Moving a candidate *out* of `HIRED` (e.g., back to `OFFER`) is a high-risk action.
    - **Rule**: Only **Admins** can perform this action.
    - **Reasoning**: Hired candidates may have triggered downstream systems (HRIS, Payroll).

## Automatic Side Effects
When a candidate is moved backward, the system automatically cleans up related entities to prevent "orphan" states.

| Transition | Side Effect | Description |
| :--- | :--- | :--- |
| **INTERVIEW (or higher) → SCREENING/APPLIED** | **Cancel Interviews** | Any `PENDING` or `CONFIRMED` interviews for this application are marked as `CANCELLED`. |
| **OFFER (or higher) → INTERVIEW/SCREENING** | **Void Offer** | Any `DRAFT` or `SENT` offers are marked as `FAILED` (or `VOID`). |
| **INTERVIEW → APPLIED/SOURCED** | **Reset Evaluations** | AI Scores and Summaries are cleared (set to `null`) to allow for re-evaluation. |

## Audit Logging
Every backward move is logged in the `ApplicationHistory` table with:
- **From/To Status**
- **User ID** (Who performed the move)
- **Reason** (Selected from a predefined list, e.g., "Process correction")
- **Notes** (Optional free text)
- **Timestamp**

## Technical Implementation

### Backend
- **Wrapper**: `ApplicationsService.updateStatus`
- **Validation**: `validateTransition(current, next, role)` checks permissions and stage weights.
- **Side Effects**: `handleStatusSideEffects(appId, current, next)` executes cancellations and resets.
- **Security**: Endpoint protected by `JwtAuthGuard`.

### Frontend
- **Detection**: `PipelineBoard` detects if `destinationWeight < sourceWeight`.
- **UI**: Triggers `BackwardMoveModal` to capture mandatory *Reason* and optional *Notes*.
- **Optimistic Update**: UI updates immediately, reverts if backend validation fails.

## Stage Weights
The system uses numeric weights to determine direction:
- `SOURCED`: 0
- `APPLIED`: 10
- `SCREENING`: 20
- `INTERVIEW`: 30
- `OFFER`: 40
- `HIRED`: 50
- `REJECTED`: -1 (Special case, moves to Rejected are treated separately).
