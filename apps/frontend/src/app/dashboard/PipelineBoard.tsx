'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import CandidateCard from '../components/CandidateCard';
import JobSelector from '../components/JobSelector';
import PeriodSelector, { PeriodOption } from '../components/PeriodSelector';
import SystemHealthBanner from '../components/SystemHealthBanner';
import { UserPlus } from 'lucide-react';
import AddCandidateModal from '../components/AddCandidateModal';

// --- Types ---
export interface Application {
    id: string;
    job: { id: string; title: string };
    candidate: { id: string; email: string; firstName: string; lastName: string };
    aiSummary: string;
    status: string;
    aiScore: number;
    updatedAt?: string;
}

export interface JobOption {
    id: string;
    title: string;
    status: string;
    _count?: { applications: number };
}

// --- Constants ---
const COLUMNS: Record<string, string> = {
    SOURCED: 'Sourced',
    APPLIED: 'New Applicants',
    SCREENING: 'Screening',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
    HIRED: 'Hired',
    REJECTED: 'Rejected',
};

const COLUMN_COLORS: Record<string, string> = {
    SOURCED: 'border-indigo-500',
    APPLIED: 'border-blue-500',
    SCREENING: 'border-yellow-500',
    INTERVIEW: 'border-purple-500',
    OFFER: 'border-green-500',
    HIRED: 'border-teal-600',
    REJECTED: 'border-red-500',
};

const PAGE_SIZE = 10;

// --- Props ---
interface PipelineBoardProps {
    jobs: JobOption[];
    initialApplications: Application[];
    selectedJobId: string;
    showClosed: boolean;
    totalCount: number;
}

// 1. Add an EyeOff Icon for the toggle
const EyeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

