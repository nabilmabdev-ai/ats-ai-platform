// apps/frontend/src/app/applications/[id]/page.tsx

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import OfferManager from '../../components/OfferManager';
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
        applications: {
            id: string;
            status: string;
            createdAt: string;
            job: { id: string; title: string };
        }[];
        exclusionsA?: { candidateB: { id: string; firstName: string; lastName: string; email: string } }[];
        exclusionsB?: { candidateA: { id: string; firstName: string; lastName: string; email: string } }[];
    };
    job: {
        id: string;
        title: string;
        department: string;
    };
    coverLetterS3Key?: string | null;
    aiParsingData?: {
        skills?: string[];
        education_level?: string;
        screening?: {
            pros?: string[];
            cons?: string[];
            match_score?: number;
            screening_summary?: string;
        };
    };
    metadata?: {
        languages?: string[];
        preferences?: {
            type?: string;
            location_pref?: string;
            comm_lang?: string;
        };
        demographics?: {
            country_province?: string;
            work_eligibility?: string;
        };
        sourcing?: {
            channel?: string;
            detail?: string;
        };
    };
    owner?: {
        id: string;
        fullName: string;
    };
};

import UserSelect from '@/components/UserSelect';

const STATUS_STEPS = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];

export default function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const appId = resolvedParams.id;
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RESUME' | 'METADATA' | 'OFFER'>('OVERVIEW');

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
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${isCompleted
                                                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-[var(--shadow-glow)]'
                                                : 'bg-white border-[var(--color-neutral-300)] text-[var(--color-neutral-300)]'
                                                } ${isCurrent ? 'ring-4 ring-[var(--color-primary)]/20 scale-110' : ''}`}>
                                                {isCompleted && <CheckIcon className="w-4 h-4" />}
                                            </div>
                                            <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${isCurrent ? 'text-[var(--color-primary)]' : isCompleted ? 'text-[var(--color-text-dark)]' : 'text-[var(--color-text-soft)]'
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
                                    className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'OVERVIEW'
                                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                        : 'border-transparent text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]'
                                        }`}
                                >
                                    Overview & AI Analysis
                                </button>
                                <button
                                    onClick={() => setActiveTab('RESUME')}
                                    className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'RESUME'
                                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                        : 'border-transparent text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]'
                                        }`}
                                >
                                    Resume Preview
                                </button>
                                {app.metadata && (
                                    <button
                                        onClick={() => setActiveTab('METADATA')}
                                        className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'METADATA'
                                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                            : 'border-transparent text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]'
                                            }`}
                                    >
                                        Additional Info
                                    </button>
                                )}
                                {app.status === 'OFFER' && (
                                    <button
                                        onClick={() => setActiveTab('OFFER')}
                                        className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'OFFER'
                                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                            : 'border-transparent text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]'
                                            }`}
                                    >
                                        Offer Management
                                    </button>
                                )}
                            </div>

                            {/* Tab Content */}
                            <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm min-h-[500px] overflow-hidden">
                                {activeTab === 'OFFER' && (
                                    <div className="p-8 h-full">
                                        <OfferManager
                                            applicationId={app.id}
                                            candidateName={`${app.candidate.firstName} ${app.candidate.lastName}`}
                                            jobTitle={app.job.title}
                                            onStatusChange={() => {
                                                // Optional: refresh app or show notification
                                                console.log('Offer status changed');
                                            }}
                                        />
                                    </div>
                                )}
                                {activeTab === 'OVERVIEW' && (
                                    <div className="p-8 space-y-8 animate-fade-in">

                                        {/* AI Executive Summary */}
                                        <div className="bg-gradient-to-br from-[var(--color-secondary-blue)]/10 to-[var(--color-secondary-lilac)]/10 rounded-[var(--radius-lg)] p-6 border border-[var(--color-secondary-blue)]/20">
                                            <h3 className="text-xs font-bold text-[var(--color-info-text)] uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <span className="text-lg">✨</span> AI Executive Summary
                                            </h3>
                                            <p className="text-sm text-[var(--color-text-dark)] leading-relaxed">
                                                {app.aiSummary || "No summary generated yet. This candidate is waiting for processing."}
                                            </p>
                                        </div>

                                        {/* Quick Actions Grid */}

                                        {/* Pros & Cons Analysis */}
                                        {(app.aiParsingData?.screening?.pros?.length || app.aiParsingData?.screening?.cons?.length) ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Pros */}
                                                <div className="bg-green-50/50 rounded-[var(--radius-lg)] p-6 border border-green-100">
                                                    <h3 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <span className="text-lg">👍</span> Key Strengths
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {app.aiParsingData?.screening?.pros?.map((pro, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-green-900">
                                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 shrink-0"></span>
                                                                <span className="leading-relaxed">{pro}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Cons */}
                                                <div className="bg-red-50/50 rounded-[var(--radius-lg)] p-6 border border-red-100">
                                                    <h3 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <span className="text-lg">👎</span> Areas of Concern
                                                    </h3>
                                                    <ul className="space-y-2">
                                                        {app.aiParsingData?.screening?.cons?.map((con, i) => (
                                                            <li key={i} className="flex items-start gap-2 text-sm text-red-900">
                                                                <span className="mt-1.5 w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                                                                <span className="leading-relaxed">{con}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ) : null}

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
                                            <div className="flex items-center gap-3">
                                                {app.coverLetterS3Key && (
                                                    <a
                                                        href={getResumeUrl(app.coverLetterS3Key)}
                                                        target="_blank"
                                                        download
                                                        className="btn-ghost text-xs flex items-center gap-2 text-[var(--color-primary)] bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20"
                                                    >
                                                        <FileTextIcon className="w-3.5 h-3.5" /> Download Cover Letter
                                                    </a>
                                                )}
                                                <a
                                                    href={getResumeUrl(app.candidate.resumeS3Key)}
                                                    target="_blank"
                                                    download
                                                    className="btn-ghost text-xs flex items-center gap-2"
                                                >
                                                    <DownloadIcon className="w-3.5 h-3.5" /> Download Resume
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-8 overflow-y-auto bg-white">
                                            <pre className="font-mono text-xs text-[var(--color-text-dark)] whitespace-pre-wrap leading-relaxed">
                                                {app.candidate.resumeText || "No text content available."}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'METADATA' && app.metadata && (
                                    <div className="p-8 space-y-8 animate-fade-in">
                                        {/* Languages */}
                                        {app.metadata.languages && app.metadata.languages.length > 0 && (
                                            <div>
                                                <h4 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest mb-4 border-b border-[var(--color-border)] pb-2">Languages</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {app.metadata.languages.map((lang, i) => (
                                                        <span key={i} className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                                            {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Preferences */}
                                        {app.metadata.preferences && (
                                            <div>
                                                <h4 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest mb-4 border-b border-[var(--color-border)] pb-2">Preferences</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Work Type</span>
                                                        <span className="text-sm font-medium text-gray-900">{app.metadata.preferences.type || 'N/A'}</span>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Preferred Location</span>
                                                        <span className="text-sm font-medium text-gray-900">{app.metadata.preferences.location_pref || 'N/A'}</span>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Communication Language</span>
                                                        <span className="text-sm font-medium text-gray-900">{app.metadata.preferences.comm_lang || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Demographics */}
                                        {app.metadata.demographics && (
                                            <div>
                                                <h4 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest mb-4 border-b border-[var(--color-border)] pb-2">Demographics</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Location (Province)</span>
                                                        <span className="text-sm font-medium text-gray-900">{app.metadata.demographics.country_province || 'N/A'}</span>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold block mb-1">Work Eligibility</span>
                                                        <span className="text-sm font-medium text-gray-900">{app.metadata.demographics.work_eligibility || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Sourcing */}
                                        {app.metadata.sourcing && (
                                            <div>
                                                <h4 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest mb-4 border-b border-[var(--color-border)] pb-2">Sourcing Source</h4>
                                                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                                    <div>
                                                        <span className="text-xs text-purple-500 uppercase tracking-wider font-bold block mb-1">Channel</span>
                                                        <span className="text-sm font-bold text-purple-900">{app.metadata.sourcing.channel || 'Unknown'}</span>
                                                    </div>
                                                    <div className="h-8 w-px bg-purple-200"></div>
                                                    <div>
                                                        <span className="text-xs text-purple-500 uppercase tracking-wider font-bold block mb-1">Detail</span>
                                                        <span className="text-sm font-medium text-purple-900">{app.metadata.sourcing.detail || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Sidebar Actions & Comments */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Screening Checklist - Only visible in SCREENING status */}
                            {app.status === 'SCREENING' && (
                                <div className="bg-indigo-50/50 p-6 rounded-[var(--radius-xl)] border border-indigo-100 shadow-sm animate-fade-in">
                                    <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="text-lg">📋</span> Screening Checklist
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            "Resume Reviewed",
                                            "Visa Status Confirmed",
                                            "Salary Expectations Checked",
                                            "Notice Period Confirmed",
                                            "Role Fit Assessment"
                                        ].map((item, i) => (
                                            <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-indigo-100/50 transition-colors cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input type="checkbox" className="peer w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                                </div>
                                                <span className="text-sm text-indigo-900 font-medium group-hover:text-indigo-700 transition-colors">{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* [NEW] Application Owner Assignment */}
                            <div className="bg-white p-6 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm">
                                <h3 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest mb-4">Assigned Recruiter</h3>
                                <div className="space-y-2">
                                    <UserSelect
                                        value={app.owner?.id}
                                        role="RECRUITER"
                                        onChange={async (newOwnerId) => {
                                            try {
                                                const token = localStorage.getItem('access_token');
                                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${app.id}/owner`, {
                                                    method: 'PATCH',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: JSON.stringify({ ownerId: newOwnerId })
                                                });
                                                if (res.ok) {
                                                    // Optimistically update or re-fetch
                                                    // For now, let's just update the local state minimally if we had the full user object, 
                                                    // but simple re-fetch is safer or we just update the ID. 
                                                    // Ideally we need the new owner's name for display if UserSelect is uncontrolled-ish 
                                                    // but UserSelect displays based on ID if it fetches internally.
                                                    // Let's re-fetch to be safe and simple.
                                                    const updatedApp = await res.json();
                                                    setApp(prev => prev ? ({ ...prev, owner: updatedApp.owner }) : null);
                                                }
                                            } catch (e) {
                                                console.error("Failed to assign owner", e);
                                                alert("Failed to assign recruiter");
                                            }
                                        }}
                                        placeholder="Assign a Recruiter..."
                                    />
                                    <p className="text-[10px] text-[var(--color-text-soft)]">
                                        This recruiter will be responsible for this application.
                                    </p>
                                </div>
                            </div>

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

                            {/* Candidate History Card */}
                            <div className="bg-white p-6 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm">
                                <h3 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest mb-4">
                                    Application History ({app.candidate.applications.length})
                                </h3>

                                <div className="space-y-3">
                                    {app.candidate.applications.map((historyApp) => {
                                        // Don't link to the current page we are already on, but show it for context
                                        const isCurrent = historyApp.id === app.id;

                                        return (
                                            <div
                                                key={historyApp.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border ${isCurrent ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20' : 'bg-white border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/30 transition-colors'}`}
                                            >
                                                <div className="flex flex-col overflow-hidden">
                                                    {isCurrent ? (
                                                        <span className="text-xs font-bold text-[var(--color-text-dark)] truncate">
                                                            {historyApp.job.title}
                                                            <span className="ml-2 text-[10px] text-[var(--color-primary)] font-normal">(Current)</span>
                                                        </span>
                                                    ) : (
                                                        <Link href={`/applications/${historyApp.id}`} className="text-xs font-bold text-[var(--color-text-dark)] hover:text-[var(--color-primary)] truncate transition-colors">
                                                            {historyApp.job.title}
                                                        </Link>
                                                    )}
                                                    <span className="text-[10px] text-[var(--color-text-soft)] mt-1">
                                                        {new Date(historyApp.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider
                                                    ${historyApp.status === 'HIRED' ? 'bg-green-50 text-green-700 border-green-100' :
                                                        historyApp.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-200'
                                                    }`}>
                                                    {historyApp.status}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* [NEW] Related Profiles (Ignored Duplicates) */}
                            {(() => {
                                const related = [
                                    ...(app.candidate.exclusionsA?.map((e: any) => e.candidateB) || []),
                                    ...(app.candidate.exclusionsB?.map((e: any) => e.candidateA) || [])
                                ];

                                if (related.length === 0) return null;

                                return (
                                    <div className="bg-amber-50/50 p-6 rounded-[var(--radius-xl)] border border-amber-100 shadow-sm animate-fade-in">
                                        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="text-lg">🔗</span> Related Profiles
                                        </h3>
                                        <div className="space-y-3">
                                            {related.map((profile) => (
                                                <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-amber-200/50">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-amber-900">
                                                            {profile.firstName} {profile.lastName}
                                                        </span>
                                                        <span className="text-[10px] text-amber-700/70">{profile.email}</span>
                                                    </div>
                                                    <Link
                                                        href={`/candidates/search?q=${profile.email}`} // Temporary link to search as we don't have a direct profile page yet
                                                        target="_blank"
                                                        className="text-[10px] font-bold text-amber-700 hover:underline"
                                                    >
                                                        VIEW
                                                    </Link>
                                                </div>
                                            ))}
                                            <div className="pt-2 text-[10px] text-amber-700/60 italic leading-snug">
                                                These profiles were marked as "Not a Duplicate" by a recruiter.
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Comment Section Component */}
                            <div className="h-[500px] bg-white rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm overflow-hidden">
                                <CommentSection applicationId={app.id} />
                            </div>
                        </div>
                    </div>
                </div >
            </main >
        </div >
    );
}