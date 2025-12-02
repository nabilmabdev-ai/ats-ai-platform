'use client';

import Link from 'next/link';
import { BriefcaseIcon, ArrowRightIcon } from '@/components/ui/Icons';

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
      className="group block bg-white rounded-2xl p-8 border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
    >
      {/* Hover Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
            <div className="flex flex-wrap gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-md">
                    {job.department || 'General'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-soft)] bg-[var(--color-neutral-100)] px-2.5 py-1 rounded-md">
                    {job.remoteType}
                </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-neutral-50)] flex items-center justify-center text-[var(--color-neutral-300)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300">
                <ArrowRightIcon className="w-4 h-4 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
            </div>
        </div>
        
        <h3 className="text-xl font-bold text-[var(--color-text-dark)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
            {job.title}
        </h3>

        <div className="mt-auto pt-6 flex items-center gap-5 text-sm text-[var(--color-text-soft)] font-medium">
            <span className="flex items-center gap-1.5">
                <MapPinIcon className="w-4 h-4 text-[var(--color-neutral-400)]" />
                {job.location || 'Remote'}
            </span>
            <span className="flex items-center gap-1.5">
                <BriefcaseIcon className="w-4 h-4 text-[var(--color-neutral-400)]" />
                Full-time
            </span>
        </div>
        
        <div className="absolute bottom-8 right-8 text-[10px] font-semibold text-[var(--color-neutral-400)] opacity-0 group-hover:opacity-100 transition-opacity delay-100">
            Posted {new Date(job.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}