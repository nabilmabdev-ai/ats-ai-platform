'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    BoldIcon,
    ItalicIcon,
    ListIcon,
    LinkIcon,
    TypeIcon
} from 'lucide-react';

interface RichTextEditorProps {
    initialContent: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    variables?: { label: string; value: string }[];
}

export default function RichTextEditor({ initialContent, onChange, placeholder, className = '', variables = [] }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Initialize content
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== initialContent) {
            // Only update if significantly different to avoid cursor jumping
            // Simple check: if empty or initial load
            if (!editorRef.current.innerHTML || editorRef.current.innerHTML === '<br>') {
                editorRef.current.innerHTML = initialContent;
            }
        }
    }, []); // Run once on mount, or we need smarter diffing

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            onChange(html);
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    const insertVariable = (variable: string) => {
        // Ensure focus is in the editor before inserting
        if (editorRef.current && document.activeElement !== editorRef.current) {
            editorRef.current.focus();
        }

        // Insert as a non-editable chip
        const chipHtml = `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 select-none" contenteditable="false" data-variable="${variable}">${variable}</span>&nbsp;`;
        document.execCommand('insertHTML', false, chipHtml);
        handleInput();
    };

    return (
        <div className={`flex flex-col border border-[var(--color-border)] rounded-lg overflow-hidden bg-white ${isFocused ? 'ring-2 ring-[var(--color-primary)]/20 border-[var(--color-primary)]' : ''} ${className}`}>
            {/* Toolbar */}
            <div className="flex flex-col border-b border-[var(--color-border-subtle)] bg-gray-50/50">
                <div className="flex items-center gap-1 p-2">
                    <ToolbarButton onClick={() => execCommand('bold')} icon={<BoldIcon className="w-4 h-4" />} label="Bold" />
                    <ToolbarButton onClick={() => execCommand('italic')} icon={<ItalicIcon className="w-4 h-4" />} label="Italic" />
                    <div className="w-px h-4 bg-gray-300 mx-1" />
                    <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={<ListIcon className="w-4 h-4" />} label="Bullet List" />
                    <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={<TypeIcon className="w-4 h-4" />} label="Numbered List" />
                </div>

                {/* Variable Picker (if variables provided) */}
                {variables.length > 0 && (
                    <div className="px-2 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                        {variables.map(v => (
                            <button
                                key={v.value}
                                onMouseDown={(e) => { e.preventDefault(); insertVariable(v.value); }}
                                className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 whitespace-nowrap font-medium transition-colors border border-blue-100"
                            >
                                + {v.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                className="flex-1 p-4 min-h-[150px] outline-none text-sm text-[var(--color-text-dark)] leading-relaxed overflow-y-auto"
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                dangerouslySetInnerHTML={{ __html: initialContent }}
            />
        </div>
    );
}

function ToolbarButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title={label}
        >
            {icon}
        </button>
    );
}