export default function PipelineBoard({ jobs, initialApplications, selectedJobId, showClosed, totalCount }: PipelineBoardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [period, setPeriod] = useState<PeriodOption>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // 2. New State for filtering
    const [showRejected, setShowRejected] = useState(false);

    // State for pagination
    const [applications, setApplications] = useState<Application[]>(initialApplications);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialApplications.length < totalCount);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Update local state when initial props change (e.g. filter change)
    useEffect(() => {
        setApplications(initialApplications);
        setPage(1);
        setHasMore(initialApplications.length < totalCount);
    }, [initialApplications, totalCount]);

    const handleJobSelect = (jobId: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('jobId', jobId);
        router.push(`/dashboard?${params.toString()}`);
    };

    const handlePeriodChange = (value: PeriodOption) => {
        setPeriod(value);
    };

    const handleRefresh = () => {
        router.refresh();
    };

    const [columns, setColumns] = useState<Record<string, Application[]>>({});

    useEffect(() => {
        const grouped: Record<string, Application[]> = Object.keys(COLUMNS).reduce((acc, key) => ({ ...acc, [key]: [] }), {});
        applications.forEach(app => {
            // 3. FILTER LOGIC: If showRejected is false, skip rejected apps
            if (!showRejected && app.status === 'REJECTED') {
                return;
            }
            if (grouped[app.status]) {
                grouped[app.status].push(app);
            }
        });
        setColumns(grouped);
    }, [applications, showRejected]);

    // --- POLLING FOR PARSING STATUS ---
    // Instead of refreshing the whole page (which resets pagination), we only fetch updates for parsing candidates.
    useEffect(() => {
        // Identify candidates that are parsing (no AI summary yet)
        const parsingApps = applications.filter(app => !app.aiSummary || app.aiSummary === '');

        if (parsingApps.length === 0) return;

        const intervalId = setInterval(async () => {
            const idsToCheck = parsingApps.map(app => app.id);
            if (idsToCheck.length === 0) return;

            try {
                // Fetch updates for these specific IDs
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/batch?ids=${idsToCheck.join(',')}`);
                if (!res.ok) return;

                const updatedApps: Application[] = await res.json();

                // Merge updates into local state if any finished parsing
                setApplications(prevApps => {
                    let hasChanges = false;
                    const nextApps = prevApps.map(prevApp => {
                        const update = updatedApps.find(u => u.id === prevApp.id);
                        // If we found an update and it has a summary now, use it
                        if (update && update.aiSummary && update.aiSummary !== prevApp.aiSummary) {
                            hasChanges = true;
                            return { ...prevApp, ...update };
                        }
                        return prevApp;
                    });

                    return hasChanges ? nextApps : prevApps;
                });

            } catch (error) {
                console.error("Silent polling failed:", error);
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [applications]);

    const loadMore = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);

        try {
            const nextPage = page + 1;
            const jobIdQuery = selectedJobId !== 'ALL' ? `&jobId=${selectedJobId}` : '';
            const closedQuery = showClosed ? '&includeClosed=true' : '';

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications?page=${nextPage}&limit=${PAGE_SIZE}${jobIdQuery}${closedQuery}`);

            if (!res.ok) throw new Error('Failed to fetch more applications');

            const payload = await res.json();
            const newApps = Array.isArray(payload) ? payload : (payload.data || []);

            if (newApps.length === 0) {
                setHasMore(false);
            } else {
                setApplications(prev => [...prev, ...newApps]);
                setPage(nextPage);
                // Check if we've reached the total
                if (applications.length + newApps.length >= totalCount) {
                    setHasMore(false);
                }
            }
        } catch (error) {
            console.error('Failed to load more:', error);
            alert('Failed to load more applications.');
        } finally {
            setIsLoadingMore(false);
        }
    };

    // --- Derived State for Closed Job ---
    const selectedJob = jobs.find(j => j.id === selectedJobId);
    const isJobClosed = selectedJob?.status === 'CLOSED' || selectedJob?.status === 'ARCHIVED';

    const handleToggleClosed = () => {
        const params = new URLSearchParams(searchParams);
        if (showClosed) {
            params.delete('showClosed');
        } else {
            params.set('showClosed', 'true');
        }
        router.push(`/dashboard?${params.toString()}`);
    };

    const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);

    const handleUpdateStatus = async (status: string) => {
        if (!selectedJobId || selectedJobId === 'ALL') return;

        // --- SMART CLOSE LOGIC ---
        if (status === 'CLOSED') {
            const confirmMessage = '⚠️ WARNING: Closing this job will AUTOMATICALLY REJECT all active candidates (excluding Hired/Offer).\n\nAre you sure you want to proceed?';
            if (!window.confirm(confirmMessage)) return;

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${selectedJobId}/close`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                if (!res.ok) throw new Error('Failed to close job');

                router.refresh();
                setIsManageMenuOpen(false);
            } catch (error) {
                console.error('Failed to close job:', error);
                alert('Failed to close job. Please try again.');
            }
            return;
        }

        // --- Standard Status Update (e.g. ARCHIVED) ---
        const confirmMessage = status === 'ARCHIVED'
            ? 'Are you sure you want to archive this job? It will be hidden from the active pipeline.'
            : `Set status to ${status}?`;

        if (!window.confirm(confirmMessage)) return;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${selectedJobId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            // Refresh the page to reflect changes
            router.refresh();
            setIsManageMenuOpen(false);
        } catch (error) {
            console.error('Failed to update job status:', error);
            alert('Failed to update job status. Please try again.');
        }
    };

    const onDragEnd = async (result: DropResult) => {
        if (isJobClosed) return; // Double check to prevent drops on closed jobs

        const { destination, source, draggableId } = result;

        if (!destination) {
            return;
        }

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const sourceColumn = columns[source.droppableId];
        const destColumn = columns[destination.droppableId];
        const movedApp = sourceColumn.find(app => app.id === draggableId);

        if (!movedApp) return;

        // Optimistic Update
        const newColumns = { ...columns };

        // Remove from source
        newColumns[source.droppableId] = Array.from(sourceColumn);
        newColumns[source.droppableId].splice(source.index, 1);

        // Add to destination
        if (source.droppableId === destination.droppableId) {
            newColumns[source.droppableId].splice(destination.index, 0, movedApp);
        } else {
            // Update status if moving to a different column
            const updatedApp = { ...movedApp, status: destination.droppableId };
            newColumns[destination.droppableId] = Array.from(destColumn);
            newColumns[destination.droppableId].splice(destination.index, 0, updatedApp);
        }

        setColumns(newColumns);

        // Persist to Backend
        if (source.droppableId !== destination.droppableId) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${draggableId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: destination.droppableId }),
                });

                if (!res.ok) throw new Error('Failed to update status');
            } catch (error) {
                console.error('Failed to move card:', error);
                alert('Failed to move card. Reverting changes.');
                // Revert state
                setColumns(columns);
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg shadow-black/[0.02]">
            <SystemHealthBanner />
            {/* --- Header --- */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200/60">
                {/* Filter Bar Container */}
                <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-sm px-4 py-2 flex items-center gap-3">
                    <JobSelector jobs={jobs} selectedJobId={selectedJobId} onSelectJob={handleJobSelect} />
                    <PeriodSelector selectedPeriod={period} onSelectPeriod={handlePeriodChange} />
                    <div className="h-6 w-px bg-gray-200 mx-1"></div>
                    <button onClick={handleRefresh} className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500" title="Refresh data">
                        <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    {/* 4. THE TOGGLE BUTTON */}
                    <button
                        onClick={() => setShowRejected(!showRejected)}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border
                            ${showRejected
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-700'
                            }
                        `}
                    >
                        {showRejected ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeOffIcon className="w-3.5 h-3.5" />}
                        {showRejected ? 'Hide Rejected' : 'Show Rejected'}
                    </button>

                    {/* 5. CLOSED JOBS TOGGLE */}
                    <button
                        onClick={handleToggleClosed}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border
                            ${showClosed
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-700'
                            }
                        `}
                    >
                        {showClosed ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeOffIcon className="w-3.5 h-3.5" />}
                        {showClosed ? 'Hide Closed Jobs' : 'Show Closed Jobs'}
                    </button>
                    {/* End Toggle */}
                </div>
                <div className="flex items-center gap-3">
                    {/* Manage Job Dropdown */}
                    {selectedJobId !== 'ALL' && !isJobClosed && (
                        <div className="relative">
                            <button
                                onClick={() => setIsManageMenuOpen(!isManageMenuOpen)}
                                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                            >
                                <span>Manage Job</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isManageMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1">
                                    <button
                                        onClick={() => handleUpdateStatus('CLOSED')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <div>
                                            <div className="font-medium">Mark as Filled</div>
                                            <div className="text-xs text-gray-500">Close job (Hired)</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus('ARCHIVED')}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        <div>
                                            <div className="font-medium">Archive Job</div>
                                            <div className="text-xs text-gray-500">Hide from pipeline</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Add Candidate</span>
                    </button>

                    <Link href="/jobs/new" className="btn-primary flex items-center gap-2 shadow-[var(--shadow-glow)] hover:scale-105 transition-transform">
                        <span>+</span> Create Job
                    </Link>
                </div>
            </div>

            {/* --- Closed Job Banner --- */}
            {isJobClosed && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-center gap-2 text-amber-800 text-sm font-medium">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>This job is <strong>{selectedJob?.status}</strong>. The pipeline is read-only. Candidates are still accessible.</span>
                </div>
            )}

            {/* --- Kanban Board Area --- */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#F4F5F7]">
                    <div className="flex h-full gap-4 px-8 pt-6 pb-4 min-w-max">
                        {Object.entries(COLUMNS).map(([statusKey, title]) => {

                            // 5. HIDE THE COLUMN ENTIRELY if toggle is off
                            if (statusKey === 'REJECTED' && !showRejected) return null;

                            return (
                                <div key={statusKey} className="flex flex-col w-[280px] h-full">

                                    {/* 1. Column Header (Sticky) */}
                                    <div className="flex items-center justify-between mb-3 px-1 sticky top-0 z-10 bg-[#F4F5F7] py-2 border-b border-[var(--color-border-subtle)]">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-bold text-[var(--color-text-dark)] uppercase tracking-wider flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-[var(--color-text-soft)] opacity-50"></span>
                                                {title}
                                            </h2>
                                            <span className="bg-white border border-[var(--color-border-subtle)] text-[var(--color-text-soft)] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {columns[statusKey]?.length || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 2. Column Container (The Lane) */}
                                    <div className={`flex-1 bg-gray-50/50 rounded-xl border-t-4 border-x border-b border-gray-200/60 flex flex-col overflow-hidden relative ${COLUMN_COLORS[statusKey]}`}>
                                        <Droppable droppableId={statusKey} isDropDisabled={isJobClosed}>
                                            {(provided, snapshot) => (
                                                <div
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    className={`
                                                    flex-1 overflow-y-auto px-2 py-2 transition-colors duration-200
                                                    ${snapshot.isDraggingOver ? 'bg-[var(--color-primary)]/5' : ''}
                                                `}
                                                >
                                                    <div className="flex flex-col gap-3">
                                                        {columns[statusKey]?.map((app, index) => (
                                                            <Draggable key={app.id} draggableId={app.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <CandidateCard
                                                                        app={app}
                                                                        provided={provided}
                                                                        snapshot={snapshot}
                                                                    />
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>

                                                    {/* Empty State Illustration */}
                                                    {columns[statusKey]?.length === 0 && !snapshot.isDraggingOver && (
                                                        <div className="mt-4 bg-[var(--color-neutral-50)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-4 text-center">
                                                            <p className="text-sm text-[var(--color-text-soft)] italic">
                                                                Drag candidates here to start screening.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DragDropContext>

            {/* --- Load More Button (Global) --- */}
            {hasMore && (
                <div className="p-4 border-t border-gray-200 bg-white flex justify-center">
                    <button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {isLoadingMore ? 'Loading...' : `Load More Candidates (${applications.length} / ${totalCount})`}
                    </button>
                </div>
            )}

            <AddCandidateModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                jobId={selectedJobId !== 'ALL' ? selectedJobId : undefined}
                onSuccess={() => {
                    router.refresh();
                }}
            />
        </div>
    );
}