import Link from 'next/link';
import { Virtuoso } from 'react-virtuoso';
import { memo } from 'react';

interface Candidate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    aiScore: number;
    resumeS3Key: string;
    location?: string;
    experience?: number;
    applications: {
        job: { title: string };
        status: string;
        createdAt: string;
        tags: string[];
    }[];
    createdAt: string;
}

interface Job {
    id: string;
    title: string;
}

export interface DatabaseFilters {
    jobId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    tags?: string;
}

interface DatabaseViewProps {
    filters: DatabaseFilters;
    setFilters: (f: DatabaseFilters) => void;
    results: Candidate[];
    loading: boolean;
    handleSearch: (e?: React.FormEvent) => void;
    loadMore: () => void;
    hasMore: boolean;
    loadingMore: boolean;
    jobs: Job[];
}

const Row = memo(({ candidate }: { candidate: Candidate }) => {
    const getResumeUrl = (path: string) => {
        if (!path) return '#';
        const normalizedPath = path.replace(/\\/g, '/');
        return `${process.env.NEXT_PUBLIC_API_URL}/${normalizedPath}`;
    };

    return (
        <div className="flex items-center border-b border-[var(--color-border)] hover:bg-[var(--color-neutral-50)] transition-colors group h-[80px]">
            <div className="w-[30%] px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                    {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                </div>
                <div className="truncate">
                    <div className="font-medium text-[var(--color-text-dark)] truncate">{candidate.firstName} {candidate.lastName}</div>
                    <div className="text-xs text-[var(--color-text-soft)] truncate">{candidate.email}</div>
                </div>
            </div>
            <div className="w-[20%] px-6 py-4">
                <div className="flex flex-col gap-1">
                    {candidate.applications?.map((app, i) => (
                        <span key={i} className="text-xs text-[var(--color-text-dark)] truncate max-w-[150px]" title={app.job.title}>
                            {app.job.title}
                        </span>
                    ))}
                    {(!candidate.applications || candidate.applications.length === 0) && <span className="text-xs text-[var(--color-neutral-400)]">-</span>}
                </div>
            </div>
            <div className="w-[15%] px-6 py-4">
                <div className="flex flex-col gap-1">
                    {candidate.applications?.map((app, i) => (
                        <span key={i} className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border w-fit
                            ${app.status === 'REJECTED' ? 'bg-[var(--color-error)]/10 text-[var(--color-error-text)] border-[var(--color-error)]/20' :
                                app.status === 'HIRED' ? 'bg-[var(--color-success)]/10 text-[var(--color-success-text)] border-[var(--color-success)]/20' :
                                    'bg-[var(--color-info)]/10 text-[var(--color-info-text)] border-[var(--color-info)]/20'}`}>
                            {app.status}
                        </span>
                    ))}
                </div>
            </div>
            <div className="w-[15%] px-6 py-4 text-xs text-[var(--color-text-soft)]">
                {new Date(candidate.createdAt).toLocaleDateString()}
            </div>
            <div className="w-[20%] px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                        href={getResumeUrl(candidate.resumeS3Key)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-primary)] hover:underline text-xs font-medium"
                    >
                        Resume
                    </a>
                    <Link
                        href={`/applications/${candidate.applications?.[0]?.job ? '' : ''}`}
                        className="text-[var(--color-text-dark)] hover:text-[var(--color-primary)] text-xs font-medium"
                    >
                        View
                    </Link>
                </div>
            </div>
        </div>
    );
});

Row.displayName = 'Row';

const Footer = ({ context }: { context?: { loadingMore: boolean } }) => {
    return context?.loadingMore ? (
        <div className="p-4 text-center text-xs font-medium text-[var(--color-primary)]">
            Loading more...
        </div>
    ) : null;
};

export default function DatabaseView({
    filters,
    setFilters,
    results,
    loading,
    handleSearch,
    loadMore,
    hasMore,
    loadingMore,
    jobs
}: DatabaseViewProps) {

    const statusOptions = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'SOURCED'];

    return (
        <div className="flex flex-col gap-6 h-[calc(100vh-200px)]">

            {/* Horizontal Filters Bar */}
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-soft)] p-4 shrink-0">
                <div className="flex flex-col lg:flex-row items-end gap-4">

                    {/* Job Filter */}
                    <div className="w-full lg:w-1/5 group">
                        <label className="block text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1.5">
                            Job
                        </label>
                        <select
                            value={filters.jobId || ''}
                            onChange={(e) => setFilters({ ...filters, jobId: e.target.value })}
                            className="input-base w-full bg-[var(--color-neutral-50)] focus:bg-white py-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm"
                        >
                            <option value="">All Jobs</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="w-full lg:w-1/6 group">
                        <label className="block text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1.5">
                            Status
                        </label>
                        <select
                            value={filters.status || ''}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="input-base w-full bg-[var(--color-neutral-50)] focus:bg-white py-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm"
                        >
                            <option value="">All Statuses</option>
                            {statusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="w-full lg:w-1/4 group">
                        <label className="block text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1.5">
                            Applied Date
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={filters.fromDate || ''}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                                className="input-base w-full bg-[var(--color-neutral-50)] focus:bg-white py-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm"
                                placeholder="From"
                            />
                            <input
                                type="date"
                                value={filters.toDate || ''}
                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                                className="input-base w-full bg-[var(--color-neutral-50)] focus:bg-white py-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm"
                                placeholder="To"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="w-full lg:w-1/5 group">
                        <label className="block text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1.5">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={filters.tags || ''}
                            onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                            placeholder="e.g. silver-medalist"
                            className="input-base w-full bg-[var(--color-neutral-50)] focus:bg-white py-2 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 w-full lg:w-auto ml-auto">
                        <button
                            onClick={() => setFilters({ jobId: '', status: '', fromDate: '', toDate: '', tags: '' })}
                            className="btn-secondary px-4 py-2 text-xs font-bold h-[38px]"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => handleSearch()}
                            disabled={loading}
                            className="btn-primary px-6 py-2 text-xs font-bold h-[38px] min-w-[100px]"
                        >
                            {loading ? '...' : 'Filter'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-soft)] flex flex-col flex-1 overflow-hidden">

                {/* Table Header */}
                <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-neutral-50)] shrink-0">
                    <div className="w-[30%] px-6 py-3 text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Candidate</div>
                    <div className="w-[20%] px-6 py-3 text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Job(s)</div>
                    <div className="w-[15%] px-6 py-3 text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Status</div>
                    <div className="w-[15%] px-6 py-3 text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Applied</div>
                    <div className="w-[20%] px-6 py-3 text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider text-right">Actions</div>
                </div>

                {/* Table Content (Virtualized) */}
                <div className="flex-1 h-full">
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="animate-pulse flex items-center gap-4">
                                    <div className="h-10 w-10 bg-[var(--color-neutral-100)] rounded-full"></div>
                                    <div className="h-4 bg-[var(--color-neutral-100)] rounded w-1/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-soft)]">
                            No candidates found matching your filters.
                        </div>
                    ) : (
                        <Virtuoso
                            style={{ height: '100%' }}
                            data={results}
                            itemContent={(index, candidate) => <Row candidate={candidate} />}
                            endReached={() => {
                                if (hasMore && !loadingMore) {
                                    loadMore();
                                }
                            }}
                            context={{ loadingMore }}
                            components={{
                                Footer: Footer
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
