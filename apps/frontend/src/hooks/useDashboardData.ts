import useSWR from 'swr';
import { useMemo } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Application {
    id: string;
    status: string;
}

interface Job {
    id: string;
    title: string;
    department: string;
    descriptionText: string;
    status: string;
    priority?: string;
    remoteType?: string;
    applications?: Application[];
    _count?: { applications: number };
    createdAt: string;
}

export const useDashboardData = () => {

    const API_URL = 'http://localhost:3001';

    // 1. Fetch Jobs
    const { data: jobsResponse, error: jobsError, isLoading: jobsLoading } = useSWR(
        `${API_URL}/jobs`,
        fetcher
    );

    if (jobsError) console.error("Jobs Fetch Error:", jobsError);

    // 2. Fetch Interviews (Today)
    // Fix: Memoize the date to prevent infinite re-fetching loop
    const today = useMemo(() => new Date().toISOString(), []);
    // Filter later if needed, but for broad count:
    const { data: interviewsResponse, error: interviewsError, isLoading: interviewsLoading } = useSWR(
        `${API_URL}/interviews?startDate=${today}&limit=100`,
        fetcher
    );

    if (interviewsError) console.error("Interviews Fetch Error:", interviewsError);

    // --- Derived State ---

    // Safely extract jobs array (handling potential wrap in { data: ... })
    const jobs: Job[] = useMemo(() => {
        if (!jobsResponse) return [];
        // If backend already standardized to { data: [...] }, robustly handle both
        return Array.isArray(jobsResponse) ? jobsResponse : (jobsResponse.data || []);
    }, [jobsResponse]);

    // Active Jobs
    const activeJobs = useMemo(() =>
        jobs.filter(j => j.status !== 'CLOSED' && j.status !== 'ARCHIVED').length,
        [jobs]);

    // Total Candidates
    const totalCandidates = useMemo(() =>
        jobs.reduce((acc, job) => acc + (job._count?.applications || job.applications?.length || 0), 0),
        [jobs]);

    // Scheduled Interviews
    const interviewsScheduled = useMemo(() => {
        if (!interviewsResponse) return 0;
        const list = Array.isArray(interviewsResponse) ? interviewsResponse : (interviewsResponse.data || []);
        // Filter for CONFIRMED if the API doesn't do it automatically
        return list.filter((i: any) => i.status === 'CONFIRMED').length;
    }, [interviewsResponse]);

    return {
        jobs,
        activeJobs,
        totalCandidates,
        interviewsScheduled,
        isLoading: jobsLoading || interviewsLoading,
        error: jobsError || interviewsError
    };
};
