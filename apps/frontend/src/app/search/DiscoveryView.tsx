import Link from 'next/link';
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
    applications: { job: { title: string } }[];
}

export interface DiscoveryFilters {
    location?: string;
    minExp?: string;
    keywords?: string;
    relocation?: boolean;
}

interface DiscoveryViewProps {
    query: string;
    setQuery: (q: string) => void;
    filters: DiscoveryFilters;
    setFilters: (f: DiscoveryFilters) => void;
    results: Candidate[];
    loading: boolean;
    hasSearched: boolean;
    handleSearch: (e?: React.FormEvent) => void;
    loadMore: () => void;
    hasMore: boolean;
    loadingMore: boolean;
}

const CandidateCard = memo(({ candidate, query }: { candidate: Candidate; query: string }) => {
    const getResumeUrl = (path: string) => {
        if (!path) return '#';
        const normalizedPath = path.replace(/\\/g, '/');
        return `${process.env.NEXT_PUBLIC_API_URL}/${normalizedPath}`;
    };

    return (
        <div className="card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:-translate-y-1 transition-all duration-300 animate-slide-up">

            <div className="flex gap-5 items-center">
                <div className="w-14 h-14 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xl border border-[var(--color-border)]">
                    {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-[var(--color-text-dark)] group-hover:text-[var(--color-primary)] transition-colors">
                        {candidate.firstName} {candidate.lastName}
                    </h2>
                    <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-[var(--color-text-soft)] mt-1">
                        {candidate.location && (
                            <span className="flex items-center gap-1">
                                📍 {candidate.location}
                            </span>
                        )}
                        {candidate.experience ? (
                            <span className="flex items-center gap-1">
                                💼 {candidate.experience}y Exp
                            </span>
                        ) : null}
                        <span className="text-[var(--color-neutral-300)]">|</span>
                        <span className="truncate max-w-[200px]">{candidate.email}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                {/* Match Score Badge */}
                {query && candidate.aiScore !== undefined && (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${candidate.aiScore < 0.8
                        ? 'bg-[var(--color-success)]/10 text-[var(--color-success-text)] border-[var(--color-success)]/20'
                        : 'bg-[var(--color-warning)]/10 text-[var(--color-warning-text)] border-[var(--color-warning)]/20'
                        }`}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                        {Math.max(0, ((2 - candidate.aiScore) / 2 * 100)).toFixed(0)}% Match
                    </div>
                )}

                <div className="flex gap-3 w-full sm:w-auto">
                    <a
                        href={getResumeUrl(candidate.resumeS3Key)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-xs py-2 flex-1 sm:flex-none text-center"
                    >
                        Resume
                    </a>
                    <Link
                        href={`/applications/${candidate.applications?.[0]?.job ? '' : ''}`}
                        className="btn-ghost text-xs py-2 text-[var(--color-primary)]"
                    >
                        Details →
                    </Link>
                </div>
            </div>

            {candidate.applications && candidate.applications.length > 0 && (
                <div className="w-full mt-2 pt-3 border-t border-[var(--color-border)] flex gap-2 overflow-hidden">
                    {candidate.applications.map((app, i) => (
                        <span key={i} className="text-[10px] px-2 py-1 bg-[var(--color-neutral-100)] text-[var(--color-text-soft)] rounded border border-[var(--color-border)]">
                            Previously: {app.job.title}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
});

CandidateCard.displayName = 'CandidateCard';

export default function DiscoveryView({
    query,
    setQuery,
    filters,
    setFilters,
    results,
    loading,
    hasSearched,
    handleSearch,
    loadMore,
    hasMore,
    loadingMore
}: DiscoveryViewProps) {

    return (
        <>
            {/* 2. Main Search Hero */}
            <div className="mb-12 relative max-w-4xl mx-auto">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <svg className="h-6 w-6 text-[var(--color-text-soft)] group-focus-within:text-[var(--color-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="block w-full pl-14 pr-40 py-5 text-lg bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-soft)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-glow)] outline-none transition-all placeholder:text-[var(--color-text-soft)] text-[var(--color-text-dark)]"
                        placeholder="e.g. 'Senior React Engineer with Fintech experience in Paris'"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <button
                            onClick={() => handleSearch()}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-lg)] text-sm font-bold bg-[var(--color-primary)] text-white shadow-[var(--shadow-glow)] hover:bg-[var(--color-primary-hover)] hover:scale-105 transition-all duration-200"
                        >
                            <span>✨</span>
                            <span>AI Search</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Filters Sidebar */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-soft)] sticky top-24 overflow-hidden">

                        {/* Panel Header */}
                        <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-neutral-50)] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                <h2 className="text-xs font-bold text-[var(--color-text-dark)] uppercase tracking-widest">Filters</h2>
                            </div>
                            <button
                                onClick={() => { setQuery(''); setFilters({ location: '', minExp: '', keywords: '', relocation: false }); }}
                                className="text-[10px] font-medium text-[var(--color-text-soft)] hover:text-[var(--color-error-text)] transition-colors"
                            >
                                RESET
                            </button>
                        </div>

                        <div className="p-5 space-y-6">

                            {/* Location */}
                            <div className="group">
                                <label className="block text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-2 group-focus-within:text-[var(--color-primary)] transition-colors">
                                    Location
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-[var(--color-text-soft)] group-focus-within:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={filters.location}
                                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                        placeholder="City, Region, or Remote"
                                        className="input-base pl-9"
                                    />
                                </div>
                            </div>

                            {/* Experience */}
                            <div className="group">
                                <label className="block text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-2 group-focus-within:text-[var(--color-primary)] transition-colors">
                                    Experience
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-[var(--color-text-soft)] group-focus-within:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <input
                                        type="number"
                                        value={filters.minExp}
                                        onChange={(e) => setFilters({ ...filters, minExp: e.target.value })}
                                        placeholder="0"
                                        className="input-base pl-9 pr-12"
                                    />
                                    <span className="absolute right-3 text-xs text-[var(--color-text-soft)] font-medium pointer-events-none">Years+</span>
                                </div>
                            </div>

                            {/* Keywords */}
                            <div className="group">
                                <label className="block text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-2 group-focus-within:text-[var(--color-primary)] transition-colors">
                                    Must Include
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-[var(--color-text-soft)] group-focus-within:text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={filters.keywords}
                                        onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
                                        placeholder="SQL, MBA, 'Team Lead'"
                                        className="input-base pl-9"
                                    />
                                </div>
                            </div>

                            {/* Relocation Toggle */}
                            <div className="flex items-center justify-between py-2">
                                <label className="text-sm text-[var(--color-text-dark)] font-medium cursor-pointer" htmlFor="relocation">
                                    Open to Relocation
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="relocation" className="sr-only peer" checked={filters.relocation} onChange={(e) => setFilters({ ...filters, relocation: e.target.checked })} />
                                    <div className="w-9 h-5 bg-[var(--color-neutral-200)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                                </label>
                            </div>

                            <div className="pt-4 border-t border-[var(--color-border)]">
                                <button
                                    onClick={() => handleSearch()}
                                    disabled={loading}
                                    className="btn-primary w-full justify-center flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Searching...
                                        </>
                                    ) : 'Search'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Right Content: Results */}
                <div className="lg:col-span-9">
                    <div className="mb-4 flex items-end justify-between h-8">
                        {hasSearched && !loading && (
                            <h3 className="text-sm font-medium text-[var(--color-text-soft)] animate-fade-in">
                                Found <span className="text-[var(--color-text-dark)] font-bold">{results.length}</span> candidates
                            </h3>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-white/80 rounded-[var(--radius-lg)] animate-pulse border border-[var(--color-border)]"></div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)]">
                            <div className="w-16 h-16 bg-[var(--color-neutral-100)] rounded-full flex items-center justify-center mb-4 text-3xl">
                                {hasSearched ? '🔍' : '👋'}
                            </div>
                            <h3 className="text-lg font-bold text-[var(--color-text-dark)]">
                                {hasSearched ? 'No candidates found' : 'Ready to search'}
                            </h3>
                            <p className="text-[var(--color-text-soft)] mt-1 max-w-md">
                                {hasSearched
                                    ? "Try adjusting your filters or using broader terms in the AI concept search."
                                    : "Use the search bar above to find candidates by skills, job title, or even abstract concepts like 'finance expert'."}
                            </p>
                        </div>
                    )}

                    {/* Results List */}
                    <div className="space-y-4">
                        {results.map((c) => (
                            <CandidateCard key={c.id} candidate={c} query={query} />
                        ))}
                    </div>

                    {/* Load More Button */}
                    {!loading && hasMore && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="btn-secondary"
                            >
                                {loadingMore ? 'Loading...' : 'Load More Results'}
                            </button>
                        </div>
                    )}

                </div>

            </div>
        </>
    );
}
