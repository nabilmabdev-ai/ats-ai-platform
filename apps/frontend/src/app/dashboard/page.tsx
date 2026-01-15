import DashboardDataFetcher from './DashboardDataFetcher';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 500;

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

export default async function Dashboard({
  searchParams
}: {
  searchParams: Promise<{ jobId: string; showClosed?: string; search?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const selectedJobId = resolvedSearchParams.jobId || 'ALL';
  const showClosed = resolvedSearchParams.showClosed === 'true';
  const searchQuery = resolvedSearchParams.search || '';

  let jobsData: Job[] = [];
  let appsData: Application[] = [];
  let totalCount = 0;
  let error = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };

    // 1. Fetch Jobs

    const jobsRes = await fetch(`${baseUrl}/jobs`, { headers, cache: 'no-store', next: { tags: ['jobs'] } });
    if (!jobsRes.ok) throw new Error(`Failed to fetch jobs: ${jobsRes.status}`);
    const jobsPayload = await jobsRes.json();
    jobsData = Array.isArray(jobsPayload) ? jobsPayload : (jobsPayload.data || []);

    // 2. Fetch Applications
    const jobIdQuery = selectedJobId !== 'ALL' ? `&jobId=${selectedJobId}` : '';
    const closedQuery = showClosed ? '&includeClosed=true' : '';
    const searchQueryStr = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';

    const appsRes = await fetch(`${baseUrl}/applications?page=1&limit=${PAGE_SIZE}${jobIdQuery}${closedQuery}${searchQueryStr}`, {
      headers,
      cache: 'no-store',
      next: { tags: ['applications'] }
    });

    if (!appsRes.ok) throw new Error(`Failed to fetch applications: ${appsRes.status}`);
    const appsPayload = await appsRes.json();
    // Handle { data: [], total: ... } structure or direct array
    appsData = Array.isArray(appsPayload) ? appsPayload : (appsPayload.data || []);
    if (!Array.isArray(appsPayload) && 'total' in appsPayload) {
      totalCount = appsPayload.total;
    } else {
      totalCount = appsData.length;
    }



  } catch (err: any) {
    console.error('Error loading dashboard data:', err);
    error = err;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] text-red-500">
        Error loading dashboard. Please try refreshing.
      </div>
    );
  }

  return (
    <DashboardDataFetcher
      jobs={jobsData}
      initialApplications={appsData}
      selectedJobId={selectedJobId}
      showClosed={showClosed}
      totalCount={totalCount}
      initialSearch={searchQuery}
    />
  );
}