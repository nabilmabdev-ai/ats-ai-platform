'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getBaseUrl } from '../utils';
import { JobTemplate, OfferTemplate, ScreeningTemplate } from '../types';
import QuestionTemplatesPage from '../templates/questions/page';

export default function HiringSettings() {
    const [activeSubTab, setActiveSubTab] = useState<'JOB' | 'OFFER' | 'SCREENING' | 'QUESTIONS'>('JOB');
    const [jobTemplates, setJobTemplates] = useState<JobTemplate[]>([]);
    const [offerTemplates, setOfferTemplates] = useState<OfferTemplate[]>([]);
    const [screenTemplates, setScreenTemplates] = useState<ScreeningTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (type: 'JOB' | 'OFFER' | 'SCREENING') => {
        setLoading(true);
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');

        let endpoint = '';
        if (type === 'JOB') endpoint = 'templates/job';
        else if (type === 'SCREENING') endpoint = 'templates/screening';
        else if (type === 'OFFER') endpoint = 'document-templates?type=OFFER';

        try {
            const res = await fetch(`${apiUrl}/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (type === 'JOB') setJobTemplates(data);
                else if (type === 'SCREENING') setScreenTemplates(data);
                else if (type === 'OFFER') setOfferTemplates(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeSubTab === 'JOB') fetchData('JOB');
        if (activeSubTab === 'OFFER') fetchData('OFFER');
        if (activeSubTab === 'SCREENING') fetchData('SCREENING');
    }, [activeSubTab, fetchData]);


    const handleDelete = async (type: 'job' | 'screening' | 'offer', id: string) => {
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');
        if (!confirm(`Are you sure you want to delete this template?`)) return;

        let endpoint = '';
        if (type === 'job') endpoint = `templates/job/${id}`;
        else if (type === 'screening') endpoint = `templates/screening/${id}`;
        else if (type === 'offer') endpoint = `document-templates/${id}`;

        await fetch(`${apiUrl}/${endpoint}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });

        if (type === 'job') fetchData('JOB');
        else if (type === 'screening') fetchData('SCREENING');
        else if (type === 'offer') fetchData('OFFER');
    };

    const handleDuplicateJobTemplate = async (templateId: string) => {
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${apiUrl}/templates/job/${templateId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to fetch template details');
            const original = await res.json();

            const payload = {
                name: `${original.name} (Copy)`,
                structure: original.structure,
                defaultScreeningTemplateId: original.defaultScreeningTemplateId
            };

            const createRes = await fetch(`${apiUrl}/templates/job`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (createRes.ok) {
                fetchData('JOB');
            } else {
                alert('Failed to duplicate template');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while duplicating.');
        }
    };

    return (
        <div>
            <div className="flex space-x-4 border-b border-gray-200 mb-6 overflow-x-auto">
                <button className={`py-2 px-1 border-b-2 whitespace-nowrap font-medium text-sm ${activeSubTab === 'JOB' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveSubTab('JOB')}>
                    Job Templates
                </button>
                <button className={`py-2 px-1 border-b-2 whitespace-nowrap font-medium text-sm ${activeSubTab === 'OFFER' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveSubTab('OFFER')}>
                    Offer Templates
                </button>
                <button className={`py-2 px-1 border-b-2 whitespace-nowrap font-medium text-sm ${activeSubTab === 'SCREENING' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveSubTab('SCREENING')}>
                    Scorecards
                </button>
                <button className={`py-2 px-1 border-b-2 whitespace-nowrap font-medium text-sm ${activeSubTab === 'QUESTIONS' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveSubTab('QUESTIONS')}>
                    Question Templates
                </button>
            </div>

            {loading && <p>Loading...</p>}

            {!loading && activeSubTab === 'JOB' && (
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Job Templates</h3>
                            <p className="text-sm text-gray-500">Used by AI to structure new job postings.</p>
                        </div>
                        <Link href="/settings/templates/job/new" className="btn-primary text-sm">+ New Template</Link>
                    </div>
                    <div className="border border-[var(--color-border-subtle)] rounded-lg divide-y divide-[var(--color-border-subtle)]">
                        {jobTemplates.map(t => (
                            <div key={t.id} className="group flex justify-between items-center p-4 hover:bg-[var(--color-soft-grey)]">
                                <div>
                                    <h4 className="font-semibold text-gray-800">{t.name}</h4>
                                    <p className="text-xs text-gray-500">Default Structure</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDuplicateJobTemplate(t.id)} className="btn-secondary text-xs py-1.5 px-3" title="Duplicate Template">Duplicate</button>
                                    <Link href={`/settings/templates/job/${t.id}`} className="btn-secondary text-xs py-1.5 px-3">Edit</Link>
                                    <button onClick={() => handleDelete('job', t.id)} className="btn-danger-secondary text-xs py-1.5 px-3 text-red-600 hover:bg-red-50 border-red-100">Delete</button>
                                </div>
                            </div>
                        ))}
                        {jobTemplates.length === 0 && <p className="p-4 text-gray-400 italic text-sm">No templates found.</p>}
                    </div>
                </div>
            )}

            {!loading && activeSubTab === 'OFFER' && (
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Offer Templates</h3>
                            <p className="text-sm text-gray-500">Structured templates for offer letters.</p>
                        </div>
                        <Link href="/settings/templates/offer/new" className="btn-primary text-sm">+ New Template</Link>
                    </div>
                    <div className="border border-[var(--color-border-subtle)] rounded-lg divide-y divide-[var(--color-border-subtle)]">
                        {offerTemplates.map(t => (
                            <div key={t.id} className="group flex justify-between items-center p-4 hover:bg-[var(--color-soft-grey)]">
                                <div>
                                    <h4 className="font-semibold text-gray-800">{t.name}</h4>
                                    <p className="text-xs text-gray-500">Offer Letter</p>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/settings/templates/offer/${t.id}`} className="btn-secondary text-xs py-1.5 px-3">Edit</Link>
                                    <button onClick={() => handleDelete('offer', t.id)} className="btn-danger-secondary text-xs py-1.5 px-3 text-red-600 hover:bg-red-50 border-red-100">Delete</button>
                                </div>
                            </div>
                        ))}
                        {offerTemplates.length === 0 && <p className="p-4 text-gray-400 italic text-sm">No offer templates found.</p>}
                    </div>
                </div>
            )}

            {!loading && activeSubTab === 'SCREENING' && (
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Screening Scorecards</h3>
                            <p className="text-sm text-gray-500">Criteria for AI to grade resumes against.</p>
                        </div>
                        <Link href="/settings/screening/new" className="btn-primary text-sm">+ New Scorecard</Link>
                    </div>
                    <div className="border border-[var(--color-border-subtle)] rounded-lg divide-y divide-[var(--color-border-subtle)]">
                        {screenTemplates.map(t => (
                            <div key={t.id} className="group p-4 hover:bg-[var(--color-soft-grey)]">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-gray-800">{t.name}</h4>
                                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/settings/screening/${t.id}`} className="btn-secondary text-xs">Edit</Link>
                                        <button onClick={() => handleDelete('screening', t.id)} className="btn-danger-secondary text-xs">Delete</button>
                                    </div>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {t.requiredSkills?.map((skill, i) => <span key={i} className="badge-base bg-primary/10 text-primary">{skill}</span>)}
                                </div>
                            </div>
                        ))}
                        {screenTemplates.length === 0 && <p className="p-4 text-gray-400 italic text-sm">No scorecards found.</p>}
                    </div>
                </div>
            )}

            {activeSubTab === 'QUESTIONS' && (
                <div className="-m-6 sm:-m-8 animate-fadeIn">
                    <QuestionTemplatesPage />
                </div>
            )}
        </div>
    );
}
