'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface Job {
    id: string;
    title: string;
    department: string;
    status: string;
    location?: string;
    descriptionText: string;
    createdAt: string;
    requirements: string[];
    salaryMin?: number;
    salaryMax?: number;
    approvedBy?: { fullName: string };
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const jobId = resolvedParams.id;

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}`);

                if (!res.ok) {
                    if (res.status === 404) throw new Error('Job not found');
                    throw new Error('Failed to fetch job details');
                }

                const data = await res.json();
                setJob(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [jobId]);

    if (loading) return <div className="p-10 text-center text-[var(--color-slate)] animate-pulse">Loading Job Details...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;
    if (!job) return <div className="p-10 text-center text-[var(--color-slate)]">Job not found.</div>;

    return (
        <div className="min-h-screen bg-[var(--background)] p-8 pb-32">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/dashboard" className="text-sm text-[var(--color-slate)] hover:text-[var(--foreground)] transition-colors">
                            ← Back to Dashboard
                        </Link>
                        <span className="text-[var(--color-border)]">/</span>
                        <span className="text-sm text-[var(--color-slate)]">{job.department}</span>
                    </div>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight mb-3">{job.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-[var(--color-slate)]">
                                <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium">
                                    {job.status}
                                </span>
                                <span>{job.location || 'Remote'}</span>
                                <span>•</span>
                                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link href={`/jobs/${job.id}/edit`} className="btn-secondary">
                                Edit Job
                            </Link>
                            <Link href={`/jobs/${job.id}/candidates`} className="btn-primary">
                                View Candidates
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-8">
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold mb-4">Description</h2>
                            <div className="prose prose-sm max-w-none text-[var(--color-slate)]">
                                <ReactMarkdown>{job.descriptionText}</ReactMarkdown>
                            </div>
                        </div>

                        {job.requirements && job.requirements.length > 0 && (
                            <div className="card p-6">
                                <h2 className="text-lg font-semibold mb-4">Requirements</h2>
                                <ul className="list-disc list-inside space-y-2 text-[var(--color-slate)]">
                                    {job.requirements.map((req, i) => (
                                        <li key={i}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="col-span-1 space-y-6">
                        <div className="card p-6">
                            <h3 className="text-sm font-medium text-[var(--color-slate)] mb-4 uppercase tracking-wider">Job Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-[var(--color-slate)] mb-1">Department</div>
                                    <div className="font-medium">{job.department}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-[var(--color-slate)] mb-1">Location</div>
                                    <div className="font-medium">{job.location || 'Remote'}</div>
                                </div>

                                {(job.salaryMin || job.salaryMax) && (
                                    <div>
                                        <div className="text-xs text-[var(--color-slate)] mb-1">Salary Range</div>
                                        <div className="font-medium">
                                            {job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : ''}
                                            {job.salaryMin && job.salaryMax ? ' - ' : ''}
                                            {job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : ''}
                                        </div>
                                    </div>
                                )}

                                {job.approvedBy && (
                                    <div>
                                        <div className="text-xs text-[var(--color-slate)] mb-1">Hiring Manager</div>
                                        <div className="font-medium">{job.approvedBy.fullName}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
