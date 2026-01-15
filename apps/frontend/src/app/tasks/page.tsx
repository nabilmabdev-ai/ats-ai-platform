'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Plus, Sparkles, Calendar, Trash2, Check, X, Users } from 'lucide-react';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';

function getInitials(name: string) {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function Avatar({ name, email, className = '' }: { name?: string | null, email: string, className?: string }) {
    const initials = getInitials(name || email);
    const colorHash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['bg-red-100 text-red-600', 'bg-green-100 text-green-600', 'bg-blue-100 text-blue-600', 'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600'];
    const colorClass = colors[colorHash % colors.length];

    return (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm ${colorClass} ${className}`} title={name || email}>
            {initials}
        </div>
    );
}

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate: string;
    relatedEntityType?: string; // CANDIDATE, JOB
    relatedEntityId?: string;
    assignedTo?: {
        id: string;
        fullName?: string;
        email: string;
    };
    createdById?: string;
    createdBy?: {
        id: string;
        fullName?: string;
    };
}

interface AISuggestion {
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueInDays: number;
}

export default function TasksPage() {
    const { token } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'MANUAL' | 'AI'>('MANUAL');

    // Manual Form State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');

    const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('MEDIUM');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    // AI State
    const [aiContext, setAiContext] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
                headers: { 'Authorization': `Bearer ${token || localStorage.getItem('access_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Failed to fetch tasks', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [token]);

    const handleCreateTask = async (taskData: any) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || localStorage.getItem('access_token')}`
                },
                body: JSON.stringify(taskData)
            });

            if (res.ok) {
                fetchTasks();
                return true;
            }
        } catch (err) {
            console.error(err);
        }
        return false;
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await handleCreateTask({
            title: newTaskTitle,
            description: newTaskDesc,
            priority: newTaskPriority,
            dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined
        });
        if (success) {
            closeModal();
            resetForm();
        }
    };

    const handleAiGenerate = async () => {
        if (!aiContext.trim()) return;
        setIsGenerating(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ context: aiContext })
            });
            if (res.ok) {
                const data = await res.json();
                setAiSuggestions(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAcceptSuggestion = async (suggestion: AISuggestion) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + suggestion.dueInDays);

        await handleCreateTask({
            title: suggestion.title,
            description: suggestion.description,
            priority: suggestion.priority,
            dueDate: dueDate.toISOString()
        });
        // Remove from list
        setAiSuggestions(prev => prev.filter(s => s !== suggestion));
        // If empty, maybe close modal? nah
    };

    const handleToggleTask = async (task: Task) => {
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
        // Optimistic
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token || localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (err) {
            fetchTasks(); // Revert
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm('Delete this task?')) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token || localStorage.getItem('access_token')}`
                }
            });
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const closeModal = () => setIsModalOpen(false);
    const resetForm = () => {
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskPriority('MEDIUM');
        setNewTaskDueDate('');
        setAiContext('');
        setAiSuggestions([]);
    };

    const priorityColor = (p: string) => {
        switch (p) {
            case 'URGENT': return 'bg-red-50 text-red-700 border border-red-200';
            case 'HIGH': return 'bg-orange-50 text-orange-700 border border-orange-200';
            case 'MEDIUM': return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'LOW': return 'bg-gray-50 text-gray-600 border border-gray-200';
            default: return 'bg-gray-50 text-gray-600 border border-gray-200';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return formatDistanceToNow(date, { addSuffix: true });
    };

    const stats = {
        total: tasks.length,
        done: tasks.filter(t => t.status === 'DONE').length,
        urgent: tasks.filter(t => t.priority === 'URGENT' && t.status !== 'DONE').length,
        pending: tasks.filter(t => t.status === 'TODO').length
    };

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen">
            <header className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">My Tasks</h1>
                    <p className="text-gray-500 text-lg">Manage your daily goals and recruiting activities.</p>
                </div>
                <button
                    onClick={() => { setIsModalOpen(true); setModalMode('MANUAL'); }}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </header>

            {/* Task Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Total Tasks</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-600">{stats.done}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Pending</div>
                    <div className="text-2xl font-bold text-indigo-600">{stats.pending}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">Urgent</div>
                    <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                </div>
            </div>

            {/* Task List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse"></div>)}
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <div className="text-6xl mb-6 opacity-80">📝</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No tasks yet</h3>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Your list is empty. Create a task manually or use our AI to plan your day.</p>
                    <button
                        onClick={() => { setIsModalOpen(true); setModalMode('AI'); }}
                        className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
                    >
                        <Sparkles className="w-4 h-4" />
                        Try AI Suggestions
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tasks.sort((a, b) => (a.status === 'DONE' ? 1 : 0) - (b.status === 'DONE' ? 1 : 0)).map(task => (
                        <div
                            key={task.id}
                            className={`group relative bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-indigo-100 transition-all duration-200 ${task.status === 'DONE' ? 'opacity-50 grayscale-[0.5] bg-gray-50' : ''}`}
                        >
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => handleToggleTask(task)}
                                    className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${task.status === 'DONE'
                                        ? 'bg-green-500 border-green-500 text-white scale-110'
                                        : 'border-gray-200 hover:border-indigo-500 text-transparent hover:bg-indigo-50'
                                        }`}
                                >
                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-lg font-semibold truncate pr-4 ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                            {task.title}
                                        </h3>
                                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </div>

                                    {task.description && (
                                        <p className={`mt-1 text-gray-600 text-sm line-clamp-2 ${task.status === 'DONE' ? 'line-through text-gray-300' : ''}`}>
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-medium">
                                        {task.dueDate && (
                                            <div className={`flex items-center gap-1.5 ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-600 font-semibold' : ''}`}>
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(task.dueDate)}
                                            </div>
                                        )}

                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                                    title="Delete Task"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex border-b border-gray-100 rounded-t-2xl overflow-hidden">
                            <button
                                onClick={() => setModalMode('MANUAL')}
                                className={`flex-1 py-4 text-sm font-medium transition-colors ${modalMode === 'MANUAL' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Manual Entry
                            </button>
                            <button
                                onClick={() => setModalMode('AI')}
                                className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${modalMode === 'AI' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Sparkles className="w-4 h-4" />
                                AI Suggestions
                            </button>
                            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {modalMode === 'MANUAL' ? (
                                <form onSubmit={handleManualSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={newTaskTitle}
                                            onChange={e => setNewTaskTitle(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none"
                                            placeholder="e.g. Call Candidate X"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            rows={3}
                                            value={newTaskDesc}
                                            onChange={e => setNewTaskDesc(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none resize-none"
                                            placeholder="Details..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                            <select
                                                value={newTaskPriority}
                                                onChange={e => setNewTaskPriority(e.target.value as any)}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none"
                                            >
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="URGENT">Urgent</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                            <input
                                                type="date"
                                                value={newTaskDueDate}
                                                onChange={e => setNewTaskDueDate(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 font-medium hover:bg-gray-50 bg-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-black text-white font-medium hover:bg-gray-800"
                                        >
                                            Create Task
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 p-4 rounded-xl text-indigo-900 text-sm">
                                        <p className="flex gap-2">
                                            <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            Tell me what you're working on, and I'll suggest actionable tasks.
                                        </p>
                                    </div>
                                    <textarea
                                        value={aiContext}
                                        onChange={e => setAiContext(e.target.value)}
                                        placeholder="e.g. I just finished interviewing a Senior Backend Dev, and they did great but were expensive..."
                                        className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                                    />
                                    <button
                                        onClick={handleAiGenerate}
                                        disabled={isGenerating || !aiContext.trim()}
                                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isGenerating ? 'Analyzing...' : 'Generate Suggestions'}
                                        {!isGenerating && <Sparkles className="w-4 h-4" />}
                                    </button>

                                    {aiSuggestions.length > 0 && (
                                        <div className="mt-6 space-y-3">
                                            <h4 className="font-semibold text-gray-900">Suggested Tasks</h4>
                                            {aiSuggestions.map((suggestion, idx) => (
                                                <div key={idx} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-200 transition-colors flex gap-3 group">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${priorityColor(suggestion.priority)}`}>
                                                                {suggestion.priority}
                                                            </span>
                                                            <span className="text-gray-900 font-medium text-sm">{suggestion.title}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">{suggestion.description}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAcceptSuggestion(suggestion)}
                                                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors self-center"
                                                        title="Add to Tasks"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
