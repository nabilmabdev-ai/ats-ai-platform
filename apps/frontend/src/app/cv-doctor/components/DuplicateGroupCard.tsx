'use client';

import { useState } from 'react';
import { DuplicateGroup } from '../types';
import { UsersIcon, SparkleIcon } from '@/components/ui/Icons';
import ResolutionModal from './ResolutionModal';

interface Props {
    group: DuplicateGroup;
    onResolve: (groupId: string) => void;
}

export default function DuplicateGroupCard({ group, onResolve }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const memberCount = group.members.length;
    const primaryName = `${group.members[0].candidate.firstName} ${group.members[0].candidate.lastName}`;
    const secondaryName = memberCount > 1
        ? `${group.members[1].candidate.firstName} ${group.members[1].candidate.lastName}`
        : 'Unknown';

    // Strategy deduction (just UI display)
    const strategy = group.members[1]?.matchReason?.strategy || 'AI Matching';

    return (
        <>
            <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Icon Badge */}
                    <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                        <UsersIcon className="w-6 h-6" />
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-[var(--color-text-dark)]">
                            {primaryName} <span className="text-gray-400 font-normal mx-2">&harr;</span> {secondaryName}
                            {memberCount > 2 && <span className="text-xs ml-2 bg-gray-100 px-2 py-0.5 rounded text-gray-600">+{memberCount - 2} more</span>}
                        </h3>
                        <p className="text-sm text-[var(--color-text-soft)] flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                {strategy}
                            </span>
                            <span className="text-gray-400">&bull;</span>
                            <span>Detected {new Date(group.createdAt).toLocaleDateString()}</span>
                        </p>
                    </div>
                </div>

                <div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-2.5 bg-[var(--color-primary)] text-white text-sm font-bold rounded-lg shadow hover:bg-[var(--color-primary-hover)] transition-all flex items-center gap-2"
                    >
                        Review & Resolve
                    </button>
                </div>
            </div>

            {isModalOpen && (
                <ResolutionModal
                    group={group}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        onResolve(group.id);
                    }}
                />
            )}
        </>
    );
}
