import React, { useState, useMemo } from 'react';

interface JobTemplate {
    id: string;
    name: string;
    structure: string;
    defaultScreeningTemplateId?: string;
    category?: string; // Hypothetical category for now
}

interface TemplateLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: JobTemplate) => void;
    templates: JobTemplate[];
}

export default function TemplateLibraryModal({ isOpen, onClose, onSelect, templates }: TemplateLibraryModalProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Mock categories for now since the API might not return them yet
    const categories = ['All', 'Engineering', 'Product', 'Sales', 'Marketing', 'HR'];

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
            // In a real app, we'd filter by t.category. For now, we'll just simulate it or ignore if data missing
            const matchesCategory = selectedCategory === 'All' || (t.name.includes(selectedCategory));
            return matchesSearch && matchesCategory;
        });
    }, [templates, search, selectedCategory]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-[var(--color-gunmetal)]">Template Library</h2>
                        <p className="text-xs text-[var(--color-slate)]">Select a structure to jumpstart your job post.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search templates (e.g. 'Senior Backend')..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-base pl-9 py-2 text-sm w-full"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                                        ? 'bg-[var(--color-primary)] text-white shadow-md'
                                        : 'bg-gray-100 text-[var(--color-slate)] hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Auto Detect Card */}
                        <div
                            onClick={() => onSelect({ id: '', name: 'Auto-Detect Structure', structure: '' })}
                            className="group cursor-pointer bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent border border-[var(--color-primary)]/20 hover:border-[var(--color-primary)] rounded-xl p-5 transition-all hover:shadow-lg relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                                <svg className="w-16 h-16 text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center mb-3 text-xl">✨</div>
                            <h3 className="font-bold text-[var(--color-gunmetal)] mb-1">Auto-Detect</h3>
                            <p className="text-xs text-[var(--color-slate)] leading-relaxed">Let AI decide the best structure based on your job title and notes.</p>
                        </div>

                        {/* Template Cards */}
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                onClick={() => onSelect(template)}
                                className="group cursor-pointer bg-white border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]/50 rounded-xl p-5 transition-all hover:shadow-lg flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-[var(--color-primary)]/10 flex items-center justify-center text-xl transition-colors">📄</div>
                                    {template.defaultScreeningTemplateId && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Has Scorecard</span>
                                    )}
                                </div>
                                <h3 className="font-bold text-[var(--color-gunmetal)] mb-1 truncate" title={template.name}>{template.name}</h3>
                                <p className="text-xs text-[var(--color-slate)] line-clamp-2 mb-4 flex-1">
                                    {template.structure.substring(0, 100).replace(/[#*]/g, '')}...
                                </p>
                                <div className="text-[10px] font-bold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Use Template <span>→</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <div className="text-4xl mb-2">🔍</div>
                            <h3 className="text-sm font-bold text-[var(--color-gunmetal)]">No templates found</h3>
                            <p className="text-xs text-[var(--color-slate)]">Try adjusting your search terms.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-[var(--color-border-subtle)] bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="btn-ghost text-xs">Cancel</button>
                </div>
            </div>
        </div>
    );
}
