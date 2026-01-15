'use client';

import { useState, useEffect } from 'react';

export default function AuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            // Mock data
            setLogs([
                { id: '1', action: 'CREATE_JOB', target: 'Job: Senior React Dev', actor: { fullName: 'Alice Recruiter' }, createdAt: new Date().toISOString(), details: {} },
                { id: '2', action: 'DELETE_CANDIDATE', target: 'Candidate: John Doe', actor: { fullName: 'Bob Admin' }, createdAt: new Date(Date.now() - 3600000).toISOString(), details: { reason: 'Duplicate' } }
            ]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Audit Logs</h1>
                    <p className="text-gray-500 text-sm">Track system activities and security events.</p>
                </div>
                <button className="text-sm text-blue-600 hover:underline">Export CSV</button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                        <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Actor</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Target</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                <td className="px-6 py-3 font-medium">{log.actor?.fullName || 'System'}</td>
                                <td className="px-6 py-3">
                                    <span className="px-2 py-1 rounded-md bg-gray-100 font-mono text-xs">{log.action}</span>
                                </td>
                                <td className="px-6 py-3 text-gray-700">{log.target}</td>
                                <td className="px-6 py-3 text-gray-400 font-mono text-xs max-w-xs truncate">{JSON.stringify(log.details)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {logs.length === 0 && !loading && (
                    <div className="p-8 text-center text-gray-400">No logs found.</div>
                )}
            </div>
        </div>
    );
}
