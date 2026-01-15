'use client';

import { useState, useRef, useEffect } from 'react';
import { X, User, AlertCircle, Phone, MapPin, Mail, Linkedin, FileText, CheckCircle, Save } from 'lucide-react';

interface Candidate {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    // Add other fields as needed
}

interface EditCandidateModalProps {
    candidate: Candidate;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    onRequestManualMerge?: () => void; // New prop
}

export default function EditCandidateModal({
    candidate,
    isOpen,
    onClose,
    onSuccess,
    onRequestManualMerge,
}: EditCandidateModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Initial Form State
    const [formData, setFormData] = useState({
        firstName: candidate.firstName || '',
        lastName: candidate.lastName || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        linkedinUrl: candidate.linkedinUrl || '',
        location: candidate.location || '',
    });

    // Conflict State
    const [conflictCandidate, setConflictCandidate] = useState<any | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setConflictCandidate(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates/${candidate.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.code === 'DUPLICATE_EMAIL') {
                    setConflictCandidate({
                        id: data.conflictCandidateId,
                        email: formData.email
                    });
                    throw new Error('This email is already used by another candidate.');
                }
                throw new Error(data.message || 'Failed to update candidate');
            }

            setSuccess('Candidate updated successfully!');
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMerge = async () => {
        if (!conflictCandidate) return;
        setLoading(true);
        setError(null);

        try {
            // Merge: Primary = Existing (conflictCandidate), Secondary = Current (candidate.id)
            // Strategy: Keep Primary's email (obviously), but maybe merge other fields?
            // The default strategy in backend is fairly safe.
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates/merge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    primaryId: conflictCandidate.id,
                    secondaryId: candidate.id,
                    strategy: {
                        keepNameFrom: 'primary', // Assume existing record is source of truth? Or user choice?
                        keepResumeFrom: 'primary',
                        keepContactFrom: 'primary'
                    }
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Merge failed');
            }

            setSuccess('Candidates merged successfully! Redirecting...');
            setTimeout(() => {
                onSuccess?.(); // Should probably trigger a reload or navigation
                onClose();
                window.location.reload(); // Force reload to reflect merge (since current candidate might be gone)
            }, 1500);

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Edit Candidate
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Update profile details
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium">{error}</p>
                                {conflictCandidate && (
                                    <div className="mt-2">
                                        <p className="text-xs mb-2">
                                            Do you want to merge this candidate into the existing profile associated with <strong>{conflictCandidate.email}</strong>?
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleMerge}
                                            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 font-bold py-1 px-3 rounded transition-colors"
                                        >
                                            Yes, Merge Candidates
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email Address
                            </label>
                            <input
                                required
                                type="email"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            {formData.email !== candidate.email && (
                                <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Warning: Changing email may affect login and communication history.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Phone
                                </label>
                                <input
                                    type="tel"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Location
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <Linkedin className="w-3 h-3" /> LinkedIn URL
                            </label>
                            <input
                                type="url"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.linkedinUrl}
                                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 flex-shrink-0">
                            {onRequestManualMerge && (
                                <button
                                    type="button"
                                    onClick={onRequestManualMerge}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    Merge with another candidate...
                                </button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || success !== null}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
