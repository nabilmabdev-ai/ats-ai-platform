// apps/frontend/src/app/applications/[id]/page.tsx

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import CommentSection from '@/app/components/CommentSection';
import { 
    BriefcaseIcon, 
    CheckIcon, 
    ArrowRightIcon,
    XIcon
} from '@/components/ui/Icons';

// --- Icons Helper ---
const MapPinIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

// --- Types ---
interface Application {
    id: string;
    status: string;
    aiScore: number;
    aiSummary: string;
    createdAt: string;
    candidate: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        linkedinUrl: string | null;
        location: string | null;
        experience: number;
        resumeText: string | null;
        resumeS3Key: string | null;
    };
    job: {
        id: string;
        title: string;
        department: string;
    };
    aiParsingData?: {
        skills?: string[];
        education_level?: string;
    };
}

const STATUS_STEPS = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];

export default function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const appId = resolvedParams.id;
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RESUME'>('OVERVIEW');

    useEffect(() => {
        if (appId) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${appId}`)
                .then((res) => res.json())
                .then((data) => {
                    setApp(data);
                    setLoading(false);
                })
                .catch((err) => console.error("Failed to load application data", err));
        }
    }, [appId]);

    const handleStatusChange = async (newStatus: string) => {
        if (!app) return;
        setUpdating(true);
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${app.id}/status`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus }),
            });
            
            if (res.ok) {
                setApp({ ...app, status: newStatus });
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const getResumeUrl = (path: string | null) => {
        if (!path) return '#';
        return `${process.env.NEXT_PUBLIC_API_URL}/${path.replace(/\\/g, '/')}`;
    };

    const scoreColorStyles = (score: number) => {
        if (score >= 0.8) return 'bg-[var(--color-success)]/10 text-[var(--color-success-text)] border-[var(--color-success)]/20';
        if (score >= 0.5) return 'bg-[var(--color-warning)]/10 text-[var(--color-warning-text)] border-[var(--color-warning)]/20';
        return 'bg-[var(--color-error)]/10 text-[var(--color-error-text)] border-[var(--color-error)]/20';
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
            <div className="w-10 h-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[var(--color-text-soft)]">Loading Profile...</p>
        </div>
    );

    if (!app) return (
        <div className="min-h-screen flex items-center justify-center text-[var(--color-text-soft)]">
            Application not found
        </div>
    );

    const currentStepIndex = STATUS_STEPS.indexOf(app.status);
    const isRejected = app.status === 'REJECTED';

    return (
        <div className="flex flex-col h-screen bg-[var(--color-background)] font-sans">
            
            {/* 1. Sticky Header */}
            <header className="sticky top-0 z-20 h-20 w-full bg-white border-b border-[var(--color-border)] px-8 flex items-center justify-between shadow-sm shrink-0">
                
                {/* Left: Back & Identity */}
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="group flex items-center gap-2 text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider hover:text-[var(--color-text-dark)] transition-colors">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> 
                        Back
                    </Link>
                    
                    <div className="h-8 w-px bg-[var(--color-border)]"></div>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center text-sm font-bold text-[var(--color-text-soft)] border border-[var(--color-border)]">
                            {app.candidate.firstName[0]}{app.candidate.lastName[0]}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-[var(--color-text-dark)] leading-tight">
                                {app.candidate.firstName} {app.candidate.lastName}
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-soft)]">
                                <BriefcaseIcon className="w-3.5 h-3.5" />
                                <span>{app.job.title}</span>
                                <span className="text-[var(--color-border-subtle)]">•</span>
                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${scoreColorStyles(app.aiScore || 0)}`}>
                                    {Math.round((app.aiScore || 0) * 100)}% Match
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {isRejected ? (
                         <span className="px-4 py-2 bg-[var(--color-error)]/10 text-[var(--color-error-text)] rounded-[var(--radius-md)] font-bold text-xs uppercase tracking-wider border border-[var(--color-error)]/20">
                            Rejected
                        </span>
                    ) : (
                        <>
                            <button 
                                onClick={() => handleStatusChange('REJECTED')}
                                disabled={updating}
                                className="btn-secondary text-[var(--color-error-text)] hover:text-[var(--color-error-text)] hover:bg-[var(--color-error)]/5 hover:border-[var(--color-error)]/30"
                            >
                                Reject Candidate
                            </button>
                            {currentStepIndex < STATUS_STEPS.length - 1 && (
                                <button 
                                    onClick={() => handleStatusChange(STATUS_STEPS[currentStepIndex + 1])}
                                    disabled={updating}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <span>Move to {STATUS_STEPS[currentStepIndex + 1]}</span>
                                    <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </header>

            {/* Main Content Scrollable Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8 animate-fade-in space-y-8">

                    {/* Pipeline Progress Bar */}
                    {!isRejected && (
                        <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 shadow-sm">
                             <div className="flex justify-between items-center relative">
                                {/* Background Line */}
                                <div className="absolute top-3 left-0 w-full h-0.5 bg-[var(--color-neutral-100)] -z-10"></div>
                                
                                {STATUS_STEPS.map((step, index) => {
                                    const isCompleted = index <= currentStepIndex;
                                    const isCurrent = index === currentStepIndex;
                                    
                                    return (
                                        <div 
                                            key={step} 
                                            className="flex flex-col items-center group cursor-pointer" 
                                            onClick={() => handleStatusChange(step)}
                                        >
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                                                isCompleted 
                                                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-[var(--shadow-glow)]' 
                                                    : 'bg-white border-[var(--color-neutral-300)] text-[var(--color-neutral-300)]'
                                            } ${isCurrent ? 'ring-4 ring-[var(--color-primary)]/20 scale-110' : ''}`}>
                                                {isCompleted && <CheckIcon className="w-4 h-4" />}
                                            </div>
                                            <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                                isCurrent ? 'text-[var(--color-primary)]' : isCompleted ? 'text-[var(--color-text-dark)]' : 'text-[var(--color-text-soft)]'
                                            }`}>
                                                {step}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN: Profile & Resume */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Tabs */}
                            <div className="flex gap-6 border-b border-[var(--color-border)] px-2">
                                <button
                                    onClick={() => setActiveTab('OVERVIEW')}
                                    className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                                        activeTab === 'OVERVIEW' 
                                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]' 
                                            : 'border-transparent text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]'
                                    }`}
                                >
                                    Overview & AI Analysis
                                </button>
                                <button
                                    onClick={() => setActiveTab('RESUME')}
                                    className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                                        activeTab === 'RESUME' 
                                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]' 
                                            : 'border-transparent text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]'
                                    }`}
                                >
                                    Resume Preview
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm min-h-[500px] overflow-hidden">
                                {activeTab === 'OVERVIEW' && (
                                    <div className="p-8 space-y-8 animate-fade-in">
                                        
                                        {/* AI Executive Summary */}
                                        <div className="bg-gradient-to-br from-[var(--color-secondary-blue)]/10 to-[var(--color-secondary-lilac)]/10 rounded-[var(--radius-lg)] p-6 border border-[var(--color-secondary-blue)]/20">
                                            <h3 className="text-xs font-bold text-[var(--color-info-text)] uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <span className="text-lg">✨</span> AI Executive Summary
                                            </h3>
                                            <p className="text-sm text-[var(--color-text-dark)] leading-relaxed font-medium">
                                                {app.aiSummary || "No summary generated yet. This candidate is waiting for processing."}
                                            </p>
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest border-b border-[var(--color-border)] pb-2">Contact Details</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-dark)]">
                                                        <MailIcon className="w-4 h-4 text-[var(--color-text-soft)]" />
                                                        <a href={`mailto:${app.candidate.email}`} className="hover:text-[var(--color-primary)] transition-colors">{app.candidate.email}</a>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-dark)]">
                                                        <PhoneIcon className="w-4 h-4 text-[var(--color-text-soft)]" />
                                                        <span>{app.candidate.phone || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-dark)]">
                                                        <LinkedinIcon className="w-4 h-4 text-[#0077b5]" />
                                                        {app.candidate.linkedinUrl ? (
                                                            <a href={app.candidate.linkedinUrl} target="_blank" className="text-[var(--color-primary)] hover:underline">LinkedIn Profile</a>
                                                        ) : <span className="text-[var(--color-text-soft)] italic">Not provided</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-dark)]">
                                                        <MapPinIcon className="w-4 h-4 text-[var(--color-text-soft)]" />
                                                        <span>{app.candidate.location || 'Unknown Location'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest border-b border-[var(--color-border)] pb-2">Experience & Education</h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1">Total Experience</p>
                                                        <p className="text-base font-bold text-[var(--color-text-dark)]">{app.candidate.experience} Years</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1">Education Level</p>
                                                        <p className="text-base font-bold text-[var(--color-text-dark)]">{app.aiParsingData?.education_level || 'Not specified'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Extracted Skills */}
                                        <div>
                                            <h4 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest mb-4 border-b border-[var(--color-border)] pb-2">Detected Skills</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {app.aiParsingData?.skills?.map((skill, i) => (
                                                    <span key={i} className="px-3 py-1.5 rounded-full bg-[var(--color-neutral-100)] text-[var(--color-text-dark)] text-xs font-semibold border border-[var(--color-border)]">
                                                        {skill}
                                                    </span>
                                                )) || <span className="text-sm text-[var(--color-text-soft)] italic">No skills extracted</span>}
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {activeTab === 'RESUME' && (
                                    <div className="h-[800px] flex flex-col animate-fade-in">
                                        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-neutral-50)]">
                                            <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-dark)]">
                                                <FileTextIcon className="w-4 h-4 text-[var(--color-text-soft)]" />
                                                Parsed Resume Content
                                            </div>
                                            <a 
                                                href={getResumeUrl(app.candidate.resumeS3Key)} 
                                                target="_blank"
                                                download
                                                className="btn-ghost text-xs flex items-center gap-2"
                                            >
                                                <DownloadIcon className="w-3.5 h-3.5" /> Download Original
                                            </a>
                                        </div>
                                        <div className="flex-1 p-8 overflow-y-auto bg-white">
                                            <pre className="font-mono text-xs text-[var(--color-text-dark)] whitespace-pre-wrap leading-relaxed">
                                                {app.candidate.resumeText || "No text content available."}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Sidebar Actions & Comments */}
                        <div className="lg:col-span-1 space-y-6">
                            
                            {/* Quick Actions Card */}
                            <div className="bg-white p-6 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm">
                                <h3 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    {app.status === 'INTERVIEW' && (
                                        <Link 
                                            href={`/applications/${app.id}/interview`} 
                                            className="btn-primary w-full flex justify-center shadow-[var(--shadow-glow)]"
                                        >
                                            Start Interview Session
                                        </Link>
                                    )}
                                    {app.status === 'OFFER' && (
                                        <Link 
                                            href="/offers" 
                                            className="btn-primary w-full flex justify-center shadow-[var(--shadow-glow)]"
                                        >
                                            Create Offer Letter
                                        </Link>
                                    )}
                                    <a 
                                        href={`mailto:${app.candidate.email}`} 
                                        className="btn-secondary w-full flex justify-center"
                                    >
                                        Email Candidate
                                    </a>
                                </div>
                            </div>

                            {/* Comment Section Component */}
                            <div className="h-[500px] bg-white rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm overflow-hidden">
                                <CommentSection applicationId={app.id} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}