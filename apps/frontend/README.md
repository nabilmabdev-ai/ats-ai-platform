# ATS AI Platform - Frontend

The frontend application for the HT Recruitment OS, built with **Next.js 16 (App Router)** and **Tailwind CSS v4**. It provides a responsive, interactive interface for recruiters to manage candidates, jobs, and offers.

## 🛠️ Tech Stack

*   **Framework**: Next.js 16 (App Router)
*   **Styling**: Tailwind CSS v4, Lucide React (Icons)
*   **State/Data Fetching**: SWR (Stale-While-Revalidate)
*   **Drag & Drop**: `@hello-pangea/dnd` (Pipeline Board)
*   **Calendar**: `react-big-calendar`
*   **Charts**: `recharts`
*   **Error Handling**: Global `ErrorBoundary` to prevent white-screen crashes.

## 🚀 Key Features

*   **📊 Dashboard (New!)**: A comprehensive view of recruitment metrics including Active Jobs, Total Candidates, and Scheduled Interviews, powered by `DashboardHeader` and `StatsGrid` components.
*   **Candidate Management**:
    *   **Talent Pool**: Centralized database view in `/search` to manage all candidates.
    *   **Add Candidate**: Modal for manual candidate creation and resume upload.
    *   **Standardized API**: Updated to handle standardized `{ data, meta }` responses.
*   **📋 Pipeline Board**: Kanban-style drag-and-drop board for moving candidates through stages (Sourced -> Interview -> Offer). Support for "Backward Move" (demoting candidates).
*   **🤝 Offer Management**: Dedicated "Offer" tab in Applicant view to generate, send, and track offer letters.
*   **📅 Scheduling**: Interactive calendar for managing interviews with conflict detection.
*   **🔍 Advanced Search**: Interface for Hybrid Search (Keyword + Semantic) to find "Silver Medalist" candidates.
*   **🩺 CVthèque Doctor**: Duplicate candidate resolution dashboard with side-by-side comparison and smart merging.

## 🏃‍♂️ Getting Started

### Prerequisites
*   Node.js v20+
*   Backend Core running on port 3001

### Installation

```bash
# Navigate to frontend directory
cd apps/frontend

# Install dependencies
npm install
```

### Configuration

Create a `.env.local` file:

```ini
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Running Locally

```bash
npm run dev
# App will leverage http://localhost:3000
```

## 📂 Project Structure

```
src/
├── app/              # App Router pages and layouts
│   ├── candidates/   # Candidate management pages
│   ├── dashboard/    # Main dashboard
│   ├── jobs/         # Job posting management
│   ├── settings/     # Company & User settings
│   └── ...
├── components/       # Reusable UI components
│   ├── ui/           # Design system primitives (Buttons, Inputs)
│   ├── PipelineBoard.tsx # Kanban board logic
│   └── OfferManager.tsx  # Offer workflow component
├── lib/              # Utilities (API client, helpers)
└── services/         # API service wrappers (auth, candidates, etc.)
```

## 🧪 Testing

```bash
# Run linting
npm run lint
```
