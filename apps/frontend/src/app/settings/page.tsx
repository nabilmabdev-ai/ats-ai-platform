'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// --- Helper Icons & Components ---
const LogoLinkedIn = () => <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>;
const LogoSlack = () => <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 122.88 122.88"><path d="M25.83,82.49c0,5.55-4.5,10.05-10.05,10.05s-10.05-4.5-10.05-10.05S10.23,72.44,15.78,72.44h10.05V82.49z M25.83,61.44c-5.55,0-10.05-4.5-10.05-10.05s4.5-10.05,10.05-10.05s10.05,4.5,10.05,10.05V61.44H25.83z M40.38,61.44c0-5.55,4.5-10.05,10.05-10.05s10.05,4.5,10.05,10.05s-4.5,10.05-10.05,10.05H40.38V61.44z M61.44,61.44c0,5.55,4.5,10.05,10.05,10.05s10.05-4.5,10.05-10.05S77.04,51.39,71.49,51.39V61.44H61.44z M61.44,40.38c5.55,0,10.05,4.5,10.05,10.05S66.99,60.48,61.44,60.48s-10.05-4.5-10.05-10.05V40.38H61.44z M82.49,40.38c0,5.55-4.5,10.05-10.05,10.05S62.39,45.93,62.39,40.38s4.5-10.05,10.05-10.05H82.49V40.38z M82.49,25.83c0-5.55-4.5-10.05-10.05-10.05S62.39,20.28,62.39,25.83s4.5,10.05,10.05,10.05h10.05V25.83z M97.05,25.83c5.55,0,10.05,4.5,10.05,10.05s-4.5,10.05-10.05,10.05s-10.05-4.5-10.05-10.05V25.83H97.05z" /></svg>;
const LogoGemini = () => <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 8.5 12 8.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-10c-.83 0-1.5-.67-1.5-1.5S11.17 4.5 12 4.5s1.5.67 1.5 1.5S12.83 7.5 12 7.5z" /></svg>;

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

