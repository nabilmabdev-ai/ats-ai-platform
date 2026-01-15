'use client';

import { useState, useRef } from 'react';
import { useSWRConfig } from 'swr';
import { XIcon } from '@/components/ui/Icons'; // Assuming generic icons exist or will mock
import { useAuth } from '@/components/AuthProvider';

interface AddCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddCandidateModal({ isOpen, onClose }: AddCandidateModalProps) {
    const { user } = useAuth();
    const { mutate } = useSWRConfig();
    const [activeTab, setActiveTab] = useState<'MANUAL' | 'RESUME'>('RESUME');
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    // Manual Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        linkedinUrl: '',
        location: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Failed to create candidate');

            await mutate((key) => typeof key === 'string' && key.startsWith(`${process.env.NEXT_PUBLIC_API_URL}/candidates`));
            onClose();
        } catch (err) {
            alert('Failed to create candidate');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResumeUpload = async () => {
        if (!file) return;
        setLoading(true);

        // REVISED STRATEGY: 
        // We will use a mixed form. "Upload Resume (Optional)" + Essential Fields.
        // If resume is present, we send as multipart.

        try {
            const uploadPayload = new FormData();
            if (file) uploadPayload.append('resume', file);
            uploadPayload.append('firstName', formData.firstName);
            uploadPayload.append('lastName', formData.lastName);
            uploadPayload.append('email', formData.email);
            if (formData.phone) uploadPayload.append('phone', formData.phone);
            if (formData.linkedinUrl) uploadPayload.append('linkedinUrl', formData.linkedinUrl);

            const url = file
                ? `${process.env.NEXT_PUBLIC_API_URL}/candidates/upload`
                : `${process.env.NEXT_PUBLIC_API_URL}/candidates`;

            const headers: Record<string, string> = {};
            // Fetch handles Content-Type for FormData automatically (boundary), so don't set it for file upload
            if (!file) headers['Content-Type'] = 'application/json';

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: file ? uploadPayload : JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to create');

            await mutate((key) => typeof key === 'string' && key.startsWith(`${process.env.NEXT_PUBLIC_API_URL}/candidates`));
            onClose();
        } catch (err) {
            alert('Error creating candidate. Email might be duplicate.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                    <h2 className="text-xl font-bold text-[var(--color-text-dark)]">Add Candidate</h2>
                    <button onClick={onClose} className="text-[var(--color-text-soft)] hover:text-[var(--color-error)] transition-colors">
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Tabs */}
                    <div className="flex gap-4 mb-6 border-b border-[var(--color-border)]">
                        <button
                            onClick={() => setActiveTab('RESUME')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'RESUME' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-soft)]'}`}
                        >
                            Resume Upload
                        </button>
                        <button
                            onClick={() => setActiveTab('MANUAL')}
                            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'MANUAL' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-soft)]'}`}
                        >
                            Manual Entry
                        </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleResumeUpload(); }} className="space-y-4">

                        {activeTab === 'RESUME' && (
                            <div
                                className="border-2 border-dashed border-[var(--color-border)] rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--color-neutral-50)] transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <div className="w-12 h-12 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                </div>
                                {file ? (
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-[var(--color-text-dark)]">{file.name}</p>
                                        <p className="text-xs text-[var(--color-text-soft)]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-[var(--color-text-dark)]">Click to upload resume</p>
                                        <p className="text-xs text-[var(--color-text-soft)]">PDF or Word (Max 10MB)</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1">First Name *</label>
                                <input required type="text" className="w-full input-field" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1">Last Name *</label>
                                <input required type="text" className="w-full input-field" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1">Email *</label>
                            <input required type="email" className="w-full input-field" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>

                        {activeTab === 'MANUAL' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1">Phone</label>
                                        <input type="tel" className="w-full input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1">Location</label>
                                        <input type="text" className="w-full input-field" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-1">LinkedIn URL</label>
                                    <input type="url" className="w-full input-field" value={formData.linkedinUrl} onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })} />
                                </div>
                            </>
                        )}

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {loading ? 'Creating...' : 'Create Candidate'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
