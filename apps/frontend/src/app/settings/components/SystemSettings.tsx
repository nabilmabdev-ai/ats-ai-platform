'use client';

import { useState } from 'react';
import AuditLogPage from '../audit/page';
import { ToggleSwitch } from '../utils';

// Helper Icons
const LogoLinkedIn = () => <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>;
const LogoSlack = () => <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 122.88 122.88"><path d="M25.83,82.49c0,5.55-4.5,10.05-10.05,10.05s-10.05-4.5-10.05-10.05S10.23,72.44,15.78,72.44h10.05V82.49z M25.83,61.44c-5.55,0-10.05-4.5-10.05-10.05s4.5-10.05,10.05-10.05s10.05,4.5,10.05,10.05V61.44H25.83z M40.38,61.44c0-5.55,4.5-10.05,10.05-10.05s10.05,4.5,10.05,10.05s-4.5,10.05-10.05,10.05H40.38V61.44z M61.44,61.44c0,5.55,4.5,10.05,10.05,10.05s10.05-4.5,10.05-10.05S77.04,51.39,71.49,51.39V61.44H61.44z M61.44,40.38c5.55,0,10.05,4.5,10.05,10.05S66.99,60.48,61.44,60.48s-10.05-4.5-10.05-10.05V40.38H61.44z M82.49,40.38c0,5.55-4.5,10.05-10.05,10.05S62.39,45.93,62.39,40.38s4.5-10.05,10.05-10.05H82.49V40.38z M82.49,25.83c0-5.55-4.5-10.05-10.05-10.05S62.39,20.28,62.39,25.83s4.5,10.05,10.05,10.05h10.05V25.83z M97.05,25.83c5.55,0,10.05,4.5,10.05,10.05s-4.5,10.05-10.05,10.05s-10.05-4.5-10.05-10.05V25.83H97.05z" /></svg>;
const LogoGemini = () => <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 8.5 12 8.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-10c-.83 0-1.5-.67-1.5-1.5S11.17 4.5 12 4.5s1.5.67 1.5 1.5S12.83 7.5 12 7.5z" /></svg>;


export default function SystemSettings() {
    const [activeSubTab, setActiveSubTab] = useState<'INTEGRATIONS' | 'AUDIT'>('INTEGRATIONS');

    return (
        <div>
            <div className="flex space-x-4 border-b border-gray-200 mb-6">
                <button className={`py-2 px-1 border-b-2 font-medium text-sm ${activeSubTab === 'INTEGRATIONS' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveSubTab('INTEGRATIONS')}>
                    Integrations
                </button>
                <button className={`py-2 px-1 border-b-2 font-medium text-sm ${activeSubTab === 'AUDIT' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveSubTab('AUDIT')}>
                    Audit Logs
                </button>
            </div>

            {activeSubTab === 'INTEGRATIONS' && (
                <div className="space-y-4 max-w-2xl animate-fadeIn">
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

            {activeSubTab === 'AUDIT' && (
                <div className="animate-fadeIn">
                    <AuditLogPage />
                </div>
            )}
        </div>
    );
}
