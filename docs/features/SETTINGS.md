# Settings Management

## Overview
The Settings page acts as the control center for the ATS, allowing admins to configure organization details, hiring templates, communication preferences, and system integrations.

## Architecture
The settings module is split into four primary domains to reduce cognitive load:

1.  **Organization**
    -   **Company Info**: Name, logo, address, timezone, and AI tone.
    -   **Availability**: Personal working hours and calendar integrations (Google/Outlook).
2.  **Hiring**
    -   **Job Templates**: Default structures for AI job description generation.
    -   **Offer Templates**: Structured documents for offer letters.
    -   **Scorecards**: AI grading criteria.
    -   **Question Templates**: Presets for interview questions.
3.  **Communication**
    -   **Email Templates**: Customization for automated system emails (e.g., Interview Invites).
    -   **Branding**: Email header and footer images.
4.  **System**
    -   **Integrations**: Toggles for LinkedIn, Slack, and AI providers.
    -   **Import**: Bulk candidate import via CSV/Resume.
    -   **Audit**: Security and action logs.

## Key Components
-   `SettingsPage` (`apps/frontend/src/app/settings/page.tsx`): Main shell and navigation.
-   `OrganizationSettings.tsx`: Handles company and user availability.
-   `HiringSettings.tsx`: Manages all recruiting templates.
-   `CommunicationSettings.tsx`: Email template editor with live preview.
-   `SystemSettings.tsx`: Technical configurations.

## Usage

### Updating Company Branding
Navigate to **Organization > Company Info**. You can upload a logo which will be used across the platform and on career pages.

### Connecting Calendars
Navigate to **Organization > My Availability**. Connect Google or Outlook to enable two-way sync for Smart Scheduling.

### Editing Email Templates
Navigate to **Communication**.
-   **Header/Footer**: Upload 600px wide images for a branded look.
-   **Live Preview**: Toggle "Live Preview" to see how the candidate will view the email.
-   **Variables**: Use `{{candidateName}}`, `{{jobTitle}}`, etc., to personalize messages.
