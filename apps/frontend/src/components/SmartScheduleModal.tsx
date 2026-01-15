import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';


interface SmartScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CandidatePreview {
    id: string;
    candidate: {
        firstName: string;
        lastName: string;
        email: string;
    };
    job: {
        title: string;
    };
}

export default function SmartScheduleModal({ isOpen, onClose }: SmartScheduleModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [candidates, setCandidates] = useState<CandidatePreview[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [customMessage, setCustomMessage] = useState('');
    const [result, setResult] = useState<{ totalFound: number; sentCount: number; errors: any[] } | null>(null);


    useEffect(() => {
        if (isOpen) {
            fetchCandidates();
            setResult(null);
        }
    }, [isOpen]);

    const fetchCandidates = async () => {
        setFetching(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/smart-schedule-candidates`);
            const data = await res.json();
            setCandidates(data);
            // Default select all
            setSelectedIds(new Set(data.map((c: any) => c.id)));
        } catch (error) {
            console.error('Failed to fetch candidates:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleRun = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/smart-schedule-run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationIds: Array.from(selectedIds),
                    userId: user?.id,
                    customMessage
                }),
            });
            const data = await res.json();

            setResult(data);
            // Refresh list after run
            if (data.sentCount > 0) {
                fetchCandidates();
            }
        } catch (error) {
            console.error('Failed to run Smart Schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === candidates.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(candidates.map(c => c.id)));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-neutral-50)] shrink-0">
                    <h3 className="text-lg font-semibold text-[var(--color-text-dark)] flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Smart Schedule
                    </h3>
                    <button onClick={onClose} className="text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {!result ? (
                        <>
                            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm border border-blue-100 mb-6">
                                <p className="font-medium mb-1">How it works</p>
                                <p>Select candidates below to automatically send them an interview booking link. Only candidates in the <strong>Interview</strong> stage without an existing invite are shown.</p>
                            </div>

                            {fetching ? (
                                <div className="flex justify-center py-12">
                                    <svg className="animate-spin h-8 w-8 text-[var(--color-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                </div>
                            ) : candidates.length === 0 ? (
                                <div className="text-center py-12 text-[var(--color-text-soft)]">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-[var(--color-neutral-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                                    <p className="font-medium">All caught up!</p>
                                    <p className="text-sm">No candidates need scheduling right now.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium text-[var(--color-text-dark)]">Candidates ({candidates.length})</h4>
                                        <button onClick={toggleAll} className="text-xs font-medium text-[var(--color-primary)] hover:underline">
                                            {selectedIds.size === candidates.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)] max-h-48 overflow-y-auto mb-4">
                                        {candidates.map(c => (
                                            <div key={c.id} className="p-3 flex items-center hover:bg-[var(--color-neutral-50)] transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(c.id)}
                                                    onChange={() => toggleSelection(c.id)}
                                                    className="w-4 h-4 text-[var(--color-primary)] rounded border-[var(--color-border)] focus:ring-[var(--color-primary)]"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="text-sm font-medium text-[var(--color-text-dark)]">{c.candidate.firstName} {c.candidate.lastName}</div>
                                                    <div className="text-xs text-[var(--color-text-soft)]">{c.job.title} • {c.candidate.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-2">Email Preview</label>
                                        <div className="bg-white border border-[var(--color-border)] rounded-lg p-4 text-sm text-[var(--color-text-dark)] shadow-sm">
                                            <div className="border-b border-gray-100 pb-2 mb-2">
                                                <span className="text-gray-500">Subject:</span> <span className="font-medium">Interview Invitation: [Job Title]</span>
                                            </div>
                                            <div className="space-y-2 text-gray-600">
                                                <p>Hi [Candidate Name],</p>
                                                {customMessage ? (
                                                    <p className="p-2 bg-blue-50 border-l-2 border-blue-400 italic text-blue-900 my-2 rounded-r">
                                                        "{customMessage}"
                                                    </p>
                                                ) : (
                                                    <p className="text-gray-400 italic">[Your custom message will appear here]</p>
                                                )}
                                                <p>We've reviewed your profile and would like to invite you to an interview.</p>
                                                <p>Please book your interview here: <span className="text-blue-600 underline font-medium cursor-pointer">Select Interview Time</span></p>
                                                <p className="pt-2 text-xs text-gray-400">Best regards,<br />The Hiring Team</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-dark)] mb-1">Custom Message (Optional)</label>
                                        <textarea
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                            placeholder="e.g. 'I was impressed by your portfolio...'"
                                            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                            rows={2}
                                        />
                                    </div>
                                </>
                            )}

                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg text-sm border ${result.sentCount > 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-[var(--color-neutral-50)] text-[var(--color-text-dark)] border-[var(--color-border)]'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {result.sentCount > 0 ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 11 18 0z" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-[var(--color-text-soft)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 11 18 0z" /></svg>
                                    )}
                                    <span className="font-bold text-base">{result.sentCount} Invites Sent</span>
                                </div>
                                <p>Processed {result.totalFound} candidates.</p>
                            </div>

                            {result.errors.length > 0 && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs border border-red-100 max-h-32 overflow-y-auto">
                                    <p className="font-bold mb-1">Errors ({result.errors.length})</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        {result.errors.map((e, i) => (
                                            <li key={i}>App ID {e.applicationId}: {e.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-neutral-50)] flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="btn-secondary text-sm">
                        {result ? 'Close' : 'Cancel'}
                    </button>
                    {!result && candidates.length > 0 && (
                        <button
                            onClick={handleRun}
                            disabled={loading || selectedIds.size === 0}
                            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Sending...
                                </>
                            ) : (
                                <>Send {selectedIds.size} Invites</>
                            )}
                        </button>
                    )}
                </div>
            </div >
        </div >
    );
}
