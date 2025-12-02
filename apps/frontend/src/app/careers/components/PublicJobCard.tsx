'use client';

import Link from 'next/link';
import { BriefcaseIcon, ArrowRightIcon } from '@/components/ui/Icons';

// Helper for location icon
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  remoteType: string;
  createdAt: string;
}

export default function PublicJobCard({ job }: { job: Job }) {
  return (
    <Link 
      href={`/jobs/${job.id}/apply`}
      className="group block bg-white rounded-xl border border-[var(--color-border)] p-6 hover:border-[var(--color-primary)] hover:shadow-lg transition-all duration-200"
    >
      <div className="flex justify-between items-start">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-primary)]/5 px-2 py-1 rounded-md">
                    {job.department || 'General'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-soft)] bg-[var(--color-neutral-100)] px-2 py-1 rounded-md">
                    {job.remoteType}
                </span>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-dark)] group-hover:text-[var(--color-primary)] transition-colors">
                {job.title}
            </h3>
        </div>
        <div className="text-[var(--color-neutral-300)] group-hover:text-[var(--color-primary)] transition-colors">
            <ArrowRightIcon className="w-5 h-5 -rotate-45" />
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-[var(--color-neutral-100)] flex items-center justify-between text-sm text-[var(--color-text-soft)]">
        <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                {job.location || 'Remote'}
            </span>
            <span className="flex items-center gap-1">
                <BriefcaseIcon className="w-4 h-4" />
                Full-time
            </span>
        </div>
        <span className="text-xs">
            Posted {new Date(job.createdAt).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}