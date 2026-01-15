'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added for navigation
import SmartScheduleModal from '../../components/SmartScheduleModal';
import CalendarGrid from './CalendarGrid';
import { useAuth } from '../../components/AuthProvider';


import UserSelect from '../../components/UserSelect';


const PAGE_SIZE = 10;
const CALENDAR_LIMIT = 100; // Load more events for calendar

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
    id: string; // Needed for select
    fullName: string;
  };
}

export default function InterviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [availability, setAvailability] = useState<any[]>([]); // New state for availability
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('calendar'); // Default to Calendar as per goal


  // List View Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [isSmartScheduleOpen, setIsSmartScheduleOpen] = useState(false);
  const [search, setSearch] = useState('');

  /* --- State for Calendar Navigation --- */
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('week'); // default view in CalendarGrid

  const fetchInterviews = useCallback((pageIdx: number, isLoadMore = false, isCalendar = false, forceStartDate?: string) => {
    const limit = isCalendar ? CALENDAR_LIMIT : PAGE_SIZE;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      if (!isLoadMore && !isCalendar) setInterviews([]);
    }

    // Determine Start Date
    // If Calendar: use the current calendarDate (start of view)
    // If List: use "Now" (upcoming)
    let startDateStr = new Date().toISOString();

    if (isCalendar || forceStartDate) {
      // If specific date passed (e.g. from nav) or in calendar mode
      startDateStr = forceStartDate || calendarDate.toISOString();
    }

    const searchQuery = search ? `&search=${search}` : '';
    const token = localStorage.getItem('access_token');
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/interviews?page=${pageIdx}&limit=${limit}&startDate=${startDateStr}${searchQuery}`;

    // Fetching interviews from API

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            // Redirect logic or minimal handling
            return;
          }
          throw new Error('Failed');
        }
        return res.json();
      })
      .then((response) => {
        // Handle both standardized { data: [...] } and legacy [...] formats
        const data = Array.isArray(response) ? response : (response.data || []);

        if (isLoadMore) {
          setInterviews(prev => [...prev, ...data]);
        } else {
          setInterviews(data);
        }
        setHasMore(data.length === limit);
        setPage(pageIdx);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [search, calendarDate]);

  // Fetch Availability (Busy Slots)
  useEffect(() => {
    if (view === 'calendar' && user?.id) {
      // Calculate start/end of the current view (approximate as month for simplicity, or generic window)
      // For MVP, fetch +/- 1 month from calendarDate
      const start = new Date(calendarDate);
      start.setDate(start.getDate() - 30);
      const end = new Date(calendarDate);
      end.setDate(end.getDate() + 30);

      const token = localStorage.getItem('access_token');
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/availability?interviewerId=${user.id}&start=${start.toISOString()}&end=${end.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAvailability(data);
          }
        })
        .catch(err => console.error('Failed to fetch availability', err));
    }
  }, [view, calendarDate, user?.id]);


  // Handle View Change
  useEffect(() => {
    if (view === 'calendar') {
      fetchInterviews(1, false, true);
    } else {
      fetchInterviews(1, false, false, new Date().toISOString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInterviews(1, false, view === 'calendar');
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Calendar Navigation Handler
  const onNavigate = (newDate: Date) => {
    setCalendarDate(newDate);
    // Fetch new window
    fetchInterviews(1, false, true, newDate.toISOString());
  };

  const calendarEvents = useMemo(() => {
    const interviewEvents = interviews
      .filter(i => {
        if (!i.scheduledAt) return false;
        const date = new Date(i.scheduledAt);
        return !isNaN(date.getTime());
      })
      .map(i => {
        const start = new Date(i.scheduledAt!);
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        return {
          id: i.id,
          title: `${i.application.candidate.firstName} - ${i.application.job.title}`,
          start,
          end,
          resource: i
        };
      });

    const busyEvents = availability.map((a, idx) => ({
      id: `busy-${idx}`,
      title: `Busy (${a.source})`,
      start: new Date(a.start),
      end: new Date(a.end),
      resource: { status: 'BUSY', type: 'EXTERNAL' },
      allDay: false
    }));

    return [...interviewEvents, ...busyEvents];
  }, [interviews, availability]);


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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h1 className="text-h2 mb-2">Interview Schedule</h1>
            <p className="text-body max-w-2xl">Manage your upcoming interviews and track candidate progress.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="bg-white rounded-lg p-1 border border-[var(--color-border)] flex items-center shadow-sm">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'list' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-soft)] hover:bg-[var(--color-neutral-50)]'}`}
              >
                List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'calendar' ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-soft)] hover:bg-[var(--color-neutral-50)]'}`}
              >
                Calendar
              </button>
            </div>

            <button
              onClick={() => setIsSmartScheduleOpen(true)}
              className="btn-primary flex items-center gap-2 shadow-[var(--shadow-glow)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Smart Schedule
            </button>
          </div>
        </div>

        {/* --- Search Bar --- */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            placeholder="Search candidates or jobs..."
            className="pl-10 pr-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] sm:text-sm py-3"
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <SmartScheduleModal
          isOpen={isSmartScheduleOpen}
          onClose={() => setIsSmartScheduleOpen(false)}
        />

        {/* Content */}
        {view === 'calendar' ? (
          <div className="animate-fade-in-up">
            <CalendarGrid
              events={calendarEvents}
              date={calendarDate}
              onNavigate={onNavigate}
              onEventClick={(e) => {
                // Navigate to interview details
                router.push(`/applications/${e.resource.application.id}/interview`);
              }}
            />
          </div>
        ) : (
          <div className="glass-card overflow-hidden animate-fade-in-up">
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
                          {search ? (
                            <>
                              <svg className="w-12 h-12 mb-4 text-[var(--color-neutral-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                              <p className="text-lg font-medium text-[var(--color-text-dark)]">No results found</p>
                              <p className="text-sm mt-1 mb-4">We couldn&apos;t find any interviews matching &quot;{search}&quot;</p>
                              <button onClick={() => setSearch('')} className="btn-secondary text-sm">
                                Clear Search
                              </button>
                            </>
                          ) : (
                            <>
                              <svg className="w-12 h-12 mb-4 text-[var(--color-neutral-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <p className="text-lg font-medium text-[var(--color-text-dark)]">No upcoming interviews</p>
                              <p className="text-sm mt-1">Check back later or move a candidate to the &apos;Interview&apos; stage.</p>
                            </>
                          )}
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
                            <div className="w-48">
                              <UserSelect
                                value={interview.interviewer?.id}
                                onChange={async (newUserId) => {
                                  try {
                                    const token = localStorage.getItem('access_token');
                                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/${interview.id}/interviewer`, {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                      },
                                      body: JSON.stringify({ interviewerId: newUserId })
                                    });
                                    // Refresh list
                                    fetchInterviews(page, false, false);
                                  } catch (e) {
                                    console.error('Failed to assign interviewer', e);
                                    alert('Failed to assign interviewer');
                                  }
                                }}
                                placeholder="Assign Interviewer"
                                className="text-sm"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {interview.status === 'CONFIRMED' ? (
                              <Link href={`/applications/${interview.application.id}/interview`} className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1">Start Session <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></Link>
                            ) : (
                              <div className="flex justify-end items-center gap-2">
                                {interview.status === 'PENDING' && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm('Confirm this interview manually?')) return;
                                      const token = localStorage.getItem('access_token');
                                      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/${interview.id}/status`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ status: 'CONFIRMED' })
                                      });
                                      fetchInterviews(page, false, false); // Refresh
                                    }}
                                    className="btn-secondary text-xs py-1.5 px-2 text-green-700 hover:bg-green-50 border-green-200"
                                    title="Mark as Confirmed"
                                  >
                                    Confirm
                                  </button>
                                )}
                                <Link href={`/applications/${interview.application.id}/interview`} className="text-[var(--color-text-soft)] hover:text-[var(--color-primary)] font-medium text-xs uppercase tracking-wide transition-colors">View Details</Link>
                              </div>
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
                <button onClick={() => fetchInterviews(page + 1, true, false)} disabled={loadingMore} className="btn-secondary text-sm">
                  {loadingMore ? 'Loading...' : 'Load More Future Events'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}