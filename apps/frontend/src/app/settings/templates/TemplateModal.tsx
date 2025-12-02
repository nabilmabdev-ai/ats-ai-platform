'use client';

import React, { useState } from 'react';
import { DocumentTemplate } from './page';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  templateToEdit: DocumentTemplate | null;
}

export default function TemplateModal({ isOpen, onClose, onSave, templateToEdit }: TemplateModalProps) {
  const [name, setName] = useState(templateToEdit?.name || '');
  const [type, setType] = useState(templateToEdit?.type || 'OFFER');
  const [content, setContent] = useState(templateToEdit?.content || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, type, content });
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-text-dark)]/20 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
      <div className="modal-content w-full max-w-2xl border border-[var(--color-border)] animate-modal-in">

        <div className="flex justify-between items-start mb-6">
          <h2 className="text-h4 text-[var(--color-text-dark)]">
            {templateToEdit ? 'Edit Template' : 'New Template'}
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} key={templateToEdit?.id || 'new'} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-label uppercase tracking-widest mb-1.5 text-xs">Template Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-base"
                placeholder="e.g. Standard Offer Letter"
                required
              />
            </div>
            <div>
              <label className="block text-label uppercase tracking-widest mb-1.5 text-xs">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-base"
              >
                <option>OFFER</option>
                <option>NDA</option>
                <option>CONTRACT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-label uppercase tracking-widest mb-1.5 text-xs">Content (HTML)</label>
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-base min-h-[300px] resize-y leading-relaxed font-mono"
                placeholder="<html><body>...</body></html>"
                required
              ></textarea>
              <div className="absolute top-2 right-2 text-[10px] font-bold text-[var(--color-text-soft)] bg-white/50 px-2 py-1 rounded border border-[var(--color-border)]">
                HTML
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Save Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
