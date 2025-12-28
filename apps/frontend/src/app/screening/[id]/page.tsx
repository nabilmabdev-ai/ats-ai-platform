'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
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
}

export default function ScreeningPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const appId = resolvedParams.id;
    const [app, setApp] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [activeDocument, setActiveDocument] = useState<'RESUME' | 'COVER_LETTER'>('RESUME');

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
        let cleanPath = path.trim();
        // Remove surrounding quotes if present
        cleanPath = cleanPath.replace(/^["']|["']$/g, '');

        if (cleanPath.match(/^https?:\/\//i)) return cleanPath;

        return `${process.env.NEXT_PUBLIC_API_URL}/${cleanPath.replace(/\\/g, '/')}`;
    };

    const scoreColorStyles = (score: number) => {
        if (score >= 0.8) return 'bg-[var(--color-success)]/10 text-[var(--color-success-text)] border-[var(--color-success)]/20';
        if (score >= 0.5) return 'bg-[var(--color-warning)]/10 text-[var(--color-warning-text)] border-[var(--color-warning)]/20';
        return 'bg-[var(--color-error)]/10 text-[var(--color-error-text)] border-[var(--color-error)]/20';
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
            <div className="w-10 h-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[var(--color-text-soft)]">Loading Screening View...</p>
        </div>
    );

    if (!app) return (
        <div className="min-h-screen flex items-center justify-center text-[var(--color-text-soft)]">
            Application not found
        </div>
    );

    const isRejected = app.status === 'REJECTED';

    return (
        <div className="flex flex-col h-screen bg-[var(--color-background)] font-sans">
            {/* Header */}
            <header className="sticky top-0 z-20 h-16 w-full bg-white border-b border-[var(--color-border)] px-6 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="group flex items-center gap-2 text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider hover:text-[var(--color-text-dark)] transition-colors">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Back
                    </Link>
                    <div className="h-6 w-px bg-[var(--color-border)]"></div>
                    <div>
                        <h1 className="text-base font-bold text-[var(--color-text-dark)] leading-tight">
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
                                className="btn-secondary text-[var(--color-error-text)] hover:text-[var(--color-error-text)] hover:bg-[var(--color-error)]/5 hover:border-[var(--color-error)]/30 text-xs px-4 py-2"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleStatusChange('INTERVIEW')}
                                disabled={updating}
                                className="btn-primary flex items-center gap-2 text-xs px-4 py-2"
                            >
                                <span>Move to Interview</span>
                                <ArrowRightIcon className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Main Content - Split View */}
            <main className="flex-1 overflow-hidden flex">
                {/* Left: Document Viewer (60%) */}
                <div className="w-[60%] border-r border-[var(--color-border)] bg-[var(--color-neutral-50)] flex flex-col">
                    <div className="flex justify-between items-center px-6 py-3 border-b border-[var(--color-border)] bg-white">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setActiveDocument('RESUME')}
                                className={`flex items-center gap-2 text-sm font-bold pb-1 border-b-2 transition-colors ${activeDocument === 'RESUME'
                                    ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
                                    : 'text-[var(--color-text-soft)] border-transparent hover:text-[var(--color-text-dark)]'
                                    }`}
                            >
                                <FileTextIcon className="w-4 h-4" />
                                Resume
                            </button>
                            {app.coverLetterS3Key && (
                                <button
                                    onClick={() => setActiveDocument('COVER_LETTER')}
                                    className={`flex items-center gap-2 text-sm font-bold pb-1 border-b-2 transition-colors ${activeDocument === 'COVER_LETTER'
                                        ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
                                        : 'text-[var(--color-text-soft)] border-transparent hover:text-[var(--color-text-dark)]'
                                        }`}
                                >
                                    <FileTextIcon className="w-4 h-4" />
                                    Cover Letter
                                </button>
                            )}
                        </div>
                        <a
                            href={getResumeUrl(activeDocument === 'RESUME' ? app.candidate.resumeS3Key : (app.coverLetterS3Key || null))}
                            target="_blank"
                            download
                            className="btn-ghost text-xs flex items-center gap-2"
                        >
                            <DownloadIcon className="w-3.5 h-3.5" /> Download
                        </a>
                    </div>
                    <div className="flex-1 p-8 overflow-y-auto bg-white">
                        {activeDocument === 'RESUME' ? (
                            <pre className="font-mono text-xs text-[var(--color-text-dark)] whitespace-pre-wrap leading-relaxed max-w-3xl mx-auto">
                                {app.candidate.resumeText || "No text content available."}
                            </pre>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-soft)]">
                                <FileTextIcon className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-sm">Cover Letter Preview Not Available</p>
                                <a
                                    href={getResumeUrl(app.coverLetterS3Key || null)}
                                    target="_blank"
                                    className="mt-4 btn-secondary text-xs"
                                >
                                    Download to View
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: AI Insights & Checklist (40%) */}
                <div className="w-[40%] overflow-y-auto bg-[var(--color-background)] p-6 space-y-6">

                    {/* AI Summary */}
                    <div className="bg-white rounded-[var(--radius-xl)] p-6 border border-[var(--color-border-subtle)] shadow-sm">
                        <h3 className="text-xs font-bold text-[var(--color-info-text)] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="text-lg">✨</span> AI Executive Summary
                        </h3>
                        <p className="text-sm text-[var(--color-text-dark)] leading-relaxed font-medium">
                            {app.aiSummary || "No summary generated yet."}
                        </p>
                    </div>

                    {/* Pros & Cons */}
                    {(app.aiParsingData?.screening?.pros?.length || app.aiParsingData?.screening?.cons?.length) ? (
                        <div className="space-y-4">
                            {/* Pros */}
                            <div className="bg-green-50/50 rounded-[var(--radius-xl)] p-6 border border-green-100">
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
                            <div className="bg-red-50/50 rounded-[var(--radius-xl)] p-6 border border-red-100">
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

                    {/* Screening Checklist */}
                    <div className="bg-indigo-50/50 p-6 rounded-[var(--radius-xl)] border border-indigo-100 shadow-sm">
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

                    {/* Contact Info */}
                    <div className="bg-white rounded-[var(--radius-xl)] p-6 border border-[var(--color-border-subtle)] shadow-sm">
                        <h4 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-widest border-b border-[var(--color-border)] pb-2 mb-4">Contact Details</h4>
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

                </div>
            </main>
        </div>
    );
}
