'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { QuestionTemplate } from '@/types/question-template';

export default function QuestionTemplatesPage() {
    const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();
    const { addToast } = useToast();
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchTemplates();
    }, [searchQuery]);

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/templates/questions?q=${searchQuery}`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
            addToast('Failed to load templates', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            const res = await fetch(`${API_URL}/templates/questions/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                addToast('Template deleted successfully', 'success');
                fetchTemplates();
            } else {
                addToast('Failed to delete template', 'error');
            }
        } catch (error) {
            console.error(error);
            addToast('Error deleting template', 'error');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">Question Templates</h1>
                    <p className="text-[var(--color-text-soft)]">Manage your interview question scripts.</p>
                </div>
                <Link
                    href="/settings/templates/questions/new"
                    className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
                >
                    <span>+</span> New Template
                </Link>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search templates..."
                    className="w-full max-w-md px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] hover:shadow-md transition-shadow group relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-[var(--color-text-dark)] text-lg">{template.title}</h3>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link
                                        href={`/settings/templates/questions/${template.id}`}
                                        className="p-1 text-[var(--color-text-soft)] hover:text-[var(--color-primary)]"
                                    >
                                        ✏️
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-1 text-[var(--color-text-soft)] hover:text-red-500"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="text-xs text-[var(--color-text-soft)] uppercase tracking-wider font-bold">Preview</div>
                                <ul className="space-y-1">
                                    {template.questions.slice(0, 3).map((q, i) => (
                                        <li key={i} className="text-sm text-[var(--color-text-dark)] truncate">
                                            • {q.text}
                                        </li>
                                    ))}
                                    {template.questions.length > 3 && (
                                        <li className="text-xs text-[var(--color-text-soft)] italic">
                                            + {template.questions.length - 3} more questions
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border-subtle)]">
                                <span className="text-xs text-[var(--color-text-soft)]">
                                    {new Date(template.createdAt).toLocaleDateString()}
                                </span>
                                <span className="text-xs font-medium px-2 py-1 bg-[var(--color-neutral-100)] rounded-full text-[var(--color-text-soft)]">
                                    {template.questions.length} Qs
                                </span>
                            </div>
                        </div>
                    ))}

                    {templates.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-[var(--color-neutral-50)] rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)]">
                            <p className="text-[var(--color-text-soft)]">No templates found. Create one to get started!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
