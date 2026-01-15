'use client';

import Link from 'next/link';
import { UsersIcon, SettingsIcon, BriefcaseIcon, CopyIcon } from '@/components/ui/Icons';

interface Job {
  id: string;
  title: string;
  descriptionText: string;
  status: string;
  department?: string;
  priority?: string;
  remoteType?: string;
  createdAt?: string;
}

export default function JobCard({ job, onDuplicate }: { job: Job; onDuplicate?: (id: string) => void }) {

  // 1. Helper to strip Markdown and Title if repeated
  const getCleanDescription = (markdown: string, title: string) => {
    if (!markdown) return "No description provided.";
    let clean = markdown
      .replace(/[#*`_]/g, '') // Remove Markdown symbols
      .replace(/\n+/g, ' ')   // Collapse newlines into spaces
      .trim();

    // Remove title if it appears at the start (case insensitive)
    if (clean.toLowerCase().startsWith(title.toLowerCase())) {
      clean = clean.slice(title.length).trim();
    }

    return clean.slice(0, 100); // Truncate
  };

  // 2. Premium Tag Styling (Pastel)
  const getPriorityColor = (p?: string) => {
    switch (p) {
      case 'URGENT':
      case 'HIGH':
        return 'tag bg-orange-50 text-orange-700 border-orange-200'; // Orange for urgent
      case 'MEDIUM': return 'tag bg-blue-50 text-blue-700 border-blue-200'; // Blue for normal
      default: return 'tag bg-gray-50 text-gray-700 border-gray-200'; // Grey
    }
  };

  return (
    <div className="card group flex flex-col h-full relative overflow-hidden hover:shadow-[var(--shadow-hover)] transition-all duration-300 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30">

      <div className="p-[var(--space-6)] flex flex-col h-full relative z-10">
        {/* Header: Tags & Status */}
        <div className="flex justify-between items-center mb-[var(--space-4)]">
          <div className="flex gap-2">
            {/* Priority Tag */}
            <span className={getPriorityColor(job.priority)}>
              {job.priority === 'HIGH' ? 'URGENT' : (job.priority || 'NORMAL')}
            </span>
            {/* Location/Remote Tag */}
            {job.remoteType && (
              <span className="tag bg-green-50 text-green-700 border-green-200">
                {job.remoteType}
              </span>
            )}
            {/* Department Tag (Extra) */}
            {job.department && (
              <span className="tag bg-indigo-50 text-indigo-700 border-indigo-200 hidden xl:inline-block">
                {job.department}
              </span>
            )}
          </div>

          {/* Status Dot */}
          <div className={`w-2 h-2 rounded-full ${job.status === 'OPEN' ? 'bg-[var(--color-success)] shadow-[0_0_8px_var(--color-success)]' : 'bg-[var(--color-neutral-300)]'}`} />
        </div>

        {/* Content */}
        <div className="mb-[var(--space-6)] flex-1">
          <div className="flex items-center gap-2 mb-3 text-[var(--color-text-soft)]">
            <BriefcaseIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{job.department || 'Engineering'}</span>
          </div>

          <h3 className="text-h3 text-[var(--color-text-dark)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 mb-2 h-[4.5rem]">
            {job.title}
          </h3>

          <p className="text-body text-[var(--color-text-soft)] line-clamp-2">
            {getCleanDescription(job.descriptionText, job.title)}...
          </p>
        </div>

        {/* Footer: Actions */}
        <div className="pt-[var(--space-4)] border-t border-[var(--color-border)] flex items-center justify-between gap-4">
          <Link
            href={`/jobs/${job.id}/candidates`}
            className="flex-1 btn-ghost text-xs h-9 flex justify-center items-center gap-2 hover:bg-[var(--color-neutral-50)] rounded-[var(--radius-md)] transition-colors"
          >
            <UsersIcon className="w-3.5 h-3.5 text-[var(--color-text-soft)]" />
            <span className="font-medium text-[var(--color-text-dark)]">Candidates</span>
          </Link>

          <div className="w-px h-4 bg-[var(--color-border)]" />

          <Link
            href={`/vacancies/${job.id}`}
            className="flex-1 btn-ghost text-xs h-9 flex justify-center items-center gap-2 hover:bg-[var(--color-neutral-50)] rounded-[var(--radius-md)] transition-colors group/btn"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-[var(--color-text-soft)] group-hover/btn:text-[var(--color-primary)] transition-colors" />
            <span className="font-medium text-[var(--color-text-dark)] group-hover/btn:text-[var(--color-primary)] transition-colors">Manage</span>
          </Link>

          {onDuplicate && (
            <>
              <div className="w-px h-4 bg-[var(--color-border)]" />
              <button
                onClick={() => onDuplicate(job.id)}
                className="btn-ghost text-xs h-9 w-9 flex justify-center items-center hover:bg-[var(--color-neutral-50)] rounded-[var(--radius-md)] transition-colors"
                title="Duplicate Job"
              >
                <CopyIcon className="w-3.5 h-3.5 text-[var(--color-text-soft)] hover:text-[var(--color-primary)]" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}