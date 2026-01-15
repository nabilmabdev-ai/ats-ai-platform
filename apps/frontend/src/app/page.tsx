'use client';

import { useDashboardData } from '@/hooks/useDashboardData'; // Import custom hook
import { useAuth } from '@/components/AuthProvider';
import DashboardJobs from './components/DashboardJobs';

// New Sub-components
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { WelcomeSection } from '@/components/dashboard/WelcomeSection';

export default function Home() {
  const { user } = useAuth();

  // Use the new hook for all data fetching logic
  const {
    jobs,
    activeJobs,
    totalCandidates,
    interviewsScheduled,
    isLoading,
    error
  } = useDashboardData();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[var(--color-text-soft)]">
        An error occurred while loading the dashboard.
      </div>
    );
  }

  // Optional: Global loading state (or relying on skeleton loaders inside components)
  // For now, keeping it simple as per original behavior but cleaner
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
          <p className="text-sm font-medium text-[var(--color-text-soft)]">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans text-[var(--color-text-soft)]">

      {/* 1. Header */}
      <DashboardHeader />

      {/* 2. Main Content */}
      <main className="max-w-7xl mx-auto p-8 animate-fade-in">

        {/* Welcome Section */}
        <WelcomeSection
          userName={user?.fullName}
          interviewsScheduled={interviewsScheduled}
        />

        {/* Stats Grid */}
        <StatsGrid
          activeJobs={activeJobs}
          totalCandidates={totalCandidates}
          interviewsScheduled={interviewsScheduled}
        />

        {/* Dashboard Content (Jobs Table) */}
        <section className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-neutral-50)]/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-[var(--color-text-dark)]">Recent Job Postings</h3>
          </div>
          <div className="p-0">
            <DashboardJobs jobs={jobs} />
          </div>
        </section>

      </main>
    </div>
  );
}