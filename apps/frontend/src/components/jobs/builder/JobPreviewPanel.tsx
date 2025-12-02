// --- Content from: apps/frontend/src/components/jobs/builder/JobPreviewPanel.tsx ---

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface JobPreviewPanelProps {
    description: string;
    setDescription: (value: string) => void;
    isGenerating: boolean;
    extractedSkills: string[];
    setExtractedSkills: (skills: string[]) => void;
    salaryRange: { min: number; max: number } | null;
    setSalaryRange: (range: { min: number; max: number } | null) => void;
    errors: Record<string, string>;
}

export default function JobPreviewPanel({
    description, setDescription,
    isGenerating,
    extractedSkills, setExtractedSkills,
    salaryRange, setSalaryRange,
    errors
}: JobPreviewPanelProps) {

    const [isEditing, setIsEditing] = useState(false);
    const [newSkill, setNewSkill] = useState("");
    
    const removeSkill = (index: number) => {
        setExtractedSkills(extractedSkills.filter((_, i) => i !== index));
    };

    const addSkill = () => {
        if (newSkill && !extractedSkills.includes(newSkill)) {
            setExtractedSkills([...extractedSkills, newSkill]);
            setNewSkill("");
        }
    };

    return (
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm border border-[var(--color-border)] min-h-[calc(100vh-10rem)] flex flex-col overflow-hidden">
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-8 py-4 bg-white">
                <h2 className="text-base font-bold text-[var(--color-text-dark)]">Preview & Edit</h2>
                <span className="text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider bg-[var(--color-neutral-100)] px-2 py-1 rounded-md">Markdown Supported</span>
            </div>

            <div className="p-8 flex-1 flex flex-col">
                
                {/* AI Insights Banner */}
                {(salaryRange || extractedSkills.length > 0) && (
                    <div className="mb-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]/50 p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                                    <span className="text-sm font-bold text-[var(--color-text-dark)]">AI Insights:</span>
                                    
                                    {/* SALARY DISPLAY */}
                                    {salaryRange && !isEditing && (
                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 px-3 py-1 text-xs font-bold text-[var(--color-success-text)]">
                                            <span>💰</span>
                                            <span>{salaryRange.min / 1000}k - {salaryRange.max / 1000}k</span>
                                        </div>
                                    )}

                                    {/* SKILLS DISPLAY */}
                                    {!isEditing && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {extractedSkills.map((skill, i) => (
                                                <div key={i} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
                                                    <span>{skill}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* EDITING FORM */}
                                {isEditing && (
                                    <div className="mt-2 flex flex-col gap-4">
                                        {/* Salary Editing */}
                                        <div className='flex items-center gap-2'>
                                            <label className='text-sm font-bold w-24'>Salary (k)</label>
                                            <input 
                                                type="number"
                                                className="w-24 bg-white border border-[var(--color-border)] rounded-md px-2 py-1 text-sm"
                                                value={salaryRange?.min ? salaryRange.min/1000 : ''}
                                                onChange={e => setSalaryRange({min: Number(e.target.value) * 1000, max: salaryRange?.max || 0})}
                                            />
                                            <span>-</span>
                                            <input 
                                                type="number"
                                                className="w-24 bg-white border border-[var(--color-border)] rounded-md px-2 py-1 text-sm"
                                                value={salaryRange?.max ? salaryRange.max/1000 : ''}
                                                onChange={e => setSalaryRange({min: salaryRange?.min || 0, max: Number(e.target.value) * 1000})}
                                            />
                                        </div>
                                        
                                        {/* Skills Editing */}
                                        <div className='flex items-start gap-2'>
                                            <label className='text-sm font-bold w-24 mt-1'>Skills</label>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {extractedSkills.map((skill, i) => (
                                                        <div key={i} className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 pl-3 pr-2 py-1 text-xs font-bold text-[var(--color-primary)]">
                                                            <span>{skill}</span>
                                                            <button onClick={() => removeSkill(i)} className='text-[var(--color-primary)]/50 hover:text-[var(--color-primary)]'>
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text"
                                                        className="flex-grow bg-white border border-[var(--color-border)] rounded-md px-2 py-1 text-sm"
                                                        placeholder="Add a new skill..."
                                                        value={newSkill}
                                                        onChange={e => setNewSkill(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill();}}}
                                                    />
                                                    <button onClick={addSkill} className="flex items-center justify-center h-8 w-8 rounded-md bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]">
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                             {/* EDIT BUTTON */}
                             <button onClick={() => setIsEditing(!isEditing)} className="ml-4 text-sm font-bold text-[var(--color-primary)] hover:underline flex-shrink-0">
                                {isEditing ? 'Done' : 'Edit'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Editor */}
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`
                        w-full h-full resize-none outline-none font-sans text-base leading-relaxed text-[var(--color-text-dark)] placeholder:text-[var(--color-text-soft)]/50
                        ${!description ? 'bg-transparent' : 'bg-white'}
                    `}
                    placeholder={isGenerating ? "✨ AI is crafting your job description..." : "# Job Title\n\nFill in the details on the left panel to generate a description.\n\n## Responsibilities\n- ..."}
                    style={{ minHeight: '500px' }}
                />
                
                {errors.description && (
                    <div className="mt-4 p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-lg text-sm text-[var(--color-error-text)] flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {errors.description}
                    </div>
                )}
            </div>
        </div>
    );
}