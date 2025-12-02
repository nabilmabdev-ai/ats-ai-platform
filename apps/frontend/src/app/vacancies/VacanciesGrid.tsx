// --- Content from: apps/frontend/src/app/vacancies/VacanciesGrid.tsx ---

'use client';

import Link from 'next/link';
import { UsersIcon, BriefcaseIcon, ArrowRightIcon } from '@/components/ui/Icons';

// --- Interfaces ---
interface Job {
  id: string;
  title: string;
  department: string;
  status: string;
  priority: string;
  headcount: number;
  _count: { applications: number };
  createdAt: string;
  distribution?: {
    linkedin?: { status: string };
    indeed?: { status: string };
  };
}

// Reusable Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    PUBLISHED: "bg-[var(--color-success)]/10 text-[var(--color-success-text)] border-[var(--color-success)]/20",
    PENDING_APPROVAL: "bg-[var(--color-warning)]/10 text-[var(--color-warning-text)] border-[var(--color-warning)]/20",
    DRAFT: "bg-[var(--color-neutral-100)] text-[var(--color-text-soft)] border-[var(--color-border)]",
    CLOSED: "bg-[var(--color-error)]/10 text-[var(--color-error-text)] border-[var(--color-error)]/20"
  }[status] || "bg-gray-100 text-gray-600";

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${styles}`}>
      {status === 'PUBLISHED' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>}
      <span className="text-[10px] font-bold uppercase tracking-wider">{status.replace('_', ' ')}</span>
    </div>
  );
};

export default function VacanciesGrid({ jobs }: { jobs: Job[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map((job) => (
        <div
            key={job.id}
            className="group flex flex-col bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)]/30 transition-all duration-200 overflow-hidden"
        >

          {/* Card Header */}
          <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-3">
                 <div className="h-10 w-10 rounded-lg bg-[var(--color-neutral-50)] flex items-center justify-center text-[var(--color-text-soft)] group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] transition-colors">
                    <BriefcaseIcon className="w-5 h-5" />
                 </div>
                 <StatusBadge status={job.status} />
              </div>

              <Link href={`/vacancies/${job.id}`} className="block">
                 <h3 className="text-lg font-bold text-[var(--color-text-dark)] mb-1 group-hover:text-[var(--color-primary)] transition-colors line-clamp-1" title={job.title}>
                    {job.title}
                 </h3>
              </Link>
              <p className="text-xs text-[var(--color-text-soft)] font-medium uppercase tracking-wide">
                {job.department || 'General'}
              </p>
          </div>

          {/* Stats Grid */}
          <div className="px-6 py-4 border-t border-b border-[var(--color-border)] bg-[var(--color-neutral-50)]/30 grid grid-cols-2 gap-4">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1">Applicants</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-[var(--color-text-dark)]">{job._count?.applications || 0}</span>
                    {(job._count?.applications || 0) > 0 && (
                        <span className="text-[10px] font-bold text-[var(--color-success-text)] bg-[var(--color-success)]/20 px-1.5 rounded">+New</span>
                    )}
                </div>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1">Hiring</span>
                <div className="flex items-center gap-1.5 text-[var(--color-text-dark)]">
                    <UsersIcon className="w-4 h-4 text-[var(--color-text-soft)]" />
                    <span className="text-sm font-bold">{job.headcount}</span>
                </div>
             </div>
          </div>

          {/* Card Footer */}
          <div className="p-4 bg-white flex items-center justify-between">
             <span className="text-[10px] font-medium text-[var(--color-text-soft)]">
                {new Date(job.createdAt).toLocaleDateString()}
             </span>

             <Link
                href={`/vacancies/${job.id}`}
                className="flex items-center gap-1 text-xs font-bold text-[var(--color-text-dark)] hover:text-[var(--color-primary)] transition-colors group/link"
             >
                Manage
                <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
             </Link>
          </div>
        </div>
      ))}
    </div>
  );
}