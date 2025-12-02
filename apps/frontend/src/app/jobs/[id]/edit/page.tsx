'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Job {
    id: string;
    title: string;
    department: string;
    status: string;
    location?: string;
    descriptionText: string;
    requirements: string[];
    salaryMin?: number;
    salaryMax?: number;
    priority?: string;
    remoteType?: string;
    headcount?: number;
}

export default function JobEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const jobId = resolvedParams.id;
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Job>({
        id: '',
        title: '',
        department: '',
        status: 'DRAFT',
        location: '',
        descriptionText: '',
        requirements: [],
        salaryMin: 0,
        salaryMax: 0,
        priority: 'MEDIUM',
        remoteType: 'ONSITE',
        headcount: 1
    });

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}`);
                if (!res.ok) throw new Error('Failed to fetch job details');
                const data = await res.json();
                setFormData({
                    ...data,
                    requirements: data.requirements || [],
                    location: data.location || '',
                    salaryMin: data.salaryMin || 0,
                    salaryMax: data.salaryMax || 0,
                });
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [jobId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'salaryMin' || name === 'salaryMax' || name === 'headcount' ? Number(value) : value
        }));
    };

    const handleRequirementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        // Split by newlines to create array
        const reqs = text.split('\n').filter(line => line.trim() !== '');
        setFormData(prev => ({ ...prev, requirements: reqs }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to update job');

            router.push(`/jobs/${jobId}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-[var(--color-slate)] animate-pulse">Loading Editor...</div>;
    if (error && !formData.id) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="min-h-screen bg-[var(--background)] p-8 pb-32">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <Link href={`/jobs/${jobId}`} className="text-sm text-[var(--color-slate)] hover:text-[var(--foreground)] transition-colors">
                        ← Cancel and Back to Job
                    </Link>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Edit Job</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="card p-6 space-y-6">
                        <h2 className="text-lg font-semibold border-b border-[var(--color-border)] pb-2 mb-4">Basic Info</h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Job Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Department</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="Engineering">Engineering</option>
                                    <option value="Product">Product</option>
                                    <option value="Design">Design</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="HR">HR</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="PENDING_APPROVAL">Pending Approval</option>
                                    <option value="PUBLISHED">Published</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Remote Type</label>
                                <select
                                    name="remoteType"
                                    value={formData.remoteType}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="ONSITE">On-site</option>
                                    <option value="HYBRID">Hybrid</option>
                                    <option value="REMOTE">Remote</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6 space-y-6">
                        <h2 className="text-lg font-semibold border-b border-[var(--color-border)] pb-2 mb-4">Details</h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Min Salary</label>
                                <input
                                    type="number"
                                    name="salaryMin"
                                    value={formData.salaryMin}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Max Salary</label>
                                <input
                                    type="number"
                                    name="salaryMax"
                                    value={formData.salaryMax}
                                    onChange={handleChange}
                                    className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Description (Markdown)</label>
                            <textarea
                                name="descriptionText"
                                value={formData.descriptionText}
                                onChange={handleChange}
                                rows={10}
                                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Requirements (One per line)</label>
                            <textarea
                                value={formData.requirements.join('\n')}
                                onChange={handleRequirementsChange}
                                rows={6}
                                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                placeholder="React&#10;TypeScript&#10;Node.js"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <Link href={`/jobs/${jobId}`} className="btn-secondary">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
