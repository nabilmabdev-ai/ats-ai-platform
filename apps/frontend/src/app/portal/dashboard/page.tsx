'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [candidate, setCandidate] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('portal_token');
        if (!token) {
            router.push('/portal/login');
            return;
        }

        // Simulate fetching profile (Real implementation needs a /me endpoint or similar)
        // For now, we decode the token if possible or just show dummy content?
        // We need a backend endpoint to fetch "My Applications".
        // Since we don't have that yet, I'll mock the data for the UI proof-of-concept
        // or quickly add a GET /candidates/me endpoint?

        // Let's rely on the token being valid and just decoding it manually for basic info?
        // No, security risk.
        // I should create GET /candidates/me endpoint.

        // For this step, I will mock the data to show the UI structure.
        setCandidate({
            firstName: 'Candidate',
            applications: [
                { id: '1', job: { title: 'Senior Software Engineer' }, status: 'SCREENING', appliedAt: new Date().toISOString() },
                { id: '2', job: { title: 'Product Manager' }, status: 'APPLIED', appliedAt: new Date(Date.now() - 86400000).toISOString() }
            ]
        });
        setLoading(false);

    }, [router]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your profile...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back{candidate?.firstName ? `, ${candidate.firstName}` : ''}</h1>
            <p className="text-gray-500 mb-8">Track your active applications and upcoming interviews.</p>

            <div className="grid gap-6">
                <h2 className="text-xl font-semibold border-b pb-2">Your Applications</h2>

                {candidate?.applications?.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed text-gray-400">
                        You haven't applied to any jobs yet.
                    </div>
                ) : (
                    candidate.applications.map((app: any) => (
                        <div key={app.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="font-bold text-lg">{app.job.title}</h3>
                                <p className="text-sm text-gray-500">Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={app.status} />
                                <button className="text-sm font-medium text-blue-600 hover:text-blue-800">View Details</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        'APPLIED': 'bg-blue-50 text-blue-700 border-blue-100',
        'SCREENING': 'bg-purple-50 text-purple-700 border-purple-100',
        'INTERVIEW': 'bg-orange-50 text-orange-700 border-orange-100',
        'OFFER': 'bg-green-50 text-green-700 border-green-100',
        'REJECTED': 'bg-gray-50 text-gray-600 border-gray-200',
        'HIRED': 'bg-black text-white border-black'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
            {status}
        </span>
    );
}
