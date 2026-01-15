'use client';

import { useState } from 'react';
import OrganizationSettings from './components/OrganizationSettings';
import HiringSettings from './components/HiringSettings';
import CommunicationSettings from './components/CommunicationSettings';
import SystemSettings from './components/SystemSettings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'ORGANIZATION' | 'HIRING' | 'COMMUNICATION' | 'SYSTEM'>('ORGANIZATION');

  const renderTabNav = (id: 'ORGANIZATION' | 'HIRING' | 'COMMUNICATION' | 'SYSTEM', label: string, description: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`text-left w-full p-4 rounded-lg transition-all border ${activeTab === id ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-transparent border-transparent hover:bg-gray-100'}`}
    >
      <div className={`font-semibold text-sm ${activeTab === id ? 'text-blue-700' : 'text-gray-900'}`}>{label}</div>
      <div className="text-xs text-gray-500 mt-1">{description}</div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--color-soft-grey)] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your ATS automation and templates.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Navigation Sidebar */}
          <nav className="lg:col-span-3 flex flex-col gap-2">
            {renderTabNav('ORGANIZATION', 'Organization', 'Company Info, Availability')}
            {renderTabNav('HIRING', 'Hiring', 'Jobs, Offers, Scorecards')}
            {renderTabNav('COMMUNICATION', 'Communication', 'Emails, Templates')}
            {renderTabNav('SYSTEM', 'System', 'Integrations, Audit')}
          </nav>

          {/* Main Content Area */}
          <main className="lg:col-span-9">
            <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border-subtle)] p-6 min-h-[600px]">
              {activeTab === 'ORGANIZATION' && <OrganizationSettings />}
              {activeTab === 'HIRING' && <HiringSettings />}
              {activeTab === 'COMMUNICATION' && <CommunicationSettings />}
              {activeTab === 'SYSTEM' && <SystemSettings />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}