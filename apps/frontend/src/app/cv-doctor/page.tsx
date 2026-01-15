'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DuplicateGroup } from './types';
import DuplicateGroupList from './components/DuplicateGroupList';
import { SparkleIcon } from '@/components/ui/Icons'; // Assuming standard icons

// ROI Stats Component
const ROIStatus = ({ groupCount, onRefresh, isScanning }: { groupCount: number, onRefresh: () => void, isScanning: boolean }) => (
    <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-[var(--radius-xl)] flex items-center justify-between">
        <div>
            <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                <SparkleIcon className="w-5 h-5 text-purple-600" />
                CVthèque Doctor Report
            </h2>
            <p className="text-purple-700 mt-1">
                We identified <span className="font-bold">{groupCount} potential duplicate groups</span> in your database.
                Resolving these will improve search accuracy and candidate experience.
            </p>
        </div>
        <div className="hidden md:block">
            <button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={onRefresh}
                disabled={isScanning}
            >
                {isScanning ? (
                    <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        Scanning...
                    </>
                ) : (
                    'Refresh Scan'
                )}
            </button>
        </div>
    </div>
);

export default function CVDoctorPage() {
    const [groups, setGroups] = useState<DuplicateGroup[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchGroups = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deduplication/groups`);
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (error) {
            console.error('Failed to fetch duplicate groups', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleResolution = (groupId: string) => {
        // Remove from list locally for instant feedback
        setGroups(prev => prev.filter(g => g.id !== groupId));
    };

    const [isScanning, setIsScanning] = useState(false);

    const handleScan = async () => {
        setIsScanning(true);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deduplication/scan`, { method: 'POST' });
            // Wait a moment for async scan to likely finish small batches or atleast start
            await new Promise(r => setTimeout(r, 1000));
            await fetchGroups();
        } catch (error) {
            console.error('Scan failed', error);
            alert('Failed to trigger scan');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] font-sans text-[var(--color-text-soft)]">
            {/* Header */}
            <header className="sticky top-0 z-20 h-20 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-8 backdrop-blur-sm bg-white/90">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-sm font-semibold text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]">
                        &larr; Back to Dashboard
                    </Link>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <h1 className="text-xl font-bold text-[var(--color-text-dark)]">
                        CVthèque Doctor
                    </h1>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-8">
                <ROIStatus groupCount={groups.length} onRefresh={handleScan} isScanning={isScanning} />

                {loading ? (
                    <div className="flex justify-center py-20 text-gray-400">Loading analysis...</div>
                ) : (
                    <DuplicateGroupList groups={groups} onResolve={handleResolution} />
                )}

                {!loading && groups.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                        <h3 className="text-lg font-bold text-gray-700">All Clear!</h3>
                        <p className="text-gray-500">No duplicates found in the system. Great job!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
