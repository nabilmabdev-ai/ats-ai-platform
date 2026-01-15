'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import CandidateCard from '../components/CandidateCard';
import JobSelector from '../components/JobSelector';
import PeriodSelector, { PeriodOption } from '../components/PeriodSelector';
import SystemHealthBanner from '../components/SystemHealthBanner';
import DispatchModal from '../../components/DispatchModal'; // [NEW]
import { UserPlus, Search, X, ChevronDown, CheckSquare, Square, Share2 } from 'lucide-react'; // [NEW] Share2
import AddCandidateModal from '../components/AddCandidateModal';
import BackwardMoveModal from '../components/BackwardMoveModal'; // [NEW]
import { useAuth } from '@/components/AuthProvider'; // [NEW]
import PipelineColumn from './components/PipelineColumn';

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

const PAGE_SIZE = 500;

// --- Props ---
interface PipelineBoardProps {
    jobs: JobOption[];
    initialApplications: Application[];
    selectedJobId: string;
    showClosed: boolean;
    totalCount: number;
    initialSearch?: string;
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
export default function PipelineBoard({ jobs, initialApplications, selectedJobId, showClosed, totalCount, initialSearch = '' }: PipelineBoardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [period, setPeriod] = useState<PeriodOption>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false); // [NEW]

    // Auth
    const { token } = useAuth(); // [NEW]

    // Backward Move State
    const [isBackwardModalOpen, setIsBackwardModalOpen] = useState(false);
    const [pendingMove, setPendingMove] = useState<{ id: string, source: string, dest: string, draggableId: string } | null>(null);
    const [isMovingBackward, setIsMovingBackward] = useState(false);

    // 2. New State for filtering
    // Default: Show all EXCEPT 'REJECTED' (matching previous behavior)
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        Object.keys(COLUMNS).filter(key => key !== 'REJECTED')
    );
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);


    // Search State
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);

    // State for pagination
    const [applications, setApplications] = useState<Application[]>(initialApplications);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialApplications.length < totalCount);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Debounce Logic
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Update local state when initial props change (e.g. filter change)
    useEffect(() => {
        setApplications(initialApplications);
        setPage(1);
        setHasMore(initialApplications.length < totalCount);
        setSearchTerm(initialSearch);
    }, [initialApplications, totalCount, initialSearch]);

    // Handle Search URL Update
    useEffect(() => {
        const currentSearch = searchParams.get('search') || '';
        if (debouncedSearchTerm !== currentSearch) {
            const params = new URLSearchParams(searchParams);
            if (debouncedSearchTerm) {
                params.set('search', debouncedSearchTerm);
            } else {
                params.delete('search');
            }
            params.delete('page');
            if (selectedJobId !== 'ALL') params.set('jobId', selectedJobId);
            if (showClosed) params.set('showClosed', 'true');
            router.push(`/dashboard?${params.toString()}`);
        }
    }, [debouncedSearchTerm, router, searchParams, selectedJobId, showClosed]);

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
            // 3. FILTER LOGIC: Only include apps in visible columns
            // We can actually just push them all, and rely on the rendering to hide the column.
            // BUT, if we want to "Hide" the apps from calculation or anything, we can filter here.
            // Let's stick to the UI hiding the column, but we still group them correctly.
            // Wait, if I hide "Sourced", where do the "Sourced" apps go? They should just be hidden.
            if (grouped[app.status]) {
                grouped[app.status].push(app);
            }
        });
        setColumns(grouped);
    }, [applications]); // Removed visibleColumns dependency as we filter at render time now


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
            const searchQueryStr = debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : '';

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications?page=${nextPage}&limit=${PAGE_SIZE}${jobIdQuery}${closedQuery}${searchQueryStr}`);

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
    const loadAll = async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);

        try {
            // Fetch everything by setting a large limit or using the totalCount
            // We'll use totalCount + a buffer to be safe, or just a very large number like 10000
            const limit = totalCount > 0 ? totalCount : 10000;

            const jobIdQuery = selectedJobId !== 'ALL' ? `&jobId=${selectedJobId}` : '';
            const closedQuery = showClosed ? '&includeClosed=true' : '';
            const searchQueryStr = debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : '';

            // We fetch page 1 with the large limit to get ALL candidates at once
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications?page=1&limit=${limit}${jobIdQuery}${closedQuery}${searchQueryStr}`);

            if (!res.ok) throw new Error('Failed to fetch all applications');

            const payload = await res.json();
            const newApps = Array.isArray(payload) ? payload : (payload.data || []);

            if (newApps.length === 0) {
                // Should not happen if totalCount > 0, but handle gracefully
                setHasMore(false);
            } else {
                setApplications(newApps); // Replace existing with the full list
                setPage(1); // Reset page context if needed, though we have everything now
                setHasMore(false); // We have everything
            }
        } catch (error) {
            console.error('Failed to load all:', error);
            alert('Failed to load all applications.');
        } finally {
            setIsLoadingMore(false);
        }
    };

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

        // Helper to check backward move
        const weights: Record<string, number> = {
            SOURCED: 0, APPLIED: 10, SCREENING: 20, INTERVIEW: 30, OFFER: 40, HIRED: 50, REJECTED: -1
        };

        const currentWeight = weights[source.droppableId] || 0;
        const nextWeight = weights[destination.droppableId] || 0;
        const isBackward = nextWeight < currentWeight && source.droppableId !== 'REJECTED' && destination.droppableId !== 'REJECTED';

        // Helper to Execute the Move (Optimistic + API)
        const executeMove = async (moveDraggableId: string, fromId: string, toId: string, reason?: string, notes?: string) => {
            const fromColumn = columns[fromId];
            const toColumn = columns[toId];
            const appToMove = fromColumn?.find(app => app.id === moveDraggableId);

            if (!appToMove) return;

            // Optimistic Update
            const newColumns = { ...columns };
            newColumns[fromId] = fromColumn.filter(app => app.id !== moveDraggableId);

            // Insert into destination (at index if possible, else end)
            // We lost the exact index from DropResult if we delayed it, so we just append or use saved index?
            // For simplicity in modal flow, we just append to Top or Bottom? 
            // Ideally we kept the original 'destination.index' in pendingMove.
            // But let's just push to top for visibility or keep it simple.
            // Actually, if we use destination.index from the original event strictly, we need to pass it.
            // Let's assume we just add it to the list.
            const updatedApp = { ...appToMove, status: toId };
            newColumns[toId] = [updatedApp, ...(toColumn || [])];
            // Note: Unshift to top is safer than strict index if things changed, but drag usually expects explicit index.
            // If we want perfection, pendingMove needs 'index'.

            setColumns(newColumns);

            // Persist
            try {
                const body: any = { status: toId };
                if (reason) body.reason = reason;
                if (notes) body.notes = notes;

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${moveDraggableId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // [NEW] Auth Header
                    },
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message || 'Failed to update status');
                }
            } catch (error: any) {
                console.error('Failed to move card:', error);
                alert(`Failed to move card: ${error.message}`);
                // Revert
                setColumns(columns); // Revert to old state (closure captures old columns)
            }
        };

        if (isBackward) {
            // Defer execution -> Open Modal
            setPendingMove({
                id: draggableId,
                source: source.droppableId,
                dest: destination.droppableId,
                draggableId: draggableId
                // We drop 'index' here for simplicity, or we can add it to pendingMove if we want precise drop
            });
            setIsBackwardModalOpen(true);
            return;
        }

        // Forward/Neutral Move -> Execute Immediately
        // (We need to replicate the standard logic but using executeMove to avoid duplication?
        // Or just inline it here as before but secured?)
        // Let's use logic similar to 'executeMove' but strictly respecting the 'destination.index'

        // Optimistic Update (Standard)
        const newColumns = { ...columns };
        newColumns[source.droppableId] = Array.from(sourceColumn);
        newColumns[source.droppableId].splice(source.index, 1);

        if (source.droppableId === destination.droppableId) {
            newColumns[source.droppableId].splice(destination.index, 0, movedApp);
            setColumns(newColumns);
            // No API call needed for reorder in same column (unless we tracked rank)
            return;
        } else {
            const updatedApp = { ...movedApp, status: destination.droppableId };
            newColumns[destination.droppableId] = Array.from(destColumn);
            newColumns[destination.droppableId].splice(destination.index, 0, updatedApp);
            setColumns(newColumns);

            // API
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${draggableId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // [NEW]
                    },
                    body: JSON.stringify({ status: destination.droppableId }),
                });
                if (!res.ok) throw new Error('Failed to update status');
            } catch (error) {
                console.error('Failed to move:', error);
                alert('Failed to save move.');
                setColumns(columns); // Revert
            }
        }
    };

    const handleConfirmBackward = async (reason: string, notes: string) => {
        if (!pendingMove) return;
        setIsMovingBackward(true);
        try {
            // We use a simplified execute (appending to top) because we didn't save index, 
            // or we can implement a specific logic.
            // Let's use the helper 'executeMove' logic defined above? No, I can't access it easily outside closure if defined inside.
            // I'll just write the fetch here.

            // 1. Optimistic Update (Move to Dest)
            const fromId = pendingMove.source;
            const toId = pendingMove.dest;
            const appId = pendingMove.id;

            const fromColumn = columns[fromId];
            const toColumn = columns[toId];
            const appToMove = fromColumn?.find(app => app.id === appId);

            if (!appToMove) return; // Should not happen

            const newColumns = { ...columns };
            newColumns[fromId] = fromColumn.filter(app => app.id !== appId);
            const updatedApp = { ...appToMove, status: toId };
            newColumns[toId] = [updatedApp, ...(toColumn || [])]; // Prepend

            setColumns(newColumns); // Apply Optimistic

            // 2. API Call
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${appId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: toId, reason, notes }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to update status');
            }

            setIsBackwardModalOpen(false);
            setPendingMove(null);

        } catch (error: any) {
            console.error('Backward move failed:', error);
            alert(`Failed: ${error.message}`);
            // Revert is redundant if we didn't update state yet? 
            // Wait, I DID update state optimistically above.
            // So I should revert.
            // But 'columns' here refers to the state at the time of render?
            // Actually 'columns' in async function might be stale.
            // Ideally we accept the reversion or force refresh.
            router.refresh();
            // setColumns(columns) might accept stale enclosure.
        } finally {
            setIsMovingBackward(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg shadow-black/[0.02]">
            <SystemHealthBanner />
            {/* --- Header --- */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200/60">
                {/* Filter Bar Container */}
                <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-sm px-4 py-2 flex items-center gap-3">

                    {/* NEW: Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <JobSelector jobs={jobs} selectedJobId={selectedJobId} onSelectJob={handleJobSelect} />
                    <PeriodSelector selectedPeriod={period} onSelectPeriod={handlePeriodChange} />
                    <div className="h-6 w-px bg-gray-200 mx-1"></div>
                    <button onClick={handleRefresh} className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500" title="Refresh data">
                        <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    {/* 4. THE TOGGLE BUTTON */}
                    {/* 4. COLUMNS FILTER DROPDOWN */}
                    <div className="relative">
                        <button
                            onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <span>Columns</span>
                            <ChevronDown className="w-3 h-3" />
                        </button>

                        {isColumnMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsColumnMenuOpen(false)}
                                ></div>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 py-1">
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
                                        Toggle Columns
                                    </div>
                                    {Object.entries(COLUMNS).map(([key, label]) => {
                                        const isVisible = visibleColumns.includes(key);
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setVisibleColumns(prev => {
                                                        if (prev.includes(key)) {
                                                            return prev.filter(k => k !== key);
                                                        } else {
                                                            return [...prev, key];
                                                        }
                                                    });
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                {isVisible ? (
                                                    <CheckSquare className="w-4 h-4 text-[var(--color-primary)]" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-gray-300" />
                                                )}
                                                <span className={isVisible ? 'font-medium' : 'text-gray-500'}>{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

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
                        onClick={() => setIsDispatchModalOpen(true)}
                        className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                        title="Auto-distribute applications"
                    >
                        <Share2 className="w-4 h-4" />
                        <span>Dispatch</span>
                    </button>

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

            <DispatchModal
                isOpen={isDispatchModalOpen}
                onClose={() => setIsDispatchModalOpen(false)}
                onDispatch={handleRefresh}
            />

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

                            // 5. HIDE THE COLUMN ENTIRELY if not in visibleColumns
                            if (!visibleColumns.includes(statusKey)) return null;

                            return (
                                <PipelineColumn
                                    key={statusKey}
                                    statusKey={statusKey}
                                    title={title}
                                    apps={columns[statusKey] || []}
                                    isJobClosed={isJobClosed || false}
                                    columnColor={COLUMN_COLORS[statusKey]}
                                />
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
                    <button
                        onClick={loadAll}
                        disabled={isLoadingMore}
                        className="ml-3 px-6 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 hover:text-indigo-900 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        Load All
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

            <BackwardMoveModal
                isOpen={isBackwardModalOpen}
                onClose={() => {
                    setIsBackwardModalOpen(false);
                    setPendingMove(null);
                }}
                onConfirm={handleConfirmBackward}
                fromStatus={pendingMove && COLUMNS[pendingMove.source] ? COLUMNS[pendingMove.source] : ''}
                toStatus={pendingMove && COLUMNS[pendingMove.dest] ? COLUMNS[pendingMove.dest] : ''}
                loading={isMovingBackward}
            />
        </div>
    );
}