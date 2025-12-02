'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import VacanciesGrid from './VacanciesGrid';
import { BriefcaseIcon, UsersIcon, ArrowRightIcon, SearchIcon } from '@/components/ui/Icons';

// --- Interfaces ---
interface Job {
  id: string;
  title: string;
  department: string;
  status: string;
  priority: string;
  headcount: number;
  _count: { applications: number };
  createdAt: string;
  distribution?: {
    linkedin?: { status: string };
    indeed?: { status: string };
  };
}

interface User {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
}

const PAGE_SIZE = 9;

// --- Pagination Component ---
const Pagination = ({ page, totalPages, onPageChange }: { page: number, totalPages: number, onPageChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center gap-2 mt-12 pb-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-9 px-4 text-sm font-bold bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] disabled:opacity-50 transition-colors"
      >
        Previous
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`h-9 w-9 flex items-center justify-center text-sm font-bold rounded-lg transition-all ${p === page
            ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-glow)]'
            : 'bg-white border border-[var(--color-border)] text-[var(--color-text-soft)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
            }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="h-9 px-4 text-sm font-bold bg-white border border-[var(--color-border)] rounded-lg text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] disabled:opacity-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
};

export default function VacanciesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = useCallback((p: number, status: string, q: string) => {
    setIsLoading(true);
    const statusQuery = status ? `&status=${status}` : '';
    const searchQueryParam = q ? `&q=${q}` : '';

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs?page=${p}&limit=${PAGE_SIZE}${statusQuery}${searchQueryParam}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data);
          setTotalPages(1);
        } else {
          setJobs(data.data || []);
          setTotalPages(data.totalPages || 0);
        }
      })
      .catch(error => {
        console.error("Failed to fetch jobs:", error);
        setJobs([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Handle Search/Filter Execution
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filterStatus) params.set('status', filterStatus);
    params.set('page', page.toString());

    router.push(`?${params.toString()}`);
    fetchJobs(page, filterStatus, searchQuery);
  }, [page, filterStatus, searchQuery, fetchJobs]); // Debounce might be needed in real app for search query

  const handleApprove = async (jobId: string) => {
    setIsApproving(jobId);
    try {
      // In real app, get current user from Auth Context
      const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`);
      const users: User[] = await usersRes.json();
      const adminUser = users.find((u: User) => u.role === 'ADMIN' || u.role === 'RECRUITER') || users[0];

      if (!adminUser) return alert("No admin user found.");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: adminUser.id }),
      });

      if (res.ok) {
        fetchJobs(page, filterStatus, searchQuery); // Refresh list
      } else {
        alert("Failed to approve job.");
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    } finally {
      setIsApproving(null);
    }
  };

  const handleArchive = async (jobId: string) => {
    if (!confirm('Are you sure you want to archive this job? It will be hidden from the active pipeline.')) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });

      if (res.ok) {
        fetchJobs(page, filterStatus, searchQuery); // Refresh list
      } else {
        alert("Failed to archive job.");
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    }
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-[var(--color-success)]/10 text-[var(--color-success-text)] border border-[var(--color-success)]/20';
      case 'PENDING_APPROVAL': return 'bg-[var(--color-warning)]/10 text-[var(--color-warning-text)] border border-[var(--color-warning)]/20';
      case 'DRAFT': return 'bg-[var(--color-neutral-100)] text-[var(--color-text-soft)] border border-[var(--color-border)]';
      case 'CLOSED': return 'bg-[var(--color-error)]/10 text-[var(--color-error-text)] border border-[var(--color-error)]/20';
      default: return 'bg-[var(--color-neutral-100)] text-[var(--color-text-soft)] border border-[var(--color-border)]';
    }
  };

  return (
    <div className="flex h-auto min-h-screen w-full flex-col bg-[var(--color-background)] font-sans">

      {/* Standardized Header */}
      <header className="sticky top-0 z-20 flex h-20 w-full items-center justify-between border-b border-[var(--color-border)] bg-white px-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <BriefcaseIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-dark)]">Vacancies</h1>
            <p className="text-sm text-[var(--color-text-soft)]">Manage your open roles</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex bg-[var(--color-neutral-100)] p-1 rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'TABLE' ? 'bg-white text-[var(--color-text-dark)] shadow-sm' : 'text-[var(--color-text-soft)] hover:text-[var(--color-primary)]'}`}
              title="List View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-white text-[var(--color-text-dark)] shadow-sm' : 'text-[var(--color-text-soft)] hover:text-[var(--color-primary)]'}`}
              title="Grid View"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" /></svg>
            </button>
          </div>

          <div className="h-8 w-px bg-[var(--color-border)]"></div>

          <Link
            href="/jobs/new"
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-bold text-white shadow-[var(--shadow-glow)] hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <span>+</span> Post Job
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">

        {/* Toolbar */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-soft)]" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full md:w-80 rounded-lg border border-[var(--color-border)] bg-white py-2.5 pl-9 pr-4 text-sm text-[var(--color-text-dark)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full md:w-64">
            <select
              className="w-full appearance-none rounded-lg border border-[var(--color-border)] bg-white py-2.5 pl-4 pr-10 text-sm text-[var(--color-text-dark)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 cursor-pointer shadow-sm"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="CLOSED">Closed</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-soft)]">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-[var(--color-text-soft)]">Loading vacancies...</p>
          </div>
        ) : viewMode === 'GRID' ? (
          <VacanciesGrid jobs={jobs || []} />
        ) : (
          <div className="w-full bg-white rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden animate-fade-in">
            <table className="min-w-full divide-y divide-[var(--color-border)]">
              <thead className="bg-[var(--color-neutral-50)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Channels</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Headcount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Candidates</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-white">
                {jobs?.map((job) => (
                  <tr key={job.id} className="group hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer" onClick={() => router.push(`/vacancies/${job.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[var(--color-text-dark)] group-hover:text-[var(--color-primary)] transition-colors mb-0.5">
                          {job.title}
                        </span>
                        <span className="text-xs text-[var(--color-text-soft)] flex items-center gap-1">
                          {job.department || 'General'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeStyles(job.status)}`}>
                        {job.status === 'PUBLISHED' && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></span>}
                        {job.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-1">
                        {job.distribution?.linkedin ? (
                          <div className="w-6 h-6 rounded-full bg-[#0077b5] border-2 border-white flex items-center justify-center text-[8px] text-white font-bold shadow-sm">in</div>
                        ) : null}
                        {job.distribution?.indeed ? (
                          <div className="w-6 h-6 rounded-full bg-[#2164f3] border-2 border-white flex items-center justify-center text-[8px] text-white font-bold shadow-sm">Id</div>
                        ) : null}
                        {!job.distribution?.linkedin && !job.distribution?.indeed && <span className="text-xs text-[var(--color-text-soft)] italic">None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-[var(--color-text-dark)]">
                        <UsersIcon className="w-4 h-4 text-[var(--color-text-soft)]" />
                        {job.headcount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md hover:bg-[var(--color-neutral-200)] transition-colors" onClick={(e) => { e.stopPropagation(); router.push(`/jobs/${job.id}/candidates`); }}>
                        <span className="text-sm font-bold text-[var(--color-text-dark)]">
                          {job._count?.applications || 0}
                        </span>
                        <ArrowRightIcon className="w-3 h-3 text-[var(--color-text-soft)]" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {job.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => handleApprove(job.id)}
                            disabled={isApproving === job.id}
                            className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded hover:bg-[var(--color-primary)]/20 transition-colors"
                          >
                            {isApproving === job.id ? '...' : 'Approve'}
                          </button>
                        )}
                        {job.status !== 'ARCHIVED' && job.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleArchive(job.id)}
                            className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                            title="Archive Job"
                          >
                            Archive
                          </button>
                        )}
                        <Link href={`/vacancies/${job.id}`} className="text-sm font-medium text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] px-3 py-1.5 rounded-md hover:bg-[var(--color-neutral-100)] transition-colors">
                          Manage
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!jobs || jobs.length === 0) && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-neutral-100)] mb-3">
                  <BriefcaseIcon className="w-6 h-6 text-[var(--color-text-soft)] opacity-50" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-text-dark)]">No jobs found</h3>
                <p className="text-xs text-[var(--color-text-soft)] mt-1">Try adjusting filters or post a new job.</p>
              </div>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      </main>
    </div>
  );
}