/* eslint-disable react-hooks/refs */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Application } from '../dashboard/PipelineBoard';
import MergeCandidateModal from './MergeCandidateModal';

interface CandidateCardProps {
    app: Application;
    provided: DraggableProvided;
    snapshot: DraggableStateSnapshot;
}

const Avatar = ({ name }: { name: string }) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = [
        'bg-pink-200',
        'bg-blue-200',
        'bg-violet-200',
        'bg-emerald-200',
        'bg-amber-200',
        'bg-rose-200',
        'bg-cyan-200'
    ];
    // Use a simple hash to pick a consistent color
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorClass = colors[hash % colors.length];

    return (
        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-medium text-sm text-[var(--color-text-dark)] ${colorClass}`}>
            {initials}
        </div>
    );
};

const MatchBadge = ({ score }: { score: number }) => {
    // If score is > 1 (e.g. 85), assume it's already a percentage.
    // If it's < 1 (e.g. 0.85), multiply by 100.
    const percentage = score > 1 ? Math.round(score) : Math.round(score * 100);

    let colorClass = 'bg-gray-100 text-gray-700';

    if (percentage >= 70) colorClass = 'bg-green-400/10 text-green-700 border border-green-400/20';
    else if (percentage >= 40) colorClass = 'bg-yellow-400/10 text-yellow-700 border border-yellow-400/20';
    else colorClass = 'bg-red-400/10 text-red-600 border border-red-400/20';

    return (
        <div className={`rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-bold ${colorClass}`}>
            {percentage}% Match
        </div>
    );
};

export default function CandidateCard({ app, provided, snapshot }: CandidateCardProps) {
    const { candidate, aiScore, job, aiSummary, status } = app;
    const fullName = `${candidate.firstName} ${candidate.lastName}`;

    const [showMergeModal, setShowMergeModal] = useState(false);

    return (
        <>
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                style={provided.draggableProps.style}
                className={`
                cursor-grab rounded-xl border bg-white p-3 transition-all duration-300
                shadow-sm hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)]/20
                group hover:scale-[1.02] hover:-translate-y-1
                ${snapshot.isDragging
                        ? 'border-[var(--color-primary)] shadow-xl rotate-2 z-50'
                        : 'border-gray-200/80'
                    }
            `}
            >
                <div className="flex items-start justify-between mb-3">
                    <Avatar name={fullName} />
                    <MatchBadge score={aiScore} />
                </div>

                <div className="mb-3">
                    {/* Clicking name goes to Application Details */}
                    <Link href={`/applications/${app.id}`} className="block group">
                        <p className="font-bold text-[#1A1B25] group-hover:text-[var(--color-primary)] transition-colors">
                            {fullName}
                        </p>
                    </Link>
                    <p className="text-xs text-gray-700 font-medium truncate mt-0.5">
                        {job.title}
                    </p>
                </div>

                {aiSummary && (
                    <div className="rounded-lg bg-gray-50 p-2.5 text-sm text-gray-600 leading-relaxed border border-gray-100">
                        <span className="font-semibold text-[10px] text-gray-400 uppercase tracking-wide block mb-1">AI Insight</span>
                        {aiSummary.length > 80 ? aiSummary.substring(0, 80) + '...' : aiSummary}
                    </div>
                )}

                <div className="mt-3 flex justify-end gap-2">
                    {/* Merge Button */}
                    <button
                        onClick={() => setShowMergeModal(true)}
                        className="rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-[var(--color-text-soft)] hover:bg-[var(--color-neutral-100)] transition-colors"
                        title="Merge Candidate"
                    >
                        Merge
                    </button>

                    {/* Specific action button if in INTERVIEW stage */}
                    {status === 'INTERVIEW' ? (
                        <Link
                            href={`/applications/${app.id}/interview`}
                            className="rounded-md px-3 py-1.5 text-xs font-bold text-white bg-[var(--color-primary)] shadow-[var(--shadow-glow)] hover:bg-[var(--color-primary-hover)] transition-colors"
                        >
                            Start Interview
                        </Link>
                    ) : (
                        /* Default Action: View Application Details */
                        <Link
                            href={`/applications/${app.id}`}
                            className="rounded-md px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-[var(--color-text-soft)] hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            View Details
                        </Link>
                    )}
                </div>
            </div>

            {showMergeModal && (
                <MergeCandidateModal
                    primaryCandidate={candidate}
                    onClose={() => setShowMergeModal(false)}
                    onMergeSuccess={() => {
                        // Ideally refresh the board, but for now just close
                        window.location.reload();
                    }}
                />
            )}
        </>
    );
}