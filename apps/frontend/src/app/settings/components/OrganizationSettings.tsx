'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Company } from '../types';
import { getBaseUrl, ToggleSwitch } from '../utils';

export default function OrganizationSettings() {
    const { user } = useAuth();
    const [company, setCompany] = useState<Company | null>(null);
    const [myAvailability, setMyAvailability] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState<'INFO' | 'AVAILABILITY'>('INFO');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = useCallback(async (type: 'GENERAL' | 'AVAILABILITY') => {
        setLoading(true);
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');
        let endpoint = type === 'GENERAL' ? 'company' : `users/${user?.id}`;

        try {
            if (type === 'AVAILABILITY' && !user?.id) return;

            const res = await fetch(`${apiUrl}/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (type === 'GENERAL') {
                    setCompany(data);
                } else {
                    const avail = data.availability || { timezone: 'UTC', workHours: { start: 9, end: 17 } };
                    setMyAvailability({
                        ...avail,
                        googleConnected: !!data.googleAccessToken,
                        outlookConnected: !!data.outlookAccessToken
                    });
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData('GENERAL');
        if (user?.id) fetchData('AVAILABILITY');
    }, [fetchData, user]);


    const handleSaveCompany = async () => {
        if (!company) return;
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');

        try {
            const res = await fetch(`${apiUrl}/company`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(company)
            });
            if (res.ok) alert('Company info saved!');
            else alert('Failed to save company info.');
        } catch (error) {
            console.error(error);
            alert('Error saving company info.');
        }
    };

    const handleSaveAvailability = async () => {
        if (!myAvailability || !user?.id) return;
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');

        try {
            const res = await fetch(`${apiUrl}/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    availability: {
                        ...myAvailability,
                    }
                })
            });
            if (res.ok) alert('Availability settings saved!');
            else alert('Failed to save availability.');
        } catch (e) {
            console.error(e);
            alert('Error saving availability.');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');

        try {
            const res = await fetch(`${apiUrl}/uploads`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setCompany(prev => prev ? { ...prev, logoUrl: data.url } : null);
            } else {
                alert('Failed to upload image.');
            }
        } catch (error) {
            console.error(error);
            alert('Error uploading image.');
        }
    };

    const handleToggleIntegration = async (provider: 'google' | 'outlook', connect: boolean) => {
        if (!user?.id) return;
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');

        try {
            if (provider === 'google') {
                if (connect) {
                    window.location.href = `${apiUrl}/auth/google?userId=${user.id}`;
                } else {
                    const payload = { googleAccessToken: null, googleRefreshToken: null, googleCalendarId: null };
                    await updateIntegrationStatus(payload, 'google', false);
                }
            } else {
                const payload = {
                    outlookAccessToken: connect ? 'mock-outlook-token-123' : null,
                    outlookRefreshToken: connect ? 'mock-outlook-refresh-123' : null
                };
                await updateIntegrationStatus(payload, 'outlook', connect);
            }
        } catch (e) {
            console.error(e);
            alert('Connection error');
        }
    };

    const updateIntegrationStatus = async (payload: any, provider: string, isConnected: boolean) => {
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${apiUrl}/users/${user!.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setMyAvailability((prev: any) => ({
                ...prev,
                googleConnected: provider === 'google' ? isConnected : prev.googleConnected,
                outlookConnected: provider === 'outlook' ? isConnected : prev.outlookConnected
            }));
            alert(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar ${isConnected ? 'connected' : 'disconnected'}!`);
        } else {
            alert('Failed to update status');
        }
    };

    return (
        <div>
            <div className="flex space-x-4 border-b border-gray-200 mb-6">
                <button
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeSubTab === 'INFO' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveSubTab('INFO')}
                >
                    Company Info
                </button>
                <button
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${activeSubTab === 'AVAILABILITY' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveSubTab('AVAILABILITY')}
                >
                    My Availability
                </button>
            </div>

            {activeSubTab === 'INFO' && company && (
                <div className="max-w-2xl animate-fadeIn">
                    <div className="mb-6 flex items-center gap-6">
                        <div className="w-24 h-24 rounded-lg border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                            {company.logoUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={company.logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-gray-400 text-xs text-center px-2">No Logo</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <span className="text-white text-xs font-semibold">Change</span>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">Company Logo</h4>
                            <p className="text-sm text-gray-500 mb-2">Recommended size: 400x400px</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs">Upload New</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                            <label className="label-base">Company Name</label>
                            <input
                                type="text"
                                value={company.name}
                                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                className="input-base w-full mt-1"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label-base">Address</label>
                            <input
                                type="text"
                                value={company.address || ''}
                                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                                className="input-base w-full mt-1"
                                placeholder="123 Main St, City, Country"
                            />
                        </div>
                        <div>
                            <label className="label-base">Career Page URL</label>
                            <input
                                type="text"
                                value={company.careerPageUrl || ''}
                                onChange={(e) => setCompany({ ...company, careerPageUrl: e.target.value })}
                                className="input-base w-full mt-1"
                            />
                        </div>
                        <div>
                            <label className="label-base">Default Timezone</label>
                            <select
                                value={company.defaultTimezone || 'GMT'}
                                onChange={(e) => setCompany({ ...company, defaultTimezone: e.target.value })}
                                className="input-base w-full mt-1"
                            >
                                <option value="GMT">GMT</option>
                                <option value="EST">EST</option>
                                <option value="PST">PST</option>
                                <option value="CET">CET</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-base">Default AI Tone</label>
                            <select
                                value={company.aiTone || 'Professional'}
                                onChange={(e) => setCompany({ ...company, aiTone: e.target.value })}
                                className="input-base w-full mt-1"
                            >
                                <option value="Professional">Professional</option>
                                <option value="Casual">Casual</option>
                                <option value="Energetic">Energetic</option>
                                <option value="Formal">Formal</option>
                                <option value="Friendly">Friendly</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label-base">About the Company</label>
                            <p className="text-xs text-gray-500 mb-1">Used by AI as context for job descriptions.</p>
                            <textarea
                                value={company.description || ''}
                                onChange={(e) => setCompany({ ...company, description: e.target.value })}
                                className="input-base w-full mt-1 min-h-[120px]"
                            />
                        </div>
                        <div className="sm:col-span-2 pt-6 mt-6 border-t border-[var(--color-border-subtle)]">
                            <h4 className="font-bold text-gray-900 mb-4">Data Safety & Automation</h4>
                            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div>
                                    <h5 className="font-bold text-gray-800">Automatic Candidate Merging (Silent Mode)</h5>
                                    <p className="text-xs text-gray-600 mt-1 max-w-lg">
                                        Merge new applicants with existing profiles if they share the same <strong>Phone Number</strong> and <strong>Last Name</strong>.
                                    </p>
                                </div>
                                <ToggleSwitch
                                    enabled={company.enableAutoMerge || false}
                                    onChange={(val) => setCompany({ ...company, enableAutoMerge: val })}
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                                <div>
                                    <h5 className="font-bold text-gray-800">Re-index Database</h5>
                                    <p className="text-xs text-gray-600 mt-1 max-w-lg">
                                        Manually trigger a full re-index of all candidates to the AI search engine.
                                    </p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!confirm('Are you sure? This will re-process all candidates in the background.')) return;
                                        const apiUrl = getBaseUrl();
                                        const token = localStorage.getItem('access_token');
                                        try {
                                            const res = await fetch(`${apiUrl}/candidates/reindex`, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (res.ok) alert('Re-indexing started in background.');
                                            else alert('Failed to start re-indexing.');
                                        } catch (e) {
                                            console.error(e);
                                            alert('Error triggering re-index.');
                                        }
                                    }}
                                    className="btn-secondary text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-100"
                                >
                                    Trigger Re-index
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)] flex justify-end">
                        <button onClick={handleSaveCompany} className="btn-primary">Save Changes</button>
                    </div>
                </div>
            )}

            {activeSubTab === 'AVAILABILITY' && myAvailability && (
                <div className="max-w-2xl animate-fadeIn">
                    <div className="space-y-6">
                        <div>
                            <label className="label-base">Your Timezone</label>
                            <select
                                value={myAvailability.timezone || 'UTC'}
                                onChange={(e) => setMyAvailability({ ...myAvailability, timezone: e.target.value })}
                                className="input-base w-full mt-1"
                            >
                                <option value="UTC">UTC (Universal Tech)</option>
                                <option value="America/New_York">Eastern Time (US & Canada)</option>
                                <option value="America/Chicago">Central Time (US & Canada)</option>
                                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                                <option value="Europe/Paris">Central European Time</option>
                                <option value="Europe/London">London</option>
                                <option value="Asia/Tokyo">Tokyo</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-base">Work Start (Hour)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={myAvailability.workHours?.start ?? 9}
                                    onChange={(e) => setMyAvailability({
                                        ...myAvailability,
                                        workHours: { ...myAvailability.workHours, start: parseInt(e.target.value) }
                                    })}
                                    className="input-base w-full mt-1"
                                />
                            </div>
                            <div>
                                <label className="label-base">Work End (Hour)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={myAvailability.workHours?.end ?? 17}
                                    onChange={(e) => setMyAvailability({
                                        ...myAvailability,
                                        workHours: { ...myAvailability.workHours, end: parseInt(e.target.value) }
                                    })}
                                    className="input-base w-full mt-1"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <h4 className="font-bold text-blue-800 text-sm mb-3">📅 Calendar Integrations</h4>

                            <div className="space-y-3">
                                {/* Google Calendar */}
                                <div className="flex items-center justify-between bg-white p-3 rounded border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Google Calendar</p>
                                            <p className="text-xs text-gray-500">{myAvailability?.googleConnected ? 'Connected' : 'Not connected'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleIntegration('google', !myAvailability?.googleConnected)}
                                        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${myAvailability?.googleConnected ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        {myAvailability?.googleConnected ? 'Disconnect' : 'Connect'}
                                    </button>
                                </div>

                                {/* Outlook Calendar */}
                                <div className="flex items-center justify-between bg-white p-3 rounded border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200">
                                            <svg className="w-5 h-5 text-[#0078D4]" fill="currentColor" viewBox="0 0 24 24"><path d="M23.5 12c0 .4-.2 1-.5 1.4-1.9 2.5-5.2 4.6-9 4.6-4 0-7.3-2.1-9.2-4.6-.3-.3-.4-1-.1-1.4.3-.4 1-.5 1.4-.2.1 0 .2.2.3.3 1.6 1.9 4.6 3.9 7.6 3.9 3.1 0 5.9-1.9 7.6-3.9.4-.5 1.2-.5 1.6 0 .2.2.3.6.3.9z" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" opacity=".2" /><path d="M11.5 12h1v4h-1z" /><path d="M12 8c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Outlook Calendar</p>
                                            <p className="text-xs text-gray-500">{myAvailability?.outlookConnected ? 'Connected' : 'Not connected'}</p>
                                        </div>
                                    </div>
                                    <button

                                        onClick={() => handleToggleIntegration('outlook', !myAvailability?.outlookConnected)}
                                        className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${myAvailability?.outlookConnected ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        {myAvailability?.outlookConnected ? 'Disconnect' : 'Connect'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[var(--color-border-subtle)] flex justify-end">
                            <button onClick={handleSaveAvailability} className="btn-primary">Save Availability</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
