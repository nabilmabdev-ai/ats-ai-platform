// apps/frontend/src/app/dashboard/DashboardDataFetcher.tsx
'use client';
import PipelineBoard from './PipelineBoard';

interface Application {

  id: string;

  job: { id: string; title: string };

  candidate: { id: string; email: string; firstName: string; lastName: string };

  aiSummary: string;

  status: string;

  aiScore: number;

  updatedAt?: string;

}



interface Job {
  id: string;
  title: string;
  status: string;
  _count?: { applications: number };
}

interface DashboardDataFetcherProps {
  jobs: Job[];
  initialApplications: Application[];
  selectedJobId: string;
  showClosed: boolean;
  totalCount: number;
  initialSearch?: string;
}

export default function DashboardDataFetcher({ jobs, initialApplications, selectedJobId, showClosed, totalCount, initialSearch }: DashboardDataFetcherProps) {
  return (
    <PipelineBoard
      jobs={jobs}
      initialApplications={initialApplications}
      selectedJobId={selectedJobId}
      showClosed={showClosed}
      totalCount={totalCount}
      initialSearch={initialSearch}
    />
  );
}
