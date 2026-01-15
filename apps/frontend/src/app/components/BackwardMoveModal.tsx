'use client';

import { useState } from 'react';
import { AlertTriangle, X, ArrowRight, ShieldAlert } from 'lucide-react';

interface BackwardMoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, notes: string) => Promise<void>;
    fromStatus: string;
    toStatus: string;
    loading: boolean;
}

const REASONS = [
    'Interview incomplete',
    'Needs additional screening',
    'Process correction',
    'Candidate requested reschedule',
    'Offer fell through',
    'Mistakenly advanced',
    'Other'
];

export default function BackwardMoveModal({
    isOpen,
    onClose,
    onConfirm,
    fromStatus,
    toStatus,
    loading
}: BackwardMoveModalProps) {
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onConfirm(reason, notes);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header - Warning Style */}
                <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex justify-between items-start">
                    <div className="flex gap-3">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600 mt-1">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-amber-900">Move Candidate Backward?</h2>
                            <p className="text-xs text-amber-700 mt-1">
                                Moving back triggers system side-effects.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-amber-500 hover:text-amber-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Status Change Visualization */}
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-sm font-medium">
                        <span className="text-gray-500 line-through">{fromStatus}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="text-amber-600 font-bold">{toStatus}</span>
                    </div>

                    {/* Side Effects Warning */}
                    <div className="mb-6 p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-100 flex gap-2">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        <div>
                            <strong>System Action:</strong>
                            <ul className="list-disc list-inside mt-1 ml-1 space-y-0.5 opacity-90">
                                {fromStatus === 'INTERVIEW' && <li>Pending interviews will be cancelled.</li>}
                                {fromStatus === 'OFFER' && <li>Active offers will be marked as void/failed.</li>}
                                {toStatus === 'APPLIED' && <li>Evaluations may be reset or archived.</li>}
                                <li>Audit log entry will be created.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Reason for Backward Move <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm"
                            >
                                <option value="">Select a reason...</option>
                                {REASONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm resize-none"
                                placeholder="Add context for the team..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !reason}
                            className="px-4 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm shadow-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? 'Processing...' : 'Confirm Move'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
