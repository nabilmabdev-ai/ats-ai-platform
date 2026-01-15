'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const PAGE_SIZE = 15;
const MATCHES_PAGE_SIZE = 10;

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
  location?: string;
  distribution?: {
    linkedin?: { status: string };
    indeed?: { status: string };
  };
}

interface Application {
  id: string;
  job: { id: string; title: string };
  candidate: { email: string; firstName: string; lastName: string; resumeS3Key?: string | null };
  aiSummary: string;
  status: string;
  aiScore: number;
  updatedAt?: string;
  coverLetterS3Key?: string | null;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  location?: string;
  skills?: string[];
  matchScore?: number;
}


export default function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<'APPLICANTS' | 'MATCHES'>('APPLICANTS');
  const [job, setJob] = useState<Job | null>(null);

  // State for Applicants
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsPage, setAppsPage] = useState(1);
  const [appsHasMore, setAppsHasMore] = useState(false);
  const [appsLoadingMore, setAppsLoadingMore] = useState(false);
  const [totalApplications, setTotalApplications] = useState(0);

  // State for AI Matches
  const [matches, setMatches] = useState<Candidate[]>([]);
  const [matchesPage, setMatchesPage] = useState(1);
  const [matchesHasMore, setMatchesHasMore] = useState(false);
  const [matchesLoadingMore, setMatchesLoadingMore] = useState(false);

  const [loading, setLoading] = useState(true);

  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

  const getResumeUrl = (path: string | null | undefined) => {
    if (!path) return '#';
    let cleanPath = path.trim();
    // Remove surrounding quotes if present
    cleanPath = cleanPath.replace(/^["']|["']$/g, '');

    if (cleanPath.match(/^https?:\/\//i)) return cleanPath;

    return `${process.env.NEXT_PUBLIC_API_URL}/${cleanPath.replace(/\\/g, '/')}`;
  };

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch Job Details
      const jobRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}`);
      if (!jobRes.ok) throw new Error('Failed to fetch job');
      const jobData = await jobRes.json();
      setJob(jobData);

      // 2. Fetch Applications (Candidates)
      // Note: Backend currently returns all candidates for the job
      const appsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}/candidates`);
      if (!appsRes.ok) throw new Error('Failed to fetch candidates');
      const appsData = await appsRes.json();

      // The endpoint returns the job object with included applications
      // Structure: { ...job, applications: [ { ...application, candidate: { ... } } ] }
      if (appsData && appsData.applications) {
        setApplications(appsData.applications);
        setTotalApplications(appsData.applications.length);

        // Since backend returns all, we don't really have "more" to load with current API
        // But we can simulate pagination if needed, or just show all.
        // For now, let's assume we show all and disable "load more".
        setAppsHasMore(false);
      }

    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const loadMoreApps = async () => {
    // Current backend implementation returns all applications in one go.
    // So this function is technically not needed for fetching *more* from server,
    // but we keep it if we want to implement client-side pagination later.
    // For now, we'll just mark as no more data.
    setAppsHasMore(false);
  };

  const fetchMatches = useCallback(async (isLoadMore = false) => {
    const pageToFetch = isLoadMore ? matchesPage + 1 : 1;
    if (isLoadMore) {
      setMatchesLoadingMore(true);
    } else {
      setLoading(true);
      setMatches([]);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}/matches?page=${pageToFetch}&limit=${MATCHES_PAGE_SIZE}`);
      const data = await res.json();

      if (isLoadMore) {
        setMatches(prev => [...prev, ...data]);
      } else {
        setMatches(data);
      }

      setMatchesHasMore(data.length === MATCHES_PAGE_SIZE);
      setMatchesPage(pageToFetch);

    } catch (err) {
      console.error(err);
    } finally {
      if (isLoadMore) {
        setMatchesLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [jobId, matchesPage]);

  useEffect(() => {
    if (activeTab === 'MATCHES' && matches.length === 0) {
      fetchMatches(false);
    }
  }, [activeTab, matches.length, fetchMatches]);

  const loadMoreMatches = () => {
    fetchMatches(true);
  }

  const toggleSelection = (appId: string) => {
    const newSelected = new Set(selectedAppIds);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedAppIds(newSelected);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedAppIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      // In a real app, we would send a bulk update request to the backend
      // await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/bulk`, { 
      //   method: 'POST', 
      //   body: JSON.stringify({ ids: Array.from(selectedAppIds), action }) 
      // });

      // For now, just simulate success and clear selection

      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedAppIds(new Set());
      // Refresh data
      fetchInitialData();
    } catch (err) {
      console.error('Bulk action failed', err);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleInvite = async (candidateId: string) => {
    setProcessingInviteId(candidateId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });

      if (res.ok) {
        setInvitedIds(prev => new Set(prev).add(candidateId));
      }
    } catch (err) {
      console.error('Invite failed', err);
    } finally {
      setProcessingInviteId(null);
    }
  };

  if (loading && !job) return <div className="p-10 text-center text-[var(--color-slate)] animate-pulse">Loading Pipeline...</div>;
  if (!job) return <div className="p-10 text-center text-[var(--color-slate)]">Job not found.</div>;

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 pb-32">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard" className="text-sm text-[var(--color-slate)] hover:text-[var(--foreground)] transition-colors">
                ← Back to Dashboard
              </Link>
              <span className="text-[var(--color-border)]">/</span>
              <span className="text-sm text-[var(--color-slate)]">{job.department}</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">{job.title}</h1>
            <div className="flex items-center gap-4 mt-3 text-sm text-[var(--color-slate)]">
              <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium">
                {job.status}
              </span>
              <span>{job.location || 'Remote'}</span>
              <span>•</span>
              <span>{totalApplications} Candidates</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/jobs/${job.id}/edit`} className="btn-secondary">
              Edit Job
            </Link>
            <Link href={`/jobs/${job.id}`} className="btn-primary">
              View Job Board
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[var(--color-border)] mb-8">
          <button
            onClick={() => setActiveTab('APPLICANTS')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'APPLICANTS'
              ? 'text-[var(--foreground)]'
              : 'text-[var(--color-slate)] hover:text-[var(--foreground)]'
              }`}
          >
            Applicants
            {activeTab === 'APPLICANTS' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('MATCHES')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'MATCHES'
              ? 'text-[var(--foreground)]'
              : 'text-[var(--color-slate)] hover:text-[var(--foreground)]'
              }`}
          >
            AI Matches
            {activeTab === 'MATCHES' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-t-full" />
            )}
          </button>
        </div>

        <div className="space-y-3">
          {/* Applicants View */}
          {activeTab === 'APPLICANTS' && (
            applications.length === 0 ? (
              <div className="empty-state">
                <p>No applicants yet.</p>
              </div>
            ) : (
              applications.map((app) => (
                <div key={app.id} className={`card-item ${selectedAppIds.has(app.id) ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-surface)]' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedAppIds.has(app.id)}
                        onChange={() => toggleSelection(app.id)}
                        className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-[var(--foreground)]">
                            {app.candidate.firstName} {app.candidate.lastName}
                          </h3>
                          <div className="text-sm text-[var(--color-slate)]">{app.candidate.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${app.aiScore >= 80 ? 'bg-green-100 text-green-700' :
                            app.aiScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                            {app.aiScore}% Match
                          </span>
                          <span className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-slate)]">
                            {app.status}
                          </span>
                        </div>
                      </div>

                      {app.aiSummary && (
                        <div className="bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-border)] mb-3">
                          <div className="flex items-center gap-2 mb-1 text-xs font-medium text-[var(--color-primary)]">
                            <span>✨ AI Summary</span>
                          </div>
                          <p className="text-sm text-[var(--color-slate)] leading-relaxed">{app.aiSummary}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-3">
                        <Link href={`/screening/${app.id}`} className="btn-secondary text-xs py-1.5">
                          View Application
                        </Link>
                        {app.candidate.resumeS3Key && (
                          <a
                            href={getResumeUrl(app.candidate.resumeS3Key)}
                            target="_blank"
                            download
                            className="btn-ghost text-xs py-1.5 flex items-center gap-1"
                          >
                            <span className="text-lg">📄</span> Resume
                          </a>
                        )}
                        {app.coverLetterS3Key && (
                          <a
                            href={getResumeUrl(app.coverLetterS3Key)}
                            target="_blank"
                            download
                            className="btn-ghost text-xs py-1.5 flex items-center gap-1"
                          >
                            <span className="text-lg">📝</span> Cover Letter
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {/* Matches View */}
          {activeTab === 'MATCHES' && (
            loading && matches.length === 0 ? (
              <div className="text-center p-10">Searching for matches...</div>
            ) : matches.length === 0 ? (
              <div className="empty-state">No matches found.</div>
            ) : (
              <>
                {matches.map((candidate) => (
                  <div key={candidate.id} className="card-item">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-[var(--foreground)]">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        <div className="text-sm text-[var(--color-slate)] mb-1">{candidate.headline || 'No headline'}</div>
                        <div className="text-xs text-[var(--color-slate)] mb-3">{candidate.location || 'Unknown Location'}</div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {candidate.skills?.slice(0, 5).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-slate)]">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[var(--color-primary)] mb-1">
                          {candidate.matchScore}%
                        </div>
                        <div className="text-xs text-[var(--color-slate)]">Match Score</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
                      {invitedIds.has(candidate.id) ? (
                        <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                          ✓ Invited
                        </span>
                      ) : (
                        <button
                          onClick={() => handleInvite(candidate.id)}
                          disabled={!!processingInviteId}
                          className="btn-primary text-sm py-1.5"
                        >
                          {processingInviteId === candidate.id ? 'Sending...' : 'Invite to Apply'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {matchesHasMore && (
                  <div className="text-center pt-4">
                    <button onClick={loadMoreMatches} disabled={matchesLoadingMore} className="btn-secondary">
                      {matchesLoadingMore ? 'Finding more...' : 'Find 10 More Matches'}
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedAppIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--foreground)] text-[var(--background)] px-6 py-3 rounded-full shadow-xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4">
          <span className="font-medium">{selectedAppIds.size} selected</span>
          <div className="h-4 w-px bg-[var(--background)] opacity-20" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('shortlist')}
              disabled={isBulkProcessing}
              className="hover:text-[var(--color-primary)] transition-colors text-sm font-medium"
            >
              Shortlist
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={isBulkProcessing}
              className="hover:text-red-400 transition-colors text-sm font-medium"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}