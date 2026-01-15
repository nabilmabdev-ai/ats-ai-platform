# Candidate Management Feature

## Overview
The Candidate Management feature centralized within the "Talent Intelligence" module allows recruiters to manage their entire talent pool effectively. It moves beyond job-specific application lists to a global view of all candidates.

## Key Components

### 1. Talent Pool (Database View)
- **Route**: `/search?tab=database`
- **Functionality**:
  - Lists all candidates in the system regardless of application status.
  - Supports filtering by Job, Status, Date, and Tags.
  - Uses standardized pagination mechanism.
  - Integration with "Add Candidate" workflow.

### 2. Add Candidate Workflow
- **Modal Component**: `AddCandidateModal.tsx`
- **Features**:
  - **Resume Upload**: Drag-and-drop resume parsing.
  - **Manual Entry**: Quick form for essential details (Name, Email, Phone, LinkedIn).
  - **Duplicate Check**: Backend enforces unique emails to prevent duplicates.

### 3. Backend Integration
- **Service**: `CandidatesService`
- **Endpoints**:
  - `GET /candidates/search`: Centralized search with pagination.
  - `POST /candidates`: Manual creation.
  - `POST /candidates/upload`: Resume-based creation.

## User Flow
1. **Access**: Navigate to sidebar "Candidates" or "Talent Intelligence" -> Database tab.
2. **View**: Browse existing talent pool.
3. **Add**: Click "Add Candidate" -> Choose "Manual Entry" or "Resume Upload".
4. **Result**: Candidate is added to the database and appears in the list immediately.
