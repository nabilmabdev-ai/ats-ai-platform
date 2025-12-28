'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function ImportCandidatesPage() {
    const { token } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<{ totalCandidates: number; missingJobs: string[] } | null>(null);
    const [summary, setSummary] = useState<{
        total: number;
        imported: number;
        skipped: number;
        duplicatesUpdated: number;
        errors: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setSummary(null);
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
            // Clear missing jobs from view or show success
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
            setSummary(response.data);
            setAnalysisResult(null); // Clear analysis view
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.response?.data?.message || 'Failed to upload CSV');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Import Candidates</h1>
                <p className="text-gray-500 mt-2">
                    Upload a daily CSV export to ingest candidates. Only candidates located in Morocco will be imported.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                        {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500 mb-6">CSV files only</p>

                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="csv-upload"
                    />
                    <label
                        htmlFor="csv-upload"
                        className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 cursor-pointer transition-all shadow-sm"
                    >
                        Select File
                    </label>
                </div>

                {!analysisResult && !summary && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !file}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4" />
                                    Analyze File
                                </>
                            )}
                        </button>
                    </div>
                )}

                {analysisResult && (
                    <div className="mt-8 border-t border-gray-100 pt-8 animate-fade-in">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Result</h3>
                        <div className="mb-6">
                            <p className="text-gray-700">Found <strong>{analysisResult.totalCandidates}</strong> potential candidates in Morocco.</p>
                        </div>

                        {analysisResult.missingJobs.length > 0 ? (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-yellow-800">Missing Jobs Found</h4>
                                        <p className="text-sm text-yellow-700 mt-1">The following job titles in the CSV do not exist in the system:</p>
                                        <ul className="mt-2 list-disc list-inside text-sm text-yellow-800">
                                            {analysisResult.missingJobs.map(job => (
                                                <li key={job}>{job}</li>
                                            ))}
                                        </ul>
                                        <div className="mt-4 flex gap-3">
                                            <button
                                                onClick={handleBulkCreateJobs}
                                                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors"
                                            >
                                                Create All Missing Jobs
                                            </button>
                                            <button
                                                onClick={handleUpload}
                                                className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 text-sm font-medium rounded-md hover:bg-yellow-50 transition-colors"
                                            >
                                                Proceed Anyway (Use Fallback)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-green-800 font-medium">All job titles match existing jobs!</span>
                            </div>
                        )}

                        {analysisResult.missingJobs.length === 0 && (
                            <div className="flex justify-end">
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Start Import
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {summary && (
                    <div className="mt-8 border-t border-gray-100 pt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
                                <div className="text-sm text-blue-700 font-medium">Total Rows</div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="text-2xl font-bold text-green-600">{summary.imported}</div>
                                <div className="text-sm text-green-700 font-medium">Imported</div>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                                <div className="text-2xl font-bold text-yellow-600">{summary.duplicatesUpdated}</div>
                                <div className="text-sm text-yellow-700 font-medium">Updated</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="text-2xl font-bold text-gray-600">{summary.skipped}</div>
                                <div className="text-sm text-gray-700 font-medium">Skipped</div>
                            </div>
                        </div>
                        {summary.errors > 0 && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
                                {summary.errors} rows failed to process due to errors. Check server logs.
                            </div>
                        )}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => { setSummary(null); setFile(null); setAnalysisResult(null); }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Import Another File
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}