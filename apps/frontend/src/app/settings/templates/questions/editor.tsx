'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/components/AuthProvider';
import { Question, QuestionTemplate } from '@/types/question-template';
import { ArrowLeftIcon } from '@/components/ui/Icons';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export default function QuestionTemplateEditor({ params }: { params: Promise<{ id?: string }> }) {
    const router = useRouter();
    const { addToast } = useToast();
    const { user } = useAuth();
    const resolvedParams = use(params);
    const isNew = !resolvedParams.id || resolvedParams.id === 'new';

    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(!isNew);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Manual entry state
    const [manualEntry, setManualEntry] = useState('');
    const [manualCategory, setManualCategory] = useState<Question['category']>('Manual');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (!isNew && resolvedParams.id) {
            fetchTemplate(resolvedParams.id);
        }
    }, [resolvedParams.id]);

    const fetchTemplate = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/templates/questions/${id}`);
            if (res.ok) {
                const data: QuestionTemplate = await res.json();
                setTitle(data.title);
                setQuestions(data.questions);
            } else {
                addToast('Failed to load template', 'error');
                router.push('/settings/templates/questions');
            }
        } catch (error) {
            console.error(error);
            addToast('Error loading template', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!title) {
            addToast('Please enter a Role/Title first', 'warning');
            return;
        }
        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}/templates/questions/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: title }),
            });
            if (res.ok) {
                const newQuestions = await res.json();
                setQuestions(prev => [...prev, ...newQuestions]);
                addToast('Questions generated!', 'success');
            } else {
                addToast('Failed to generate questions', 'error');
            }
        } catch (error) {
            console.error(error);
            addToast('Error generating questions', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!title) {
            addToast('Please enter a template title', 'warning');
            return;
        }
        if (!user?.id) {
            addToast('You must be logged in to save templates', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const url = isNew
                ? `${API_URL}/templates/questions`
                : `${API_URL}/templates/questions/${resolvedParams.id}`;

            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    questions,
                    createdById: user.id,
                }),
            });

            if (res.ok) {
                addToast('Template saved successfully!', 'success');
                router.push('/settings/templates/questions');
            } else {
                addToast('Failed to save template', 'error');
            }
        } catch (error) {
            console.error(error);
            addToast('Error saving template', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddManual = () => {
        if (!manualEntry.trim()) return;
        setQuestions(prev => [
            ...prev,
            { id: generateId(), text: manualEntry, category: manualCategory }
        ]);
        setManualEntry('');
    };

    const handleDeleteQuestion = (id: string) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    const handleUpdateQuestion = (id: string, text: string) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, text } : q));
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/settings/templates/questions" className="p-2 rounded-lg hover:bg-[var(--color-neutral-100)]">
                    <ArrowLeftIcon className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">
                        {isNew ? 'New Question Template' : 'Edit Template'}
                    </h1>
                    <p className="text-[var(--color-text-soft)]">
                        {isNew ? 'Create a reusable list of questions.' : 'Modify your existing template.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Settings & Generation */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm">
                        <label className="block text-sm font-bold text-[var(--color-text-dark)] mb-2">
                            Template Name / Role
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none mb-4"
                            placeholder="e.g. Senior Backend Engineer"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !title}
                            className="w-full btn-secondary flex items-center justify-center gap-2 py-2.5"
                        >
                            {isGenerating ? (
                                <><span className="animate-spin">✨</span> Generating...</>
                            ) : (
                                <><span className="text-lg">✨</span> Generate with AI</>
                            )}
                        </button>
                        <p className="text-xs text-[var(--color-text-soft)] mt-2 text-center">
                            Uses the title to generate relevant questions.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-sm">
                        <h3 className="font-bold text-[var(--color-text-dark)] mb-4">Add Manually</h3>
                        <textarea
                            className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-sm min-h-[100px] mb-3"
                            placeholder="Type your question here..."
                            value={manualEntry}
                            onChange={(e) => setManualEntry(e.target.value)}
                        />
                        <div className="flex gap-2 mb-3">
                            {(['Role Specific', 'Behavioral', 'Red Flags', 'Manual'] as const).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setManualCategory(cat)}
                                    className={`
                    px-2 py-1 text-[10px] font-bold uppercase rounded-md border transition-colors
                    ${manualCategory === cat
                                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                                            : 'bg-white text-[var(--color-text-soft)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
                                        }
                  `}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleAddManual}
                            disabled={!manualEntry.trim()}
                            className="w-full btn-primary py-2 text-sm"
                        >
                            Add Question
                        </button>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full btn-primary py-3 text-lg shadow-[var(--shadow-glow)]"
                    >
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </button>
                </div>

                {/* Right: Questions List */}
                <div className="lg:col-span-2 bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-sm flex flex-col h-[600px]">
                    <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-neutral-50)] flex justify-between items-center">
                        <h3 className="font-bold text-[var(--color-text-dark)]">Questions ({questions.length})</h3>
                        <button
                            onClick={() => setQuestions([])}
                            className="text-xs text-red-500 hover:underline"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {questions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-soft)]">
                                <span className="text-4xl mb-4 grayscale opacity-30">📋</span>
                                <p>No questions yet.</p>
                                <p className="text-sm">Generate with AI or add manually.</p>
                            </div>
                        ) : (
                            questions.map((q, i) => (
                                <div key={q.id} className="group flex gap-3 items-start p-3 rounded-[var(--radius-lg)] hover:bg-[var(--color-neutral-50)] border border-transparent hover:border-[var(--color-border-subtle)] transition-all">
                                    <span className="font-mono text-xs text-[var(--color-text-soft)] mt-2 w-6">{i + 1}.</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`
                        text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full
                        ${q.category === 'Role Specific' ? 'bg-blue-50 text-blue-600' : ''}
                        ${q.category === 'Behavioral' ? 'bg-purple-50 text-purple-600' : ''}
                        ${q.category === 'Red Flags' ? 'bg-red-50 text-red-600' : ''}
                        ${q.category === 'Manual' ? 'bg-gray-100 text-gray-600' : ''}
                      `}>
                                                {q.category}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                className="text-[var(--color-text-soft)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <textarea
                                            value={q.text}
                                            onChange={(e) => handleUpdateQuestion(q.id, e.target.value)}
                                            className="w-full bg-transparent text-sm text-[var(--color-text-dark)] outline-none resize-none"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
