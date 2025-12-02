'use client';

import React, { useState, useRef, useEffect } from 'react';
import { JobOption } from '../dashboard/PipelineBoard';

interface JobSelectorProps {
    jobs: JobOption[];
    selectedJobId: string;
    onSelectJob: (jobId: string) => void;
}

export default function JobSelector({ jobs, selectedJobId, onSelectJob }: JobSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showClosed, setShowClosed] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
        const isClosed = job.status === 'CLOSED' || job.status === 'ARCHIVED';
        if (!showClosed && isClosed) return false;
        return matchesSearch;
    });

    const selectedJob = jobs.find(j => j.id === selectedJobId);
    const displayLabel = selectedJobId === 'ALL' ? 'All Jobs' : selectedJob?.title || 'Select Job';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
                    ${isOpen
                        ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/10 bg-white'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                `}
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
                        {displayLabel}
                    </span>
                    {selectedJobId !== 'ALL' && (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                            {selectedJob?._count?.applications || 0}
                        </span>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[320px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">

                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search jobs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:bg-white transition-all outline-none placeholder:text-gray-400"
                            />
                        </div>

                        {/* Toggle Closed Jobs */}
                        <div className="mt-2 flex items-center gap-2 px-1">
                            <input
                                type="checkbox"
                                id="showClosed"
                                checked={showClosed}
                                onChange={(e) => setShowClosed(e.target.checked)}
                                className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                            />
                            <label htmlFor="showClosed" className="text-xs text-gray-600 cursor-pointer select-none">
                                Show Closed/Archived Jobs
                            </label>
                        </div>
                    </div>

                    {/* Job List */}
                    <div className="max-h-[300px] overflow-y-auto py-1">
                        {/* All Jobs Option */}
                        <button
                            onClick={() => {
                                onSelectJob('ALL');
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                                ${selectedJobId === 'ALL'
                                    ? 'bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }
                            `}
                        >
                            <span>All Jobs</span>
                            {selectedJobId === 'ALL' && (
                                <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>

                        <div className="h-px bg-gray-100 my-1 mx-2" />

                        {filteredJobs.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                No jobs found
                            </div>
                        ) : (
                            filteredJobs.map(job => (
                                <button
                                    key={job.id}
                                    onClick={() => {
                                        onSelectJob(job.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors group
                                        ${selectedJobId === job.id
                                            ? 'bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <span className="truncate pr-4">
                                        {job.title}
                                        {(job.status === 'CLOSED' || job.status === 'ARCHIVED') && (
                                            <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                                                {job.status}
                                            </span>
                                        )}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${selectedJobId === job.id ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                                            {job._count?.applications || 0}
                                        </span>
                                        {selectedJobId === job.id && (
                                            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
