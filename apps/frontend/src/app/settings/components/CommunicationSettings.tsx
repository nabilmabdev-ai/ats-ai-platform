'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBaseUrl, ToggleSwitch } from '../utils';
import { Company } from '../types';

export default function CommunicationSettings() {
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${apiUrl}/company`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setCompany(await res.json());
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSaveCompany = async () => {
        if (!company) return;
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');

        try {
            const res = await fetch(`${apiUrl}/company`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(company)
            });
            if (res.ok) alert('Settings saved!');
            else alert('Failed to save settings.');
        } catch (error) {
            console.error(error);
            alert('Error saving settings.');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'footer') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        const apiUrl = getBaseUrl();
        const token = localStorage.getItem('access_token');

        try {
            const res = await fetch(`${apiUrl}/uploads`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setCompany(prev => {
                    if (!prev) return null;
                    if (type === 'header') return { ...prev, headerImageUrl: data.url };
                    if (type === 'footer') return { ...prev, footerImageUrl: data.url };
                    return prev;
                });
            } else { alert('Failed to upload image.'); }
        } catch (error) { console.error(error); alert('Error uploading image.'); }
    };

    const getPreviewHtml = () => {
        const template = company?.emailTemplates?.['interview_invite']?.body || '';

        // Header Logic
        const showHeader = company?.showEmailHeader ?? true;
        const headerHtml = (showHeader && company?.headerImageUrl)
            ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${company.headerImageUrl}" style="max-width: 100%; width: 100%; height: auto; border-radius: 8px 8px 0 0;" /></div>`
            : '';

        let bodyHtml = template
            .replace(/{{candidateName}}/g, 'John Doe')
            .replace(/{{jobTitle}}/g, 'Senior Product Designer')
            .replace(/{{customMessage}}/g, '<p style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #3b82f6; font-style: italic;">"We were impressed by your portfolio!"</p>')
            .replace(/{{bookingLink}}/g, '<a href="#" style="color: #2563eb; text-decoration: underline;">https://cal.com/booking/123</a>')
            .replace(/\n/g, '<br/>');

        // Footer Logic
        const showFooter = company?.showEmailFooter ?? true;
        const showAddress = company?.showCompanyAddress ?? true;

        const footerHtml = `
      ${(showFooter && company?.footerImageUrl) ? `<div style="text-align: center; margin-top: 30px;"><img src="${company.footerImageUrl}" style="max-width: 100%; width: 100%; height: auto;" /></div>` : ''}
      ${showAddress ? `
      <div style="margin-top: 15px; pt-4; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center;">
        ${company?.address || '123 Innovation Dr, Tech City, CA 94103'}
      </div>` : ''}
    `;

        return `
      <div style="font-family: Arial, sans-serif; padding: 0; border: 1px solid #eee; border-radius: 10px; overflow: hidden; background: white;">
        ${headerHtml}
        <div style="padding: 20px;">
          ${bodyHtml}
          <div style="margin: 30px 0;">
             <span style="display:inline-block; background-color: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;">📅 Select Interview Time</span>
          </div>
          ${footerHtml}
        </div>
      </div>
    `;
    };

    if (!company) return <p>Loading...</p>;

    return (
        <div className="max-w-2xl animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Email Templates</h3>
            <p className="text-sm text-gray-500 mb-6">Customize the automated emails sent by the system.</p>

            <div className="bg-white rounded-lg border border-[var(--color-border-subtle)] p-6 shadow-sm">
                <div className="mb-6">
                    <label className="label-base">Select Template</label>
                    <select className="input-base w-full mt-1">
                        <option value="interview_invite">Interview Invitation (Smart Schedule)</option>
                    </select>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="label-base">Subject Line</label>
                        <input
                            type="text"
                            value={company.emailTemplates?.['interview_invite']?.subject || 'Interview Invitation: {{jobTitle}}'}
                            onChange={(e) => setCompany({
                                ...company,
                                emailTemplates: {
                                    ...company.emailTemplates,
                                    interview_invite: {
                                        body: '',
                                        ...(company.emailTemplates?.['interview_invite'] || {}),
                                        subject: e.target.value
                                    }
                                }
                            })}
                            className="input-base w-full mt-1"
                        />
                        <p className="text-xs text-gray-400 mt-1">Variables: <code className="bg-gray-100 px-1 rounded">{`{{ jobTitle }}`}</code>, <code className="bg-gray-100 px-1 rounded">{`{{ candidateName }}`}</code></p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="label-base mb-0">Email Header Image</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Enable Header</span>
                                <ToggleSwitch
                                    enabled={company.showEmailHeader ?? true}
                                    onChange={(val) => setCompany({ ...company, showEmailHeader: val })}
                                />
                            </div>
                        </div>

                        {(company.showEmailHeader ?? true) && (
                            <>
                                <p className="text-xs text-gray-500 mb-2">Displayed at the top. <strong>Recommended: 600px width x 150px height</strong> (Banner style).</p>
                                <div className="flex items-center gap-4">
                                    {company.headerImageUrl && (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={company.headerImageUrl} alt="Header" className="h-16 object-contain border border-gray-200 rounded" />
                                    )}
                                    <input
                                        type="file"
                                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'header')}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="label-base mb-0">Email Footer Image</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Enable Footer</span>
                                <ToggleSwitch
                                    enabled={company.showEmailFooter ?? true}
                                    onChange={(val) => setCompany({ ...company, showEmailFooter: val })}
                                />
                            </div>
                        </div>

                        {(company.showEmailFooter ?? true) && (
                            <>
                                <p className="text-xs text-gray-500 mb-2">Displayed at the bottom, above your address. <strong>Recommended: 600px width x 100px height.</strong></p>
                                <div className="flex items-center gap-4">
                                    {company.footerImageUrl && (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={company.footerImageUrl} alt="Footer" className="h-16 object-contain border border-gray-200 rounded" />
                                    )}
                                    <input
                                        type="file"
                                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'footer')}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100 mb-4">
                        <div>
                            <span className="label-base block">Include Company Address</span>
                            <span className="text-xs text-gray-400">Required for legal compliance in some regions.</span>
                        </div>
                        <ToggleSwitch
                            enabled={company.showCompanyAddress ?? true}
                            onChange={(val) => setCompany({ ...company, showCompanyAddress: val })}
                        />
                    </div>

                    <div className="flex items-center justify-between mt-8 mb-2">
                        <label className="label-base mb-0">Email Layout Preview</label>
                        <div className="flex items-center gap-3">
                            <span
                                onClick={() => setShowPreview(false)}
                                className={`text-xs font-bold cursor-pointer select-none transition-colors ${!showPreview ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Edit Mode
                            </span>
                            <ToggleSwitch enabled={showPreview} onChange={setShowPreview} />
                            <span
                                onClick={() => setShowPreview(true)}
                                className={`text-xs font-bold cursor-pointer select-none transition-colors ${showPreview ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Live Preview
                            </span>
                        </div>
                    </div>

                    {showPreview ? (
                        <div
                            className="border border-gray-200 rounded-lg overflow-hidden mt-1 max-w-[600px] mx-auto bg-gray-50 p-4 shadow-sm"
                            dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                        />
                    ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden mt-1 max-w-[600px] mx-auto bg-white shadow-sm">
                            {(company.showEmailHeader ?? true) && (
                                <div className="border-b border-gray-100">
                                    {company.headerImageUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={company.headerImageUrl} alt="Header Preview" className="w-full h-auto" />
                                    ) : (
                                        <div className="p-8 text-center bg-gray-50 text-gray-400 text-xs uppercase tracking-wider border-dashed border-2 border-gray-200 m-2 rounded">
                                            [Header Image Area]
                                        </div>
                                    )}
                                </div>
                            )}

                            <textarea
                                value={company.emailTemplates?.['interview_invite']?.body || `Hi {{candidateName}},\n\nWe've reviewed your profile for the {{jobTitle}} position and would like to invite you to an interview.\n\n{{customMessage}}\n\nPlease book your interview here: {{bookingLink}}\n\nBest regards,\nThe Hiring Team`}
                                onChange={(e) => setCompany({
                                    ...company,
                                    emailTemplates: {
                                        ...company.emailTemplates,
                                        interview_invite: {
                                            subject: '',
                                            ...(company.emailTemplates?.['interview_invite'] || {}),
                                            body: e.target.value
                                        }
                                    }
                                })}
                                className="w-full p-6 min-h-[200px] font-mono text-sm focus:outline-none text-gray-700"
                                placeholder="Email body content..."
                            />

                            <div className="border-t border-gray-100">
                                {(company.showEmailFooter ?? true) && (
                                    company.footerImageUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={company.footerImageUrl} alt="Footer Preview" className="w-full h-auto" />
                                    ) : (
                                        <div className="p-8 text-center bg-gray-50 text-gray-400 text-xs uppercase tracking-wider border-dashed border-2 border-gray-200 m-2 rounded">
                                            [Footer Image Area]
                                        </div>
                                    )
                                )}

                                {(company.showCompanyAddress ?? true) && (
                                    <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">
                                        {company.address || '[Company Address will appear here]'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-gray-400 mt-2 text-center">
                        {showPreview ? 'Showing mock data for preview.' : 'Preview of structure only. Actual email width is fixed at 600px.'}
                    </p>
                </div>

                <div className="mt-6 flex justify-between">
                    <button
                        onClick={() => {
                            if (!confirm('Reset to system default?')) return;
                            const newTemplates = { ...company.emailTemplates };
                            delete newTemplates.interview_invite;
                            setCompany({ ...company, emailTemplates: newTemplates });
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                    >
                        Reset to Default
                    </button>
                    <button onClick={handleSaveCompany} className="btn-primary">Save Changes</button>
                </div>
            </div>
        </div>
    );
}
