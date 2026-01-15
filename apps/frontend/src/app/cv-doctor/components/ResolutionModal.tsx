'use client';

import { useState } from 'react';
import { DuplicateGroup, Candidate } from '../types';
import { BriefcaseIcon, UsersIcon, SparkleIcon } from '@/components/ui/Icons';

interface Props {
    group: DuplicateGroup;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ResolutionModal({ group, onClose, onSuccess }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [primaryId, setPrimaryId] = useState<string>(group.members[0].candidateId || group.members[0].candidate.id);

    const candidateA = group.members[0].candidate;
    const candidateB = group.members[1]?.candidate || candidateA;

    const isAPrimary = primaryId === candidateA.id;
    const targetCandidate = isAPrimary ? candidateA : candidateB;
    const sourceCandidate = isAPrimary ? candidateB : candidateA;

    const handleResolve = async (action: 'MERGE' | 'IGNORE') => {
        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deduplication/groups/${group.id}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    primaryCandidateId: action === 'MERGE' ? primaryId : undefined
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Resolution failed');
            }
            onSuccess();
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Failed to resolve group');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-gray-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <BriefcaseIcon className="w-5 h-5 text-gray-500" />
                            Resolve Duplicate Profile
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Select the primary profile to keep. Logic will move all history to the Primary.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                        ✕
                    </button>
                </div>

                {/* Split View Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                    <div className="flex items-stretch gap-6 h-full">
                        {/* Candidate A */}
                        <CandidateColumn
                            candidate={candidateA}
                            isPrimary={isAPrimary}
                            onSelect={() => setPrimaryId(candidateA.id)}
                        />

                        {/* Directional Arrow */}
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 w-24 shrink-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Merge Into</span>
                            <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 text-[var(--color-primary)]">
                                {isAPrimary ? (
                                    <svg className="w-8 h-8 rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                ) : (
                                    <svg className="w-8 h-8 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                )}
                            </div>
                        </div>

                        {/* Candidate B */}
                        <CandidateColumn
                            candidate={candidateB}
                            isPrimary={!isAPrimary}
                            onSelect={() => setPrimaryId(candidateB.id)}
                        />
                    </div>
                </div>

                {/* Merge Summary & Footer */}
                <div className="bg-white border-t border-gray-100">
                    <div className="px-8 py-3 bg-[var(--color-primary)]/5 border-b border-[var(--color-primary)]/10 flex items-center justify-center gap-2 text-sm text-[var(--color-primary-dark)]">
                        <SparkleIcon className="w-4 h-4" />
                        <span>
                            Processing merge will move
                            <span className="font-bold mx-1">{sourceCandidate.applications?.length || 0} Applications</span>
                            from {sourceCandidate.firstName} to {targetCandidate.firstName}.
                            {sourceCandidate.firstName} will be archived.
                        </span>
                    </div>

                    <div className="px-6 py-4 flex justify-between items-center">
                        <button
                            onClick={() => handleResolve('IGNORE')}
                            className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition"
                            disabled={submitting}
                        >
                            Not a duplicate
                        </button>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition">
                                Cancel
                            </button>
                            <button
                                onClick={() => handleResolve('MERGE')}
                                className="px-8 py-2.5 bg-[var(--color-primary)] text-white font-bold rounded-lg shadow-lg hover:shadow-[var(--color-primary)]/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                disabled={submitting}
                            >
                                {submitting ? 'Merging Profiles...' : 'Confirm Merge'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CandidateColumn({ candidate, isPrimary, onSelect }: { candidate: Candidate, isPrimary: boolean, onSelect: () => void }) {
    if (!candidate) return <div className="flex-1 p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">No Data</div>;

    return (
        <div
            className={`flex-1 relative p-6 rounded-2xl border-2 transition-all cursor-pointer bg-white group ${isPrimary ? 'border-[var(--color-primary)] shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.1)]' : 'border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100'}`}
            onClick={onSelect}
        >
            {isPrimary ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--color-primary)] text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <SparkleIcon className="w-3 h-3" /> Primary Target
                </div>
            ) : (
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/0 transition-all flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold transform translate-y-4 group-hover:translate-y-0 transition-all">Click to set as Primary</span>
                </div>
            )}

            {/* Header */}
            <div className="text-center mb-6 mt-2">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-400 mb-3">
                    {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{candidate.firstName} {candidate.lastName}</h3>
                <p className="text-gray-500 text-sm">{candidate.email}</p>
                <p className="text-gray-400 text-sm mt-1">{candidate.phone || 'No Phone'}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-gray-800">{candidate.applications?.length || 0}</span>
                    <span className="text-xs text-gray-500 uppercase font-bold">Apps</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <span className="block text-2xl font-bold text-gray-800">{candidate.linkedinUrl ? 'Yes' : 'No'}</span>
                    <span className="text-xs text-gray-500 uppercase font-bold">LinkedIn</span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                <div className="text-xs font-bold text-gray-400 uppercase">Recent Activity</div>
                {candidate.applications?.slice(0, 3).map(app => (
                    <div key={app.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-white text-sm">
                        <span className="text-gray-600 truncate max-w-[120px]">Job ID: {app.jobId.substring(0, 8)}...</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${app.status === 'HIRED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{app.status}</span>
                    </div>
                ))}
                {(!candidate.applications || candidate.applications.length === 0) && (
                    <div className="text-center py-4 text-sm text-gray-400 italic">No applications</div>
                )}
            </div>
        </div>
    );
}
