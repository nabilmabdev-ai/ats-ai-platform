'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, XCircle, Trash2, RefreshCcw, StopCircle } from 'lucide-react';
import axios from 'axios';

interface ImportBatch {
    id: string;
    filename: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    processed: number;
    total: number;
    errors: number;
    createdAt: string;
}

export default function ImportCandidatesPage() {
    const { token } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ totalCandidates: number; missingJobs: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Async Import State
    const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
    const [batches, setBatches] = useState<ImportBatch[]>([]);

    const fetchBatches = useCallback(async () => {
        if (!token) return;
        try {
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/csv-import`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBatches(data);
            // If the most recent batch is running, set it as active
            const recent = data[0];
            if (recent && (recent.status === 'PENDING' || recent.status === 'PROCESSING')) {
                setActiveBatchId(recent.id);
            }
        } catch (err) {
            console.error('Failed to fetch batches', err);
        }
    }, [token]);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    // Polling for active batch
    useEffect(() => {
        if (!activeBatchId || !token) return;

        const interval = setInterval(async () => {
            try {
                const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/csv-import/${activeBatchId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Update the specific batch in the list
                setBatches(prev => prev.map(b => b.id === activeBatchId ? data : b));

                if (data.status !== 'PENDING' && data.status !== 'PROCESSING') {
                    setActiveBatchId(null); // Stop polling
                    if (data.status === 'COMPLETED') {
                        // Optional: Show success toast
                    }
                }
            } catch (err) {
                console.error('Polling failed', err);
                setActiveBatchId(null);
            }
        }, 1000); // Poll every second

        return () => clearInterval(interval);
    }, [activeBatchId, token]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setAnalysisResult(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file || !token) return;

        setIsAnalyzing(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/csv-import/analyze`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            setAnalysisResult(response.data);
        } catch (err: any) {
            console.error('Analysis failed:', err);
            setError(err.response?.data?.message || 'Failed to analyze CSV');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleBulkCreateJobs = async () => {
        if (!analysisResult?.missingJobs?.length || !token) return;

        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/jobs/bulk`,
                { titles: analysisResult.missingJobs },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAnalysisResult(prev => prev ? { ...prev, missingJobs: [] } : null);
            alert('Jobs created successfully! You can now proceed with import.');
        } catch (err: any) {
            setError('Failed to create jobs');
        }
    };

    const handleUpload = async () => {
        if (!file || !token) return;

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/csv-import`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            // Start tracking the new batch
            setActiveBatchId(response.data.batchId);
            setAnalysisResult(null);
            setFile(null); // Clear input
            fetchBatches(); // Refresh list immediately
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.response?.data?.message || 'Failed to upload CSV');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancelConfig = async (batchId: string) => {
        if (!confirm('Are you sure you want to stop this import?')) return;
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/csv-import/${batchId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBatches(); // Update UI
        } catch (e) { console.error(e); }
    };

    const handleDeleteBatch = async (batchId: string) => {
        if (!confirm('WARNING: This will delete the batch record AND all applications created by it. This cannot be undone. Create candidates will remain but be unlinked. Continue?')) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/csv-import/${batchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBatches(); // Remove from UI
        } catch (e) { alert('Failed to delete batch'); }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Import Candidates</h1>
                <p className="text-gray-500 mt-2">
                    Upload a CSV to import candidates (Morocco only). Imports run in the background.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Upload & Analyze */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <Upload className="w-10 h-10 text-gray-400 mb-4" />
                            <p className="text-sm font-medium text-gray-700 mb-2 overflow-hidden text-ellipsis w-full text-center">
                                {file ? file.name : 'Click to upload CSV'}
                            </p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                            />
                            <label
                                htmlFor="csv-upload"
                                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50 cursor-pointer shadow-sm mt-2"
                            >
                                Select File
                            </label>
                        </div>

                        {!analysisResult && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !file}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                    Analyze File
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>

                    {analysisResult && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                            <h3 className="font-semibold text-gray-900 mb-2">Analysis Result</h3>
                            <p className="text-sm text-gray-700 mb-4">Found <strong>{analysisResult.totalCandidates}</strong> potential candidates.</p>

                            {analysisResult.missingJobs.length > 0 ? (
                                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md mb-4">
                                    <h4 className="font-medium text-yellow-800 text-sm">Missing Jobs</h4>
                                    <ul className="mt-1 list-disc list-inside text-xs text-yellow-800 max-h-32 overflow-y-auto">
                                        {analysisResult.missingJobs.map(j => <li key={j}>{j}</li>)}
                                    </ul>
                                    <div className="mt-3 flex gap-2">
                                        <button onClick={handleBulkCreateJobs} className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700">Create All</button>
                                        <button onClick={handleUpload} className="px-3 py-1.5 bg-white border border-yellow-300 text-yellow-700 text-xs rounded hover:bg-yellow-50">Ignore</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 text-sm text-green-700 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> All job titles exist.
                                </div>
                            )}

                            {analysisResult.missingJobs.length === 0 && (
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Start Import
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Col: Import History / Active Jobs */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-gray-900">Import History</h3>
                            <button onClick={fetchBatches} className="p-1 hover:bg-gray-200 rounded-full text-gray-500"><RefreshCcw className="w-4 h-4" /></button>
                        </div>

                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {batches.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">No imports found</div>
                            ) : (
                                batches.map(batch => (
                                    <div key={batch.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-medium text-gray-900 text-sm">{batch.filename}</h4>
                                                <p className="text-xs text-gray-500">{new Date(batch.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                                                    ${batch.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                        batch.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                            batch.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' :
                                                                'bg-blue-100 text-blue-700 animate-pulse'}`}>
                                                    {batch.status}
                                                </span>
                                                {(batch.status === 'PROCESSING' || batch.status === 'PENDING') && (
                                                    <button
                                                        onClick={() => handleCancelConfig(batch.id)}
                                                        className="text-red-600 hover:text-red-800 p-1"
                                                        title="Stop Import"
                                                    >
                                                        <StopCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteBatch(batch.id)}
                                                    className="text-gray-400 hover:text-red-600 p-1"
                                                    title="Delete Batch & Data"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${batch.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${batch.total > 0 ? (batch.processed / batch.total) * 100 : 0}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>{batch.processed} / {batch.total} processed</span>
                                            {batch.errors > 0 && <span className="text-red-600">{batch.errors} errors</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}