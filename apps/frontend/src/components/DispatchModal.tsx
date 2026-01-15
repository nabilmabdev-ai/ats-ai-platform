import { useState, useEffect } from 'react';
import UserSelect from './UserSelect';

interface DispatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDispatch: () => void; // Callback to refresh parent
}

interface Allocation {
    recruiterId: string;
    recruiterName: string; // Stored for display convenience
    count: number;
}

export default function DispatchModal({ isOpen, onClose, onDispatch }: DispatchModalProps) {
    const [stats, setStats] = useState<{ unassignedCount: number }>({ unassignedCount: 0 });
    const [loadingStats, setLoadingStats] = useState(false);
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Load initial stats
    useEffect(() => {
        if (isOpen) {
            loadStats();
        } else {
            setAllocations([]);
        }
    }, [isOpen]);

    const loadStats = async () => {
        setLoadingStats(true);
        try {
            // We need an endpoint to get unassigned count.
            // Using existing findAll with a specific filter logic or adding a simplified stats endpoint would be better.
            // For now, let's assume we can filter findAll by "ownerId=null" or similar if supported, 
            // OR we add a quick "stats/unassigned" endpoint.
            // Wait, I didn't add a stats endpoint. 
            // I can use `findAll` but that returns data. 
            // Let's rely on the user knowing roughly or just trying to distribute. 
            // BETTER: Add a quick check in `findAll`?
            // Actually, the `distribute` endpoint fails if not enough apps.
            // Let's try to fetch a count.
            // I'll assume for this iteration I'll just show "Available" by querying 
            // /applications?limit=1&ownerId=null (if supported) to get total count from metadata.
            // ApplicationsController.findAll doesn't seem to support ownerId filter explicitly in the snippets I saw.
            // Let's blindly trust the user or add a small helper.
            // I can fetch all unassigned apps using a query param if I modify the backend?
            // "findAll" in service has whereClause. 
            // Let's modify `findAll` to support `unassigned=true`?
            // Or just fetch all and filter client side (bad for performance).

            // Allow me to fallback: I'll just fetch a high level count if I can.
            // Let's add a robust `GET /applications/stats/unassigned` later? 
            // For now, I'll assume 0 and let user type, validation matches backend.
            // Actually, showing the count is crucial for the UX "50 unaffected".
            // I will use a custom fetch to a new endpoint or existing one. 
            // Let's try `GET /applications?search=unassigned`? No.

            // Workaround: I'll add a fetch to `findAll` and check `x-total-count` or generic result.
            // wait, response is { data, total }.
            // I need to filter by ownerId=null. 
            // I'll add logic to backend `findAll` to support filtering by ownerId later as a refinement if needed.
            // For now, I will NOT fetch the count and just let the user input. 
            // Wait, the prompt explicitly said "system detect 50 unaffected".
            // I SHOULD add that support. 
            // I'll pause on this file, update backend to support ownerId filter, then come back.
            // BUT, I'm in the middle of writing this file. I'll write it assuming I can get the count.

            // ... (Decision: I will update backend `findAll` to support `ownerId` query param in a separate step, then this works)

            const token = localStorage.getItem('access_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications?ownerId=null&limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats({ unassignedCount: data.total });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleAddRecruiter = (userId: string) => {
        // Need to fetch user name or pass it from UserSelect... UserSelect `onChange` just gives ID.
        // UserSelect could be updated or we just fetch details.
        // Simplification: We add an empty allocation row and let them pick the user there?
        // Or better: UserSelect IS the row adder? 
        // No, design: "Interface to say this recruiter 20, this one 10".
        // List of rows: [ Recruiter Select | Count Input | X ]
        setAllocations([...allocations, { recruiterId: '', recruiterName: '', count: 0 }]);
    };

    const updateAllocation = (index: number, field: keyof Allocation, value: any) => {
        const newAllocations = [...allocations];
        newAllocations[index] = { ...newAllocations[index], [field]: value };
        setAllocations(newAllocations);
    };

    const removeAllocation = (index: number) => {
        const newAllocations = allocations.filter((_, i) => i !== index);
        setAllocations(newAllocations);
    };

    const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.count) || 0), 0);
    const remaining = stats.unassignedCount - totalAllocated;

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('access_token');
            const validDistributions = allocations
                .filter(a => a.recruiterId && a.count > 0)
                .map(a => ({ recruiterId: a.recruiterId, count: Number(a.count) }));

            if (validDistributions.length === 0) return;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/distribute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ distributions: validDistributions })
            });

            if (res.ok) {
                alert('Dispatch successful!');
                onDispatch();
                onClose();
            } else {
                const err = await res.json();
                alert(`Failed: ${err.message}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error dispatching applications');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Dispatch Applications</h2>
                        <p className="text-sm text-gray-500">Auto-distribute pipeline to recruiters</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <span className="text-2xl">×</span>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Stats Card */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex justify-between items-center">
                        <div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Unassigned</span>
                            <div className="text-2xl font-bold text-blue-900">{loadingStats ? '...' : stats.unassignedCount}</div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Remaining</span>
                            <div className={`text-2xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-blue-900'}`}>
                                {remaining}
                            </div>
                        </div>
                    </div>

                    {/* Allocation Rows */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {allocations.map((alloc, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 p-2 rounded-lg shadow-sm">
                                <div className="flex-1">
                                    <UserSelect
                                        role="RECRUITER"
                                        value={alloc.recruiterId}
                                        onChange={(id) => updateAllocation(idx, 'recruiterId', id)}
                                        placeholder="Select Recruiter"
                                        className="border-none"
                                    />
                                </div>
                                <div className="w-24">
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full border border-gray-200 rounded px-2 py-2 text-sm text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Qty"
                                        value={alloc.count || ''}
                                        onChange={(e) => updateAllocation(idx, 'count', parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <button
                                    onClick={() => removeAllocation(idx)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => handleAddRecruiter('')}
                        className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm font-bold text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                        <span>+ Add Recruiter</span>
                    </button>

                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="btn-ghost" disabled={submitting}>Cancel</button>
                    <button
                        onClick={handleSubmit}
                        className="btn-primary shadow-lg shadow-blue-500/30"
                        disabled={submitting || allocations.length === 0 || remaining < 0}
                    >
                        {submitting ? 'Dispatching...' : 'Confirm Dispatch'}
                    </button>
                </div>
            </div>
        </div>
    );
}
