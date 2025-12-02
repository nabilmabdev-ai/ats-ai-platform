import Link from 'next/link';
import { BriefcaseIcon, UsersIcon, CalendarIcon, SparkleIcon } from '@/components/ui/Icons';
import DashboardJobs from './components/DashboardJobs';

// --- Types ---
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
  createdAt: string;
}

// --- Data Fetching ---
async function getJobs(): Promise<Job[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs`, {
      cache: 'no-store',
      next: { tags: ['jobs'] }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  let jobs: Job[] = [];
  let error = null;

  try {
    const jobsData = await getJobs();
    jobs = Array.isArray(jobsData) ? jobsData : [];
  } catch (err) {
    console.error('Error in Home component:', err);
    error = err;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[var(--color-text-soft)]">
        An error occurred while rendering the page.
      </div>
    );
  }

  // --- Stats Calculation ---
  const activeJobs = jobs.filter(j => j.status !== 'CLOSED' && j.status !== 'ARCHIVED').length;
  const totalCandidates = jobs.reduce((acc, job) => acc + (job.applications?.length || 0), 0);
  const interviewsScheduled = 4;

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans text-[var(--color-text-soft)]">
      
      {/* 1. STICKY HEADER (Strict Rule) */}
      <header className="sticky top-0 z-20 h-20 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-8 animate-fade-in backdrop-blur-sm bg-white/90">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-dark)] tracking-tight">
            Dashboard
          </h1>
          {/* Operational Badge */}
          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2F1] border border-[#B2DFDB]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00695C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00695C]"></span>
            </span>
            <span className="text-[10px] font-bold text-[#00695C] uppercase tracking-wider">
              System Operational
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/jobs/new" 
            className="flex items-center gap-2 h-10 px-6 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-bold text-sm shadow-[var(--shadow-glow)] hover:bg-[var(--color-primary-hover)] transition-all hover:-translate-y-0.5"
          >
            <SparkleIcon className="w-4 h-4 text-white/90" />
            <span>Create New Job</span>
          </Link>
        </div>
      </header>

      {/* 2. MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto p-8 animate-fade-in">
        
        {/* Welcome Section */}
        <section className="mb-10">
          <h2 className="text-4xl font-bold text-[var(--color-text-dark)] mb-2 tracking-tight">
            Welcome back, <span className="text-[var(--color-primary)]">Alice</span>
          </h2>
          <p className="text-lg text-[var(--color-text-soft)] max-w-2xl">
            Here's what's happening in your recruitment pipeline today. You have <span className="font-semibold text-[var(--color-text-dark)]">{interviewsScheduled} interviews</span> scheduled.
          </p>
        </section>

        {/* 3. STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          {/* Card: Active Jobs */}
          <div className="group bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 shadow-sm transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)]/30 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] flex items-center justify-center text-[#00695C] border border-[#B2DFDB]/30">
                <BriefcaseIcon className="w-6 h-6" />
              </div>
              {activeJobs > 0 && (
                <span className="px-3 py-1 rounded-full bg-[#E0F2F1] text-[#00695C] text-[10px] font-bold uppercase tracking-wider border border-[#B2DFDB]/50">
                  Active
                </span>
              )}
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--color-text-dark)] tracking-tight mb-1">{activeJobs}</div>
              <div className="text-sm font-medium text-[var(--color-text-soft)]">Open Positions</div>
            </div>
          </div>

          {/* Card: Total Candidates */}
          <div className="group bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 shadow-sm transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)]/30 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              {/* Using Primary Pink Family for Candidates */}
              <div className="w-12 h-12 rounded-xl bg-[#FCE4EC] flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                <UsersIcon className="w-6 h-6" />
              </div>
              {totalCandidates > 0 && (
                <span className="px-3 py-1 rounded-full bg-[#FCE4EC] text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wider border border-[var(--color-primary)]/20">
                  Pipeline
                </span>
              )}
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--color-text-dark)] tracking-tight mb-1">{totalCandidates}</div>
              <div className="text-sm font-medium text-[var(--color-text-soft)]">Total Candidates</div>
            </div>
          </div>

          {/* Card: Interviews */}
          <div className="group bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 shadow-sm transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)]/30 hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFF8E1] flex items-center justify-center text-[#F57F17] border border-[#FFE0B2]/50">
                <CalendarIcon className="w-6 h-6" />
              </div>
              {interviewsScheduled > 0 && (
                <span className="px-3 py-1 rounded-full bg-[#FFF8E1] text-[#F57F17] text-[10px] font-bold uppercase tracking-wider border border-[#FFE0B2]">
                  Upcoming
                </span>
              )}
            </div>
            <div>
              <div className="text-4xl font-bold text-[var(--color-text-dark)] tracking-tight mb-1">{interviewsScheduled}</div>
              <div className="text-sm font-medium text-[var(--color-text-soft)]">Interviews Scheduled</div>
            </div>
          </div>

        </div>

        {/* 4. DASHBOARD CONTENT */}
        <section className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-sm overflow-hidden">
            {/* Header for the Table Section */}
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