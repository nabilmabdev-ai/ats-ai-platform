'use client';

import { useState } from 'react';
import JobCard from './JobCard'; // Your existing card (Grid Item)
import Link from 'next/link';
import { BriefcaseIcon, SearchIcon } from '@/components/ui/Icons';

// Rename your existing "JobCard.tsx" to "JobListItem.tsx" if you want the Table view to look like rows, 
// OR reuse JobCard as the "Grid" item and make a new Table view.
//
// ACTUALLY, looking at your previous code, `JobCard.tsx` WAS a Grid Card.
// So let's make `JobGrid` use `JobCard`, and we will create a `JobTable` for the list view.

interface Job {
    id: string;
    title: string;
    department?: string;
    applications?: unknown[]; // TODO: Define a proper type for Application
    createdAt: string;
    descriptionText: string;
    status: string;
    priority?: string;
    remoteType?: string;
}

const JobTable = ({ jobs }: { jobs: Job[] }) => (
    <div className="bg-white rounded-[var(--radius-xl)] shadow-sm border border-[var(--color-border)] overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border)]">
                <thead className="bg-[var(--color-neutral-50)]">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Candidates</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Posted</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[var(--color-border)]">
                    {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-[var(--color-neutral-50)] transition-colors group cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                        <BriefcaseIcon className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-[var(--color-text-dark)]">{job.title}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-soft)]">
                                {job.department || 'General'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                    {job.applications?.length || 0} Active
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-soft)]">
                                {new Date(job.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Link href={`/vacancies/${job.id}`} className="text-[var(--color-primary)] hover:underline text-sm font-bold">
                                    View
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default function DashboardJobs({ jobs }: { jobs: Job[] }) {
    // Default to GRID on dashboard usually looks better, but we can default to TABLE
    const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

    return (
        <>
            {/* Controls Header */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between mb-[var(--space-6)] gap-[var(--space-4)]">
                <div className="flex items-center gap-3">
                    <h2 className="text-h3">Recent Job Postings</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-text-soft)] text-xs font-bold">{jobs.length}</span>
                </div>

                <div className="flex gap-3 items-center">
                    {/* Toggle Switch */}
                    <div className="bg-white border border-[var(--color-border)] rounded-lg p-1 flex items-center shadow-sm">
                        <button
                            onClick={() => setViewMode('TABLE')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'TABLE' ? 'bg-[var(--color-soft-grey)] text-[var(--color-text-dark)] shadow-sm' : 'text-[var(--color-text-soft)] hover:text-[var(--color-primary)]'}`}
                            title="List View"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        </button>
                        <button
                            onClick={() => setViewMode('GRID')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-[var(--color-soft-grey)] text-[var(--color-text-dark)] shadow-sm' : 'text-[var(--color-text-soft)] hover:text-[var(--color-primary)]'}`}
                            title="Grid View"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </button>
                    </div>

                    <div className="h-6 w-px bg-[var(--color-border)] mx-1"></div>

                    <Link href="/dashboard" className="btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-2">
                        <BriefcaseIcon className="w-3.5 h-3.5" />
                        <span>Pipeline</span>
                    </Link>
                    <Link href="/search" className="btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-2">
                        <SearchIcon className="w-3.5 h-3.5" />
                        <span>Database</span>
                    </Link>
                </div>
            </div>

            {/* View Switcher */}
            {jobs.length === 0 ? (
                <div className="col-span-full py-24 bg-white rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-center animate-fade-in">
                    {/* Empty state UI */}
                    <h3 className="text-lg font-bold text-[var(--color-text-dark)]">No jobs found</h3>
                    <p className="text-sm text-[var(--color-text-soft)]">Create a job to get started.</p>
                </div>
            ) : (
                viewMode === 'GRID' ? (
                    // Using the JobCard component you already have (Grid Item)
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-6)] pb-[var(--space-10)]">
                        {jobs.map((job, index) => (
                            <div key={job.id} className="animate-scale-in h-full" style={{ animationDelay: `${index * 50}ms` }}>
                                <JobCard job={job} />
                            </div>
                        ))}
                    </div>
                ) : (
                    // Using the Table component defined above
                    <JobTable jobs={jobs} />
                )
            )}
        </>
    );
}