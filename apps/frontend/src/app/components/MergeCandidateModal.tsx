import { useState } from 'react';

interface Candidate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
    experience?: number;
    resumeS3Key?: string;
    lastActiveAt?: string;
}

interface MergeCandidateModalProps {
    primaryCandidate: Candidate;
    onClose: () => void;
    onMergeSuccess: () => void;
}

export default function MergeCandidateModal({ primaryCandidate, onClose, onMergeSuccess }: MergeCandidateModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);
    const [secondaryCandidate, setSecondaryCandidate] = useState<Candidate | null>(null);
    const [merging, setMerging] = useState(false);

    // Strategy State
    const [keepResumeFrom, setKeepResumeFrom] = useState<'primary' | 'secondary'>('primary');
    const [keepEmailFrom, setKeepEmailFrom] = useState<'primary' | 'secondary'>('primary');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            // Filter out the primary candidate from results
            setResults(data.filter((c: Candidate) => c.id !== primaryCandidate.id));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleMerge = async () => {
        if (!secondaryCandidate) return;
        if (!confirm(`Are you sure you want to merge ${secondaryCandidate.firstName} INTO ${primaryCandidate.firstName}? This cannot be undone.`)) return;

        setMerging(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates/merge`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    primaryId: primaryCandidate.id,
                    secondaryId: secondaryCandidate.id,
                    strategy: {
                        keepNameFrom: 'primary', // Defaulting to primary for name as per current UI logic
                        keepResumeFrom,
                        keepContactFrom: keepEmailFrom // Mapping email choice to contact strategy
                    }
                })
            });

            if (res.ok) {
                alert('Candidates merged successfully!');
                onMergeSuccess();
                onClose();
            } else {
                alert('Merge failed.');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred.');
        } finally {
            setMerging(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Merge Candidates</h2>
                        <p className="text-sm text-gray-500">Combine duplicate profiles into one.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">

                    {/* Step 1: Select Secondary */}
                    {!secondaryCandidate ? (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                                You are keeping <strong>{primaryCandidate.firstName} {primaryCandidate.lastName}</strong> as the primary profile. Search for the duplicate profile you want to merge into this one.
                            </div>

                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    autoFocus
                                />
                                <button type="submit" className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </button>
                            </form>

                            <div className="space-y-2">
                                {loading && <p className="text-center text-gray-500 py-4">Searching...</p>}
                                {results.map(c => (
                                    <div key={c.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSecondaryCandidate(c)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                                                {c.firstName[0]}{c.lastName[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{c.firstName} {c.lastName}</h4>
                                                <p className="text-xs text-gray-500">{c.email} • {c.phone || 'No Phone'}</p>
                                            </div>
                                        </div>
                                        <button className="btn-secondary text-xs">Select</button>
                                    </div>
                                ))}
                                {results.length === 0 && query && !loading && (
                                    <p className="text-center text-gray-400 py-4">No other candidates found.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Confirm Merge */
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Primary */}
                                <div className="border border-green-200 bg-green-50/50 rounded-xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                                    <span className="absolute top-4 right-4 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">KEEPING</span>

                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Primary Profile</h3>
                                    <div className="space-y-3 text-sm">
                                        <p><span className="text-gray-500 block text-xs">Name</span> {primaryCandidate.firstName} {primaryCandidate.lastName}</p>
                                        <p><span className="text-gray-500 block text-xs">Email</span> {primaryCandidate.email}</p>
                                        <p><span className="text-gray-500 block text-xs">Phone</span> {primaryCandidate.phone || '-'}</p>
                                        <p><span className="text-gray-500 block text-xs">Location</span> {primaryCandidate.location || '-'}</p>
                                        <p><span className="text-gray-500 block text-xs">Resume</span> {primaryCandidate.resumeS3Key ? 'Attached' : 'Missing'}</p>
                                    </div>
                                </div>

                                {/* Secondary */}
                                <div className="border border-red-200 bg-red-50/50 rounded-xl p-6 relative overflow-hidden opacity-75">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                                    <span className="absolute top-4 right-4 text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded">DELETING</span>

                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Duplicate Profile</h3>
                                    <div className="space-y-3 text-sm">
                                        <p><span className="text-gray-500 block text-xs">Name</span> {secondaryCandidate.firstName} {secondaryCandidate.lastName}</p>
                                        <p><span className="text-gray-500 block text-xs">Email</span> {secondaryCandidate.email}</p>
                                        <p><span className="text-gray-500 block text-xs">Phone</span> {secondaryCandidate.phone || '-'}</p>
                                        <p><span className="text-gray-500 block text-xs">Location</span> {secondaryCandidate.location || '-'}</p>
                                        <p><span className="text-gray-500 block text-xs">Resume</span> {secondaryCandidate.resumeS3Key ? 'Attached' : 'Missing'}</p>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-red-200">
                                        <p className="text-xs text-red-600 italic">
                                            * Applications, interviews, and comments will be moved to the Primary Profile.
                                            * Missing data (e.g. phone) will be copied to Primary.
                                            * This profile will be permanently deleted.
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {/* Strategy Options */}
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-gray-900 mb-4">Merge Strategy</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Resume Strategy */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Resume to Keep</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="resume"
                                                    checked={keepResumeFrom === 'primary'}
                                                    onChange={() => setKeepResumeFrom('primary')}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">Primary</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="resume"
                                                    checked={keepResumeFrom === 'secondary'}
                                                    onChange={() => setKeepResumeFrom('secondary')}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                    disabled={!secondaryCandidate.resumeS3Key}
                                                />
                                                <span className={`text-sm ${!secondaryCandidate.resumeS3Key ? 'text-gray-400' : 'text-gray-700'}`}>
                                                    Secondary {secondaryCandidate.resumeS3Key ? '' : '(None)'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Email Strategy */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email & Contact Info</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="email"
                                                    checked={keepEmailFrom === 'primary'}
                                                    onChange={() => setKeepEmailFrom('primary')}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">Primary ({primaryCandidate.email})</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="email"
                                                    checked={keepEmailFrom === 'secondary'}
                                                    onChange={() => setKeepEmailFrom('secondary')}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">Secondary ({secondaryCandidate.email})</span>
                                            </label>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    {secondaryCandidate ? (
                        <>
                            <button onClick={() => setSecondaryCandidate(null)} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                                ← Back to Search
                            </button>
                            <button
                                onClick={handleMerge}
                                disabled={merging}
                                className="btn-danger flex items-center gap-2"
                            >
                                {merging ? 'Merging...' : 'Confirm Merge'}
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className="ml-auto btn-secondary">Cancel</button>
                    )}
                </div>

            </div>
        </div>
    );
}
