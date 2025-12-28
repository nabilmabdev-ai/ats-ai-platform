'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SmartScheduleModal from '../../components/SmartScheduleModal';

const PAGE_SIZE = 10;

interface Interview {
  id: string;
  scheduledAt: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  application: {
    id: string;
    candidate: {
      firstName: string;
      lastName: string;
      email: string;
    };
    job: {
      title: string;
    };
  };
  interviewer: {
    fullName: string;
  };
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [isSmartScheduleOpen, setIsSmartScheduleOpen] = useState(false);

  const fetchInterviews = useCallback((isLoadMore = false) => {
    const pageToFetch = isLoadMore ? page + 1 : 1;
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setInterviews([]);
    }

    const startDate = new Date().toISOString();

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews?page=${pageToFetch}&limit=${PAGE_SIZE}&startDate=${startDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (isLoadMore) {
          setInterviews(prev => [...prev, ...data]);
        } else {
          setInterviews(data);
        }
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageToFetch);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [page]);

  useEffect(() => {
    fetchInterviews(false);
  }, [fetchInterviews]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'tag-primary';
      case 'PENDING': return 'tag-warning';
      case 'COMPLETED': return 'tag-mint';
      case 'CANCELLED': return 'bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20';
      default: return 'tag-neutral';
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return { time: 'Not Scheduled', date: '-' };
    const date = new Date(dateStr);
    return {
      time: date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }),
      date: date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    };
  };

  if (loading && interviews.length === 0) return (
    <div className="min-h-screen p-10 flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-[var(--color-primary)]/20 rounded-full mb-4"></div>
        <div className="text-[var(--color-slate)] font-medium">Loading Schedule...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-h2 mb-2">Interview Schedule</h1>
            <p className="text-body max-w-2xl">Manage your upcoming interviews and track candidate progress.</p>
          </div>
          <button
            onClick={() => setIsSmartScheduleOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-[var(--shadow-glow)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Smart Schedule
          </button>
        </div>

        <SmartScheduleModal
          isOpen={isSmartScheduleOpen}
          onClose={() => setIsSmartScheduleOpen(false)}
        />

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border)]">
              <thead className="bg-[var(--color-neutral-50)]">
                <tr>
                  <th className="th-style">Status</th>
                  <th className="th-style">Time</th>
                  <th className="th-style">Candidate</th>
                  <th className="th-style">Role</th>
                  <th className="th-style">Interviewer</th>
                  <th className="th-style text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[var(--color-border)]">
                {interviews.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="empty-state-container">
                        <svg className="w-12 h-12 mb-4 text-[var(--color-neutral-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-lg font-medium text-[var(--color-text-dark)]">No upcoming interviews</p>
                        <p className="text-sm mt-1">Check back later or move a candidate to the &apos;Interview&apos; stage.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  interviews.map((interview) => {
                    const { time, date } = formatDateTime(interview.scheduledAt);
                    return (
                      <tr key={interview.id} className="hover:bg-[var(--color-neutral-50)] transition-colors duration-150 group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`tag ${getStatusColor(interview.status)} border border-transparent`}>
                            {interview.status === 'CONFIRMED' && (<span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1.5" />)}
                            {interview.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-[var(--color-text-dark)]">{time}</div>
                          <div className="text-xs text-[var(--color-text-soft)] mt-0.5">{date}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary-lilac)] flex items-center justify-center text-white font-bold text-xs mr-3 shadow-sm">
                              {interview.application.candidate.firstName[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-[var(--color-text-dark)]">{interview.application.candidate.firstName} {interview.application.candidate.lastName}</div>
                              <div className="text-xs text-[var(--color-text-soft)]">{interview.application.candidate.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-[var(--color-text-dark)] font-medium">{interview.application.job.title}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[var(--color-text-soft)] flex items-center gap-2">
                            {interview.interviewer?.fullName ? (
                              <><div className="w-6 h-6 rounded-full bg-[var(--color-neutral-200)] flex items-center justify-center text-[10px] font-bold text-[var(--color-text-soft)]">{interview.interviewer.fullName[0]}</div>{interview.interviewer.fullName}</>
                            ) : (<span className="italic text-[var(--color-neutral-400)]">Unassigned</span>)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {interview.status === 'CONFIRMED' ? (
                            <Link href={`/applications/${interview.application.id}/interview`} className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1">Start Session <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></Link>
                          ) : (
                            <Link href={`/applications/${interview.application.id}/interview`} className="text-[var(--color-text-soft)] hover:text-[var(--color-primary)] font-medium text-xs uppercase tracking-wide transition-colors">View Details</Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="p-4 text-center border-t border-[var(--color-border)]">
              <button onClick={() => fetchInterviews(true)} disabled={loadingMore} className="btn-secondary text-sm">
                {loadingMore ? 'Loading...' : 'Load More Future Events'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}