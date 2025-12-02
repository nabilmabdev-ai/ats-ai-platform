'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BriefcaseIcon, UsersIcon, CheckIcon, TrashIcon, ArrowRightIcon } from '@/components/ui/Icons';

interface Job {
  id: string;
  title: string;
  department: string;
  descriptionText: string;
  requirements: string[];
  salaryMin: number;
  salaryMax: number;
  location: string;
  remoteType: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'CLOSED';
  approvedBy?: { fullName: string };
  headcount?: number;
  createdAt?: string;
  distribution?: {
    linkedin?: { status: string };
    indeed?: { status: string };
  };
}

// Custom Status Badge matching JobCard style
const StatusBadge = ({ status }: { status: Job['status'] }) => {
  const styles = {
    PUBLISHED: "bg-[var(--color-success)]/10 text-[var(--color-success-text)] border-[var(--color-success)]/20",
    PENDING_APPROVAL: "bg-[var(--color-warning)]/10 text-[var(--color-warning-text)] border-[var(--color-warning)]/20",
    DRAFT: "bg-[var(--color-neutral-100)] text-[var(--color-text-soft)] border-[var(--color-border)]",
    CLOSED: "bg-[var(--color-error)]/10 text-[var(--color-error-text)] border-[var(--color-error)]/20"
  }[status] || "bg-gray-100 text-gray-600";

  return (
    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full border ${styles}`}>
      {status === 'PUBLISHED' && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-success)]"></span>
        </span>
      )}
      {status.replace('_', ' ')}
    </div>
  );
};

export default function ManageJobPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState<string>('');
  const [salaryMin, setSalaryMin] = useState<number>(0);
  const [salaryMax, setSalaryMax] = useState<number>(0);
  const [status, setStatus] = useState<Job['status']>('DRAFT');
  const [location, setLocation] = useState('');
  const [remoteType, setRemoteType] = useState('HYBRID');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`)
      .then(res => { if (!res.ok) throw new Error('Job not found'); return res.json(); })
      .then(data => {
        setJob(data);
        setTitle(data.title);
        setDepartment(data.department || '');
        setDescription(data.descriptionText || '');
        setRequirements((data.requirements || []).join('\n'));
        setSalaryMin(data.salaryMin || 0);
        setSalaryMax(data.salaryMax || 0);
        setStatus(data.status);
        setLocation(data.location || '');
        setRemoteType(data.remoteType || 'HYBRID');
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        title,
        department,
        descriptionText: description,
        requirements: requirements.split('\n').filter(r => r.trim() !== ''),
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        status,
        location,
        remoteType
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Re-fetch updated data to sync state completely
        const updatedJob = await res.json();
        setJob(updatedJob);
        alert('Job Updated Successfully!');
      } else {
        alert('Failed to update job.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone and will remove all associated applications.')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/vacancies');
      else alert('Failed to delete job.');
    } catch {
      alert('Network error.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
      <div className="w-10 h-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-[var(--color-text-soft)]">Loading Job Details...</p>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--color-text-dark)]">Job not found</h2>
        <Link href="/vacancies" className="text-[var(--color-primary)] hover:underline mt-2 block">Return to Vacancies</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 sm:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* 1. Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <Link href="/vacancies" className="group flex items-center gap-1 text-xs font-bold text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] mb-3 transition-colors">
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Back to Vacancies
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-[var(--color-midnight)] tracking-tight">{title || 'Untitled Job'}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-[var(--color-text-soft)] mt-1 flex items-center gap-2">
              <BriefcaseIcon className="w-3.5 h-3.5" />
              {department || 'General'} • Created on {new Date(job.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/jobs/${id}/candidates`}
              className="btn-secondary flex items-center gap-2 text-sm h-10"
            >
              <UsersIcon className="w-4 h-4" />
              Candidates
            </Link>
            <button
              type="submit"
              form="job-form"
              disabled={isSaving}
              className="btn-primary h-10 px-6 shadow-lg hover:shadow-xl"
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* 2. Main Form Area */}
          <div className="lg:col-span-8 space-y-6">
            <form id="job-form" onSubmit={handleUpdate} className="card bg-white p-8 space-y-8 border border-[var(--color-border-subtle)]">

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-gunmetal)] uppercase tracking-wider border-b border-[var(--color-border)] pb-2 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-slate)] uppercase tracking-wide mb-1.5">Job Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-slate)] uppercase tracking-wide mb-1.5">Department</label>
                    <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="input-base" placeholder="e.g. Engineering" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-slate)] uppercase tracking-wide mb-1.5">Location</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-slate)] uppercase tracking-wide mb-1.5">Remote Type</label>
                    <select value={remoteType} onChange={e => setRemoteType(e.target.value)} className="input-base appearance-none">
                      <option value="ONSITE">On-Site</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="REMOTE">Remote</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Compensation */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-gunmetal)] uppercase tracking-wider border-b border-[var(--color-border)] pb-2 mb-4">Compensation</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-slate)] uppercase tracking-wide mb-1.5">Min Salary</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input type="number" value={salaryMin} onChange={e => setSalaryMin(Number(e.target.value))} className="input-base pl-7" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-slate)] uppercase tracking-wide mb-1.5">Max Salary</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input type="number" value={salaryMax} onChange={e => setSalaryMax(Number(e.target.value))} className="input-base pl-7" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-gunmetal)] uppercase tracking-wider border-b border-[var(--color-border)] pb-2 mb-4">Job Details</h3>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-slate)] uppercase tracking-wide mb-1.5">Requirements (One per line)</label>
                  <textarea rows={4} value={requirements} onChange={e => setRequirements(e.target.value)} className="input-base font-mono text-sm leading-relaxed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-slate)] uppercase tracking-wide mb-1.5">Description (Markdown)</label>
                  <textarea rows={12} value={description} onChange={e => setDescription(e.target.value)} className="input-base font-mono text-sm leading-relaxed" />
                </div>
              </div>

            </form>
          </div>

          {/* 3. Sidebar (Settings & Status) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Status Card */}
            <div className="bg-white p-6 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm">
              <h3 className="text-xs font-bold text-[var(--color-slate)] uppercase tracking-widest mb-4">Visibility</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-gunmetal)] mb-1.5">Current Status</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as Job['status'])}
                      className="w-full input-base appearance-none font-medium text-[var(--color-text-dark)]"
                    >
                      <option value="DRAFT">Draft (Hidden)</option>
                      <option value="PENDING_APPROVAL">Pending Approval</option>
                      <option value="PUBLISHED">Published (Public)</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-slate)]">
                      <ArrowRightIcon className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                {job.approvedBy && (
                  <div className="bg-[var(--color-success)]/5 border border-[var(--color-success)]/20 rounded-[var(--radius-md)] p-3 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center">
                      <CheckIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--color-success-text)]">Approved</p>
                      <p className="text-[10px] text-[var(--color-slate)]">By {job.approvedBy.fullName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Distribution Card */}
            <div className="bg-white p-6 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm">
              <h3 className="text-xs font-bold text-[var(--color-slate)] uppercase tracking-widest mb-4">Distribution Channels</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-[var(--color-soft-grey)] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0077b5] rounded-md flex items-center justify-center text-white font-bold text-xs shadow-sm">in</div>
                    <span className="text-sm font-bold text-[var(--color-gunmetal)]">LinkedIn</span>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${job.distribution?.linkedin?.status === 'POSTED' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-gray-300'}`}></div>
                </div>
                <div className="flex justify-between items-center p-3 bg-[var(--color-soft-grey)] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#2164f3] rounded-md flex items-center justify-center text-white font-bold text-xs shadow-sm">Id</div>
                    <span className="text-sm font-bold text-[var(--color-gunmetal)]">Indeed</span>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${job.distribution?.indeed?.status === 'POSTED' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-[var(--color-border)] pt-6 mt-6">
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-md)] border border-[var(--color-error)]/30 text-[var(--color-error)] hover:bg-[var(--color-error)]/5 transition-colors text-sm font-bold"
              >
                <TrashIcon className="w-4 h-4" />
                Delete Job
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}