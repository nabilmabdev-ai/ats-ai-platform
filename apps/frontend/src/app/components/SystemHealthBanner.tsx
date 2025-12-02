// apps/frontend/src/app/components/SystemHealthBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

export default function SystemHealthBanner() {
    const [failureCount, setFailureCount] = useState(0);
    const [isRecovering, setIsRecovering] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        // Check for failures on mount
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/health/parsing-failures`)
            .then(res => res.json())
            .then(data => setFailureCount(data.count))
            .catch(err => console.error("Health check failed", err));
    }, []);

    const handleRecover = async () => {
        setIsRecovering(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/maintenance/recover`, {
                method: 'POST'
            });
            const data = await res.json();
            
            addToast(`Started recovery for ${data.count} candidates. Data will appear shortly.`, 'info');
            
            // Optimistically hide the banner, or wait for re-fetch
            setFailureCount(0); 
        } catch (error) {
            addToast('Recovery trigger failed. Is the server online?', 'error');
        } finally {
            setIsRecovering(false);
        }
    };

    if (failureCount === 0) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-amber-800">
                        AI Service Outage Detected
                    </h3>
                    <p className="text-xs text-amber-700 mt-0.5">
                        {failureCount} resumes were uploaded but not analyzed by AI.
                    </p>
                </div>
            </div>
            
            <button
                onClick={handleRecover}
                disabled={isRecovering}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-md transition-colors disabled:opacity-50"
            >
                {isRecovering ? (
                    <>
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Recovering...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Recover Missing Data
                    </>
                )}
            </button>
        </div>
    );
}
