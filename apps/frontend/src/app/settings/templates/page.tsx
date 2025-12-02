'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TemplateModal from './TemplateModal';

// --- Helper Components & Icons ---
const AddIcon = () => <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>;
const DocumentIcon = ({ type }: { type: string }) => {
  const typeMap = { OFFER: 'bg-blue-500', NDA: 'bg-purple-500', DEFAULT: 'bg-gray-500' };
  const bgColor = typeMap[type as keyof typeof typeMap] || typeMap.DEFAULT;
  return (
    <div className="relative w-full h-full p-4 flex flex-col">
      <span className={`absolute top-2 right-2 text-xs font-bold text-white ${bgColor} px-1.5 py-0.5 rounded-full`}>{type}</span>
      <div className="space-y-1.5 mt-8">
        <div className="h-2 w-3/4 bg-gray-200/80 rounded-full"></div>
        <div className="h-2 w-full bg-gray-200/80 rounded-full"></div>
        <div className="h-2 w-1/2 bg-gray-200/80 rounded-full"></div>
        <div className="h-2 w-5/6 bg-gray-200/80 rounded-full"></div>
      </div>
    </div>
  );
};
// --- End Helpers ---


export interface DocumentTemplate { id: string; name: string; type: string; content: string; createdAt: string; updatedAt: string; }

export default function DocumentTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<DocumentTemplate | null>(null);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/document-templates`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenModal = async (template: DocumentTemplate | null = null) => {
    if (template) {
      // Redirect Offer Templates to the new Block Editor
      if (template.type === 'OFFER') {
        router.push(`/settings/templates/offer/${template.id}`);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/document-templates/${template.id}`);
        if (!response.ok) throw new Error('Failed to fetch template details.');
        const fullTemplate = await response.json();
        setTemplateToEdit(fullTemplate);
        setIsModalOpen(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } else {
      setTemplateToEdit(null);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => { setIsModalOpen(false); setTemplateToEdit(null); };

  const handleSave = async (templateData: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const url = templateToEdit ? `${process.env.NEXT_PUBLIC_API_URL}/document-templates/${templateToEdit.id}` : `${process.env.NEXT_PUBLIC_API_URL}/document-templates`;
    const method = templateToEdit ? 'PATCH' : 'POST';
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(templateData) });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Failed to save template'); }
      handleCloseModal();
      await fetchTemplates();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? `Error saving: ${err.message}` : 'An unknown error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/document-templates/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete template');
      await fetchTemplates();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? `Error deleting: ${err.message}` : 'An unknown error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Document Library</h1>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{`Error: ${error}`}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Add New Card (Desktop) */}
            <div className="hidden sm:flex flex-col gap-2 aspect-[3/4]">
              <button
                onClick={() => router.push('/settings/templates/offer/new')}
                className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors text-blue-400"
              >
                <span className="text-2xl font-bold">+</span>
                <span className="mt-1 text-xs font-bold uppercase tracking-wide">New Offer</span>
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border-medium)] rounded-lg hover:border-gray-400 hover:text-gray-600 transition-colors text-gray-400"
              >
                <span className="text-xl">+</span>
                <span className="mt-1 text-xs font-medium">Other Template</span>
              </button>
            </div>

            {/* Template Cards */}
            {templates.map((template) => (
              <div key={template.id} className="group relative aspect-[3/4] bg-white border border-[var(--color-border-subtle)] rounded-lg shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleOpenModal(template)}>
                <DocumentIcon type={template.type} />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-sm border-t border-gray-100 rounded-b-lg">
                  <h3 className="font-bold text-sm text-gray-800 truncate group-hover:text-primary">{template.name}</h3>
                  <p className="text-[10px] text-gray-500">Last updated: {new Date(template.updatedAt).toLocaleDateString()}</p>
                </div>
                {/* Hover actions */}
                <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }} className="p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* FAB (Mobile) */}
      <button onClick={() => router.push('/settings/templates/offer/new')} className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg z-50">
        <AddIcon />
      </button>
      <TemplateModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} templateToEdit={templateToEdit} />
    </div>
  );
}
