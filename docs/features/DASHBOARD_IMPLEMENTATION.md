
# 🖥️ Dashboard & UI Architecture

## Overview
The Dashboard is the central hub of the ATS, designed for high performance and "glanceability".

## Components
The dashboard is split into optimized sub-components to prevent unnecessary re-renders:
- **Header**: Navigation and System Status.
- **WelcomeSection**: Personalized greeting and daily summary.
- **StatsGrid**: Key metrics (Active Jobs, Candidates, Interviews).
- **DashboardJobs**: The main data table.

## Data Fetching Strategy (SWR)
We use `SWR` (Stale-While-Revalidate) for all dashboard data to ensure:
1.  **Instant Loading**: Data from cache is shown immediately.
2.  **Auto-Revalidation**: Data updates in the background.
3.  **Deduplication**: Multiple components needing the same data don't trigger multiple requests.

## Hooks
- `useDashboardData()`: Encapsulates all dashboard data fetching logic.
