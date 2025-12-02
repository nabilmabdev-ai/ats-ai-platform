// --- Content from: apps/frontend/src/components/jobs/builder/JobInputPanel.tsx ---

import React from 'react';
import { SparkleIcon } from '@/components/ui/Icons';

interface JobTemplate {
    id: string;
    name: string;
}

interface KnockoutQuestion {
    text: string;
    correctAnswer: 'Yes' | 'No';
}

interface JobInputPanelProps {
    title: string;
    setTitle: (value: string) => void;
    notes: string;
    setNotes: (value: string) => void;
    region: string;
    setRegion: (value: string) => void;
    selectedTemplate: JobTemplate | null;
    onOpenTemplateModal: () => void;
    onGenerate: () => void;
    isGenerating: boolean;
    errors: Record<string, string>;
    koQuestions: KnockoutQuestion[];
    addKoQuestion: () => void;
    removeKoQuestion: (index: number) => void;
    updateKoQuestion: (index: number, field: string, value: string) => void;
    tone: string;
    setTone: (value: string) => void;
}

export default function JobInputPanel({
    title, setTitle,
    notes, setNotes,
    region, setRegion,
    selectedTemplate, onOpenTemplateModal,
    onGenerate, isGenerating,
    errors,
    koQuestions, addKoQuestion, removeKoQuestion, updateKoQuestion,
    tone, setTone
}: JobInputPanelProps) {
    return (
        <div className="flex flex-col gap-8 p-8">

            {/* Section 1: Job Details */}
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-[var(--color-text-dark)] leading-tight tracking-tight">Job Details</h3>
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col w-full gap-2">
                        <span className="text-[var(--color-text-soft)] text-base font-medium leading-normal">Job Title</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`flex w-full resize-none overflow-hidden rounded-lg border border-[var(--color-border)] bg-white h-14 px-4 text-base font-normal text-[var(--color-text-dark)] placeholder:text-[var(--color-text-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all ${errors.title ? 'border-[var(--color-error)]' : ''}`}
                            placeholder="e.g. Senior Product Designer"
                        />
                        {errors.title && <p className="text-[var(--color-error)] text-xs">{errors.title}</p>}
                    </label>

                    <div className="flex flex-col gap-2">
                        <p className="text-[var(--color-text-soft)] text-base font-medium leading-normal">Region</p>
                        <div className="relative w-full">
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="flex w-full appearance-none overflow-hidden rounded-lg border border-[var(--color-border)] bg-white h-14 px-4 pr-10 text-base font-normal text-[var(--color-text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all cursor-pointer"
                            >
                                <option value="FR">🇫🇷 France</option>
                                <option value="MA">🇲🇦 Morocco</option>
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--color-text-soft)]">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2: AI Configuration */}
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-[var(--color-text-dark)] leading-tight tracking-tight">AI Configuration</h3>
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col w-full gap-2">
                        <span className="text-[var(--color-text-soft)] text-base font-medium leading-normal">Hiring Context</span>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="flex w-full resize-y overflow-hidden rounded-lg border border-[var(--color-border)] bg-white h-32 px-4 py-3 text-base font-normal text-[var(--color-text-dark)] placeholder:text-[var(--color-text-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all"
                            placeholder="Paste your hiring brief, a similar job description, or just a few bullet points..."
                        />
                    </label>

                    <div className="flex flex-col gap-2">
                        <p className="text-[var(--color-text-soft)] text-base font-medium leading-normal">AI Tone</p>
                        <div className="relative w-full">
                            <select
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="flex w-full appearance-none overflow-hidden rounded-lg border border-[var(--color-border)] bg-white h-14 px-4 pr-10 text-base font-normal text-[var(--color-text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 transition-all cursor-pointer"
                            >
                                <option value="">Default (Inherit)</option>
                                <option value="Professional">Professional</option>
                                <option value="Casual">Casual</option>
                                <option value="Energetic">Energetic</option>
                                <option value="Formal">Formal</option>
                                <option value="Friendly">Friendly</option>
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--color-text-soft)]">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    <div
                        onClick={onOpenTemplateModal}
                        className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-white p-4 cursor-pointer hover:border-[var(--color-primary)] hover:shadow-sm transition-all group"
                    >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 group-hover:bg-[var(--color-primary)]/20 transition-colors">
                            <SparkleIcon className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-[var(--color-text-dark)] font-medium text-sm">
                                {selectedTemplate?.name || 'Auto-Detect Structure'}
                            </p>
                            <p className="text-[var(--color-text-soft)] text-xs">
                                {selectedTemplate ? 'Template Selected' : 'Our AI will automatically structure your input.'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onGenerate}
                        disabled={isGenerating || !title}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] text-white text-base font-bold leading-normal shadow-[var(--shadow-glow)] hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <><span className="animate-spin">✨</span> Generating...</>
                        ) : (
                            <><SparkleIcon className="w-5 h-5" /> Generate Job Description</>
                        )}
                    </button>
                </div>
            </div>

            {/* Section 3: Screening */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--color-text-dark)] leading-tight tracking-tight">Screening</h3>
                    <button
                        onClick={addKoQuestion}
                        className="flex items-center gap-1 text-[var(--color-primary)] text-sm font-bold hover:underline"
                    >
                        <span className="text-lg leading-none">+</span> Add Question
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {koQuestions.length === 0 ? (
                        <div className="p-6 bg-[var(--color-neutral-100)]/50 rounded-xl border border-dashed border-[var(--color-border)] text-center">
                            <div className="mx-auto w-8 h-8 mb-2 text-[var(--color-text-soft)] opacity-50">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <p className="text-sm font-bold text-[var(--color-text-dark)]">No Screening Questions Yet</p>
                            <p className="text-xs text-[var(--color-text-soft)]">Add questions to pre-screen candidates automatically.</p>
                        </div>
                    ) : (
                        koQuestions.map((q, i) => (
                            <div key={i} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                                <input
                                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[var(--color-text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 border border-[var(--color-border)] bg-white h-12 px-4 text-sm font-normal leading-normal"
                                    placeholder="Question"
                                    value={q.text}
                                    onChange={(e) => updateKoQuestion(i, 'text', e.target.value)}
                                />
                                <div className="relative w-32 flex-shrink-0">
                                    <select
                                        className="w-full appearance-none rounded-lg border border-[var(--color-border)] bg-white py-3 pl-4 pr-10 text-sm text-[var(--color-text-dark)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                                        value={q.correctAnswer}
                                        onChange={(e) => updateKoQuestion(i, 'correctAnswer', e.target.value)}
                                    >
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-soft)]">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeKoQuestion(i)}
                                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-text-soft)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-error)] transition-colors"
                                >
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}