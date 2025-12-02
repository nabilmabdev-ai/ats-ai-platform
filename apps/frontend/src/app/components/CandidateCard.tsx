/* eslint-disable react-hooks/refs */
'use client';

import Link from 'next/link';
import { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Application } from '../dashboard/PipelineBoard';

interface CandidateCardProps {
    app: Application;
    provided: DraggableProvided;
    snapshot: DraggableStateSnapshot;
}

const Avatar = ({ name }: { name: string }) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = [
        'bg-purple-100 text-purple-600',
        'bg-orange-100 text-orange-600',
        'bg-teal-100 text-teal-600',
        'bg-pink-100 text-pink-600',
        'bg-indigo-100 text-indigo-600',
        'bg-blue-100 text-blue-600'
    ];
    const colorClass = colors[name.length % colors.length];

    return (
        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm ${colorClass}`}>
            {initials}
        </div>
    );
};

const MatchBadge = ({ score }: { score: number }) => {
    // If score is > 1 (e.g. 85), assume it's already a percentage.
    // If it's < 1 (e.g. 0.85), multiply by 100.
    const percentage = score > 1 ? Math.round(score) : Math.round(score * 100);

    let colorClass = 'bg-gray-100 text-gray-700';

    if (percentage >= 90) colorClass = 'bg-green-100 text-green-700';
    else if (percentage >= 75) colorClass = 'bg-orange-100 text-orange-700';
    else if (percentage < 50) colorClass = 'bg-red-100 text-red-700';

    return (
        <div className={`rounded-full px-3 py-1 text-xs font-bold ${colorClass}`}>
            {percentage}% Match
        </div>
    );
};

export default function CandidateCard({ app, provided, snapshot }: CandidateCardProps) {
    const { candidate, aiScore, job, aiSummary, status } = app;
    const fullName = `${candidate.firstName} ${candidate.lastName}`;

    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={provided.draggableProps.style}
            className={`
                cursor-grab rounded-xl border bg-white p-3 shadow transition-all duration-200
                hover:-translate-y-1 hover:shadow-lg
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
                {/* Specific action button if in INTERVIEW stage */}
                {status === 'INTERVIEW' && (
                    <Link
                        href={`/applications/${app.id}/interview`}
                        className="rounded-md px-3 py-1.5 text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors shadow-sm"
                    >
                        Start Interview
                    </Link>
                )}

                {/* Default Action: View Application Details */}
                <Link
                    href={`/applications/${app.id}`}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
}