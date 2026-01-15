# 🚨 ATS Platform: Critical Gap Analysis & Weaknesses

## Executive Summary
While the platform excels at **Sourcing** (AI Search, Parsing) and **Candidate Intake**, it lacks the **Enterprise Governance** and **Operational depth** required for large organizations (>500 employees).

## 1. Security & Governance (The Biggest Weakness)
### Lack of Role-Based Access Control (RBAC) Scoping
*   **Current State**: Basic `ADMIN` / `RECRUITER` roles.
*   **The Problem**: No "Department-Level" privacy. A Recruiter for "Engineering" can likely see "Executive Finance" candidates.
*   **Enterprise Impact**: **Dealbreaker** for sensitive hiring.
*   **Solution Needed**: Implementation of `Scope` (e.g., `JobPolicy`, `DepartmentPolicy`) in the Auth guards.

## 2. Operational Friction
### No Inbound Email Synchronization
*   **Current State**: Outbound interactions are tracked. Inbound replies (candidate to recruiter) stay in Outlook/Gmail.
*   **The Problem**: The ATS Timeline is incomplete. Recruiters must manually copy-paste replies or update statuses.
*   **Enterprise Impact**: High user churn. Recruiters will stop using the tool if they have to context-switch constantly.
*   **Solution Needed**: Microsoft Graph / Gmail API integration to "listen" for replies to specific threads.

## 3. Rigidity
### Hardcoded Workflow Stages
*   **Current State**: Fixed `APPLIED -> SCREENING -> INTERVIEW -> OFFER`.
*   **The Problem**: Teams cannot customize their process vs. Sales vs. Engineering.
*   **Enterprise Impact**: Low adaptability.
*   **Solution Needed**: Dynamic `Workflow` tables configurable per Job Family.

## 4. Globalization
### Lack of Localization (i18n)
*   **Current State**: Hardcoded English UI Strings.
*   **The Problem**: Inaccessible for non-English internal teams (e.g., French HR admin).
*   **Enterprise Impact**: Limits market reach in EMEA/LATAM.
*   **Solution Needed**: `react-i18next` implementation.

## 5. Candidate Experience
### No "One-Click Apply" / Social Login
*   **Current State**: Parsing-based application form.
*   **The Problem**: Friction for candidates on mobile.
*   **Solution Needed**: LinkedIn/Indeed "Easy Apply" API integration.