const ToggleSwitch = ({ enabled }: { enabled: boolean }) => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  return (
    <button onClick={() => setIsEnabled(!isEnabled)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isEnabled ? 'bg-green-500' : 'bg-[var(--color-soft-grey)]'}`}>
      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
};
// --- End Helpers ---

interface JobTemplate { id: string; name: string; structure: string; }
interface ScreeningTemplate { id: string; name: string; requiredSkills: string[]; }
interface OfferTemplate { id: string; name: string; type: string; }
interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  careerPageUrl?: string;
  defaultTimezone?: string;
  aiTone?: string;
  description?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'JOB_TEMPLATES' | 'OFFER_TEMPLATES' | 'SCREENING' | 'INTEGRATIONS'>('GENERAL');
  const [jobTemplates, setJobTemplates] = useState<JobTemplate[]>([]);
  const [offerTemplates, setOfferTemplates] = useState<OfferTemplate[]>([]);
  const [screenTemplates, setScreenTemplates] = useState<ScreeningTemplate[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback((type: 'GENERAL' | 'JOB_TEMPLATES' | 'OFFER_TEMPLATES' | 'SCREENING') => {
    let endpoint = '';
    if (type === 'JOB_TEMPLATES') endpoint = 'templates/job';
    else if (type === 'SCREENING') endpoint = 'templates/screening';
    else if (type === 'OFFER_TEMPLATES') endpoint = 'document-templates?type=OFFER';
    else if (type === 'GENERAL') endpoint = 'company';

    const apiUrl = getBaseUrl();
    // Get the token from storage
    const token = localStorage.getItem('access_token');

    setLoading(true);
    fetch(`${apiUrl}/${endpoint}`, {
      // Add headers here
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          // If auth fails, return null/empty appropriately
          throw new Error('Failed to fetch');
        }
        return res.json();
      })
      .then(data => {
        if (type === 'JOB_TEMPLATES') setJobTemplates(data);
        else if (type === 'SCREENING') setScreenTemplates(data);
        else if (type === 'OFFER_TEMPLATES') setOfferTemplates(data);
        else if (type === 'GENERAL') setCompany(data);
      })
      .catch(error => console.error(`Failed to fetch ${type} data:`, error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'JOB_TEMPLATES' || activeTab === 'SCREENING' || activeTab === 'OFFER_TEMPLATES' || activeTab === 'GENERAL') {
      fetchData(activeTab);
    }
  }, [activeTab, fetchData]);

  const handleDelete = async (type: 'job' | 'screening' | 'offer', id: string) => {
    const apiUrl = getBaseUrl();
    if (!confirm(`Are you sure you want to delete this template?`)) return;

    let endpoint = '';
    if (type === 'job') endpoint = `templates/job/${id}`;
    else if (type === 'screening') endpoint = `templates/screening/${id}`;
    else if (type === 'offer') endpoint = `document-templates/${id}`;

    await fetch(`${apiUrl}/${endpoint}`, { method: 'DELETE' });

    if (type === 'job') fetchData('JOB_TEMPLATES');
    else if (type === 'screening') fetchData('SCREENING');
    else if (type === 'offer') fetchData('OFFER_TEMPLATES');
  };

  const handleDuplicateJobTemplate = async (templateId: string) => {
    const apiUrl = getBaseUrl();
    try {
      // 1. Get original details
      const res = await fetch(`${apiUrl}/templates/job/${templateId}`);
      if (!res.ok) throw new Error('Failed to fetch template details');
      const original = await res.json();

      // 2. Create copy
      const payload = {
        name: `${original.name} (Copy)`,
        structure: original.structure,
        defaultScreeningTemplateId: original.defaultScreeningTemplateId
      };

      const createRes = await fetch(`${apiUrl}/templates/job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (createRes.ok) {
        // Refresh list
        fetchData('JOB_TEMPLATES');
      } else {
        alert('Failed to duplicate template');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while duplicating.');
    }
  };

  const handleSaveCompany = async () => {
    if (!company) return;
    const apiUrl = getBaseUrl();
    const token = localStorage.getItem('access_token'); // Get token for save action too

    try {
      const res = await fetch(`${apiUrl}/company`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add auth header
        },
        body: JSON.stringify(company)
      });
      if (res.ok) {
        alert('Company info saved!');
      } else {
        alert('Failed to save company info.');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving company info.');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const apiUrl = getBaseUrl();
    const token = localStorage.getItem('access_token'); // <--- Get token

    try {
      const res = await fetch(`${apiUrl}/uploads`, {
        method: 'POST',
        // Add Authorization header
        // Note: Do NOT set 'Content-Type': 'multipart/form-form-data' manually with fetch + FormData
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setCompany(prev => prev ? { ...prev, logoUrl: data.url } : null);
      } else {
        alert('Failed to upload logo.');
      }
    } catch (error) {
      console.error(error);
      alert('Error uploading logo.');
    }
  };

  const renderTabNav = (id: 'GENERAL' | 'JOB_TEMPLATES' | 'OFFER_TEMPLATES' | 'SCREENING' | 'INTEGRATIONS', label: string) => (
    <button onClick={() => setActiveTab(id)} className={`px-4 py-2.5 text-sm font-semibold rounded-md transition-colors ${activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'}`}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--color-soft-grey)] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your ATS automation and templates.</p>
        </div>

        <div className="card-base p-0 flex flex-col sm:flex-row min-h-[600px]">
          {/* Vertical Nav for larger screens */}
          <nav className="hidden sm:flex flex-col gap-1 p-4 border-r border-[var(--color-border-subtle)] bg-[var(--color-soft-grey)] w-56">
            {renderTabNav('GENERAL', 'Company Info')}
            {renderTabNav('JOB_TEMPLATES', 'Job Templates')}
            {renderTabNav('OFFER_TEMPLATES', 'Offer Templates')}
            {renderTabNav('SCREENING', 'Scorecards')}
            {renderTabNav('INTEGRATIONS', 'Integrations')}
          </nav>

          {/* Horizontal Nav for mobile */}
          <div className="sm:hidden p-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-soft-grey)]">
            <div className="flex justify-center p-1 bg-[var(--color-border-subtle)] rounded-lg overflow-x-auto">
              {renderTabNav('GENERAL', 'Info')}
              {renderTabNav('JOB_TEMPLATES', 'Jobs')}
              {renderTabNav('OFFER_TEMPLATES', 'Offers')}
              {renderTabNav('SCREENING', 'Scores')}
              {renderTabNav('INTEGRATIONS', 'Apps')}
            </div>
          </div>

          <main className="p-6 sm:p-8 flex-1">
            {loading ? <p>Loading...</p> : (
              <>
                {activeTab === 'GENERAL' && company && (
                  <div className="max-w-2xl">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Company Information</h3>

                    <div className="mb-6 flex items-center gap-6">
                      <div className="w-24 h-24 rounded-lg border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                        {company.logoUrl ? (
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
                          onChange={handleLogoUpload}
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

                      {/* NEW: About the Company */}
                      <div className="sm:col-span-2">
                        <label className="label-base">About the Company</label>
                        <p className="text-xs text-gray-500 mb-1">Used by AI as context for job descriptions (mission, culture, values).</p>
                        <textarea
                          value={company.description || ''}
                          onChange={(e) => setCompany({ ...company, description: e.target.value })}
                          className="input-base w-full mt-1 min-h-[120px]"
                          placeholder="e.g. We are a fast-paced fintech startup focused on democratizing finance..."
                        />
                      </div>

                    </div>
                    <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)] flex justify-end">
                      <button onClick={handleSaveCompany} className="btn-primary">Save Changes</button>
                    </div>
                  </div>
                )}

                {activeTab === 'JOB_TEMPLATES' && (
                  <div>
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
                            <button
                              onClick={() => handleDuplicateJobTemplate(t.id)}
                              className="btn-secondary text-xs py-1.5 px-3"
                              title="Duplicate Template"
                            >
                              Duplicate
                            </button>
                            <Link
                              href={`/settings/templates/job/${t.id}`}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete('job', t.id)}
                              className="btn-danger-secondary text-xs py-1.5 px-3 text-red-600 hover:bg-red-50 border-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {jobTemplates.length === 0 && <p className="p-4 text-gray-400 italic text-sm">No templates found.</p>}
                    </div>
                  </div>
                )}

                {activeTab === 'OFFER_TEMPLATES' && (
                  <div>
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
                            <Link
                              href={`/settings/templates/offer/${t.id}`}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete('offer', t.id)}
                              className="btn-danger-secondary text-xs py-1.5 px-3 text-red-600 hover:bg-red-50 border-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {offerTemplates.length === 0 && <p className="p-4 text-gray-400 italic text-sm">No offer templates found.</p>}
                    </div>
                  </div>
                )}

                {activeTab === 'SCREENING' && (
                  <div>
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

                {activeTab === 'INTEGRATIONS' && (
                  <div className="space-y-4 max-w-2xl">
                    <div className="card-base flex-row items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0077B5] rounded-lg flex items-center justify-center"><LogoLinkedIn /></div>
                        <div>
                          <h4 className="font-bold text-gray-900">LinkedIn Recruiter</h4>
                          <p className="text-xs text-gray-500">Auto-distribute jobs.</p>
                        </div>
                      </div>
                      <ToggleSwitch enabled={true} />
                    </div>
                    <div className="card-base flex-row items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center"><LogoSlack /></div>
                        <div>
                          <h4 className="font-bold text-gray-900">Slack</h4>
                          <p className="text-xs text-gray-500">Get new applicant notifications.</p>
                        </div>
                      </div>
                      <button className="btn-secondary">Connect</button>
                    </div>
                    <div className="card-base flex-row items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center"><LogoGemini /></div>
                        <div>
                          <h4 className="font-bold text-gray-900">LLM Provider</h4>
                          <p className="text-xs text-gray-500">Using: Google Gemini Pro</p>
                        </div>
                      </div>
                      <ToggleSwitch enabled={true} />
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}