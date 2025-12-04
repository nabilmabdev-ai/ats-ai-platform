'use client';

import { useState, useRef } from 'react';
import { X, Upload, UserPlus, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface AddCandidateModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobId?: string; // Optional: if adding to a specific job
    onSuccess?: () => void;
}

export default function AddCandidateModal({
    isOpen,
    onClose,
    jobId,
    onSuccess,
}: AddCandidateModalProps) {
    const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Manual Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        linkedinUrl: '',
        location: '',
    });

    // File Upload State
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, jobId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create candidate');
            }

            setSuccess('Candidate created successfully!');
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file');
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('resume', file);
            if (jobId) data.append('jobId', jobId);
            // We also send basic info if available, but for now just file + jobId
            // If we want to support name/email override during upload, we can add fields here.
            // But typically "Upload Resume" just parses it. 
            // However, our backend createCandidateFromResume is not fully implemented for parsing WITHOUT name/email.
            // Wait, I implemented createCandidate in backend which takes data.
            // And upload endpoint takes file + body.
            // So I should probably ask for at least Email/Name even in Upload tab?
            // Or I should trust the backend to handle it?
            // My backend implementation of `upload` calls `createCandidate` with `...body` and `resumeS3Key`.
            // `createCandidate` REQUIRES `email`, `firstName`, `lastName`.
            // SO: The Upload Tab MUST also ask for Name and Email.

            // Let's add Name/Email fields to Upload Tab as well, or auto-fill them?
            // No, let's just use the same form data for both, but one has file.

            // Actually, let's make the Upload Tab have Name/Email inputs too.
            // Or better: "Quick Apply" style.

            data.append('firstName', formData.firstName);
            data.append('lastName', formData.lastName);
            data.append('email', formData.email);
            if (formData.phone) data.append('phone', formData.phone);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates/upload`, {
                method: 'POST',
                body: data,
            });

            if (!res.ok) {
                const resData = await res.json();
                throw new Error(resData.message || 'Failed to upload candidate');
            }

            setSuccess('Candidate uploaded successfully!');
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                            Add Candidate
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {jobId ? 'Adding to specific job pipeline' : 'Adding to global talent pool'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'upload'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Upload className="w-4 h-4" />
                        Upload Resume
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'manual'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Manual Entry
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {success}
                        </div>
                    )}

                    <form onSubmit={activeTab === 'upload' ? handleUploadSubmit : handleManualSubmit}>

                        {/* Common Fields (Required for both because backend needs them) */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
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
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                            <input
                                required
                                type="email"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {activeTab === 'upload' && (
                            <div className="mb-6">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Resume (PDF/Word) *</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    {file ? (
                                        <p className="text-sm font-medium text-blue-600">{file.name}</p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-gray-900">Click to upload resume</p>
                                            <p className="text-xs text-gray-500 mt-1">PDF or Word documents</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'manual' && (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn URL</label>
                                    <input
                                        type="url"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        value={formData.linkedinUrl}
                                        onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {activeTab === 'upload' ? 'Upload & Create' : 'Create Profile'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
