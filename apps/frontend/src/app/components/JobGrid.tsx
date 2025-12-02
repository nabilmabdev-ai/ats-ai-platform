'use client';

import Link from 'next/link';
import { BriefcaseIcon } from '@/components/ui/Icons';

interface Job {
  id: string;
  title: string;
  department: string;
  status: string;
  priority?: string;
  remoteType?: string;
  applications?: unknown[];
  createdAt: string;
}

const getPriorityColor = (p?: string) => {
  switch (p) {
    case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
    case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export default function JobGrid({ jobs }: { jobs: Job[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {jobs.map((job) => (
        <div key={job.id} className="group flex flex-col bg-white rounded-[var(--radius-xl)] p-6 border border-[var(--color-border-subtle)] shadow-sm hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)]/30 transition-all duration-300 relative overflow-hidden">

          {/* Top Status Bar */}
          <div className="flex justify-between items-start mb-4">
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(job.priority)}`}>
              {job.priority || 'Normal'}
            </div>
            {job.remoteType && (
              <span className="text-[10px] font-semibold text-[var(--color-text-soft)] bg-[var(--color-neutral-100)] px-2 py-0.5 rounded-full">
                {job.remoteType}
              </span>
            )}
          </div>

          {/* Title & Dept */}
          <div className="mb-6 flex-1">
            <div className="flex items-center gap-2 mb-2 text-[var(--color-text-soft)] opacity-80">
              <BriefcaseIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{job.department || 'General'}</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-dark)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
              {job.title}
            </h3>
          </div>

          {/* Footer Metrics */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                {/* Mock Avatars for "Recent Applicants" feeling */}
                <div className="w-6 h-6 rounded-full bg-blue-100 border border-white"></div>
                <div className="w-6 h-6 rounded-full bg-green-100 border border-white"></div>
                <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[9px] text-gray-500 font-bold">
                  {(job.applications?.length || 0) > 2 ? `+${(job.applications?.length || 0) - 2}` : ''}
                </div>
              </div>
              <span className="text-xs text-[var(--color-text-soft)] font-medium">
                {job.applications?.length || 0} Candidates
              </span>
            </div>

            <Link
              href={`/vacancies/${job.id}`}
              className="w-8 h-8 rounded-full bg-[var(--color-neutral-50)] flex items-center justify-center text-[var(--color-slate)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}