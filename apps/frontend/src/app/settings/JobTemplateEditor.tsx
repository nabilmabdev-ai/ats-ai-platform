// --- Content from: apps/frontend/src/app/settings/JobTemplateEditor.tsx ---

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  TrashIcon,
  PlusIcon,
  SparkleIcon,
  CheckIcon
} from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

export interface JobTemplateData {
  id?: string;
  name: string;
  structure: string;
  structureJson?: any; // New field
  defaultScreeningTemplateId?: string;
  aiTone?: string;
}

interface ScreeningTemplate {
  id: string;
  name: string;
  requiredSkills?: string[] | any; // Allow flexibility for JSON
}

type BlockType = 'AI_SUMMARY' | 'AI_RESPONSIBILITIES' | 'AI_REQUIREMENTS' | 'LEGAL' | 'CUSTOM';

interface TemplateBlock {
  id: string;
  type: BlockType;
  title: string;
  content?: string; // Now allows content for ALL types
  isGenerating?: boolean; // Loading state for this specific block
}

// --- Icons for Blocks ---
const BlockIcons: Record<BlockType, React.ReactNode> = {
  AI_SUMMARY: <SparkleIcon className="w-5 h-5 text-purple-500" />,
  AI_RESPONSIBILITIES: <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  AI_REQUIREMENTS: <CheckIcon className="w-5 h-5 text-emerald-500" />,
  LEGAL: <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
  CUSTOM: <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
};

const UNIQUE_BLOCK_defs: { type: BlockType; title: string; desc: string }[] = [
  { type: 'AI_SUMMARY', title: 'Role Summary', desc: 'Brief introduction to the role.' },
  { type: 'AI_RESPONSIBILITIES', title: 'Responsibilities', desc: 'List of day-to-day duties.' },
  { type: 'AI_REQUIREMENTS', title: 'Requirements', desc: 'Skills and experience needed.' },
  { type: 'LEGAL', title: 'Legal Disclaimer', desc: 'EEO and compliance text.' },
];

interface Props {
  initialData?: JobTemplateData | null;
}

export default function JobTemplateEditor({ initialData }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGlobalGenerating, setIsGlobalGenerating] = useState(false);

  const [canvasBlocks, setCanvasBlocks] = useState<TemplateBlock[]>([]);
  const [toolboxBlocks, setToolboxBlocks] = useState<TemplateBlock[]>([]);

  const [scorecards, setScorecards] = useState<ScreeningTemplate[]>([]);
  const [selectedScorecardId, setSelectedScorecardId] = useState<string>('');
  const [aiTone, setAiTone] = useState<string>('');
  const [globalTone, setGlobalTone] = useState<string>('Professional'); // Default fallback

  // ... (Load scorecards logic remains same) ...
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/screening`)
      .then(res => res.json())
      .then(data => setScorecards(data))
      .catch(err => console.error("Failed to load scorecards", err));

    // [NEW] Fetch Global Tone
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company`)
      .then(res => res.json())
      .then(data => {
        if (data && data.aiTone) {
          setGlobalTone(data.aiTone);
        }
      })
      .catch(err => console.error("Failed to load company info", err));
  }, []);

  // Parse existing structure back into blocks
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedScorecardId(initialData.defaultScreeningTemplateId || '');
      setAiTone(initialData.aiTone || '');

      // Parse existing structure back into blocks
      if (initialData.structureJson && Array.isArray(initialData.structureJson) && initialData.structureJson.length > 0) {
        // [NEW] Use robust JSON structure if available
        setCanvasBlocks(initialData.structureJson as TemplateBlock[]);
        setToolboxBlocks([]); // Or calculate remaining if needed, but for now clear it
      } else {
        // [FALLBACK] Basic markdown parser to extract content for blocks
        // We assume the structure is: ## Title \n\n Content...
        const contentMap = new Map<string, string>();
        const sections = initialData.structure.split(/^## /m);

        // Skip the first part (title)
        for (let i = 1; i < sections.length; i++) {
          const section = sections[i];
          const firstLineEnd = section.indexOf('\n');
          if (firstLineEnd !== -1) {
            const title = section.substring(0, firstLineEnd).trim();
            const content = section.substring(firstLineEnd).trim();
            // Map title to content. Note: Titles must match exactly for this simple parser to work.
            contentMap.set(title, content);
          }
        }

        // Reset to defaults for editing ease
        const usedTypes = ['AI_SUMMARY', 'AI_RESPONSIBILITIES', 'AI_REQUIREMENTS', 'LEGAL'];
        const loadedCanvas = UNIQUE_BLOCK_defs
          .filter(def => usedTypes.includes(def.type))
          .map(def => {
            // Try to find content by title
            let content = contentMap.get(def.title) || '';

            // Clean up placeholders if they exist in the content
            if (content.includes('{{ai_summary}}')) content = '';
            if (content.includes('{{ai_responsibilities}}')) content = '';
            if (content.includes('{{ai_requirements}}')) content = '';
            if (content.includes('{{> legal_block}}')) content = '';
            if (content.includes('[Add Custom Section details here]')) content = '';

            return {
              id: def.type,
              type: def.type,
              title: def.title,
              content: content
            };
          });

        setCanvasBlocks(loadedCanvas);
        setToolboxBlocks([]);
      }
    } else {
      setCanvasBlocks([]);
      setToolboxBlocks(UNIQUE_BLOCK_defs.map(def => ({
        id: def.type,
        type: def.type,
        title: def.title,
        content: ''
      })));
    }
  }, [initialData]);

  // ... (Drag and Drop logic remains same) ...
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (source.droppableId === 'canvas' && destination.droppableId === 'canvas') {
      const items = Array.from(canvasBlocks);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setCanvasBlocks(items);
      return;
    }

    if (source.droppableId === 'toolbox' && destination.droppableId === 'canvas') {
      const sourceClone = Array.from(toolboxBlocks);
      const destClone = Array.from(canvasBlocks);
      const [movedItem] = sourceClone.splice(source.index, 1);
      destClone.splice(destination.index, 0, movedItem);
      setToolboxBlocks(sourceClone);
      setCanvasBlocks(destClone);
      return;
    }

    if (source.droppableId === 'canvas' && destination.droppableId === 'toolbox') {
      const sourceClone = Array.from(canvasBlocks);
      const destClone = Array.from(toolboxBlocks);
      const [movedItem] = sourceClone.splice(source.index, 1);
      if (movedItem.type !== 'CUSTOM') {
        destClone.splice(destination.index, 0, movedItem);
        setToolboxBlocks(destClone);
      }
      setCanvasBlocks(sourceClone);
      return;
    }
  };

  const addCustomBlock = () => {
    const newBlock: TemplateBlock = {
      id: `custom-${Date.now()}`,
      type: 'CUSTOM',
      title: 'Custom Section',
      content: ''
    };
    setCanvasBlocks([...canvasBlocks, newBlock]);
  };

  const updateBlock = (id: string, field: 'title' | 'content', value: string) => {
    setCanvasBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id: string) => {
    const blockToRemove = canvasBlocks.find(b => b.id === id);
    if (!blockToRemove) return;
    setCanvasBlocks(prev => prev.filter(b => b.id !== id));
    if (blockToRemove.type !== 'CUSTOM') {
      setToolboxBlocks(prev => [...prev, blockToRemove]);
    }
  };

  // --- AI GENERATION ---

  const generateBlockContent = async (block: TemplateBlock) => {
    if (!name) return alert("Please enter a template name (e.g. 'Senior Engineer') first to give context.");

    // Map block types to backend section types
    const typeMap: Record<string, string> = {
      'AI_SUMMARY': 'SUMMARY',
      'AI_RESPONSIBILITIES': 'RESPONSIBILITIES',
      'AI_REQUIREMENTS': 'REQUIREMENTS',
      'LEGAL': 'LEGAL',
      'CUSTOM': 'SUMMARY' // Fallback
    };

    setCanvasBlocks(prev => prev.map(b => b.id === block.id ? { ...b, isGenerating: true } : b));

    // [NEW] Resolve Tone
    const resolvedTone = aiTone || globalTone || 'Professional';

    // [NEW] Extract Skills from Scorecard (if applicable)
    let skills: string[] = [];
    if (selectedScorecardId) {
      const scorecard = scorecards.find(s => s.id === selectedScorecardId);
      if (scorecard && scorecard.requiredSkills) {
        // Handle both array of strings or JSON object (if schema varies)
        if (Array.isArray(scorecard.requiredSkills)) {
          skills = scorecard.requiredSkills as string[];
        }
      }
    }

    try {
      const res = await fetch('http://localhost:8000/generate-template-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: name, // Using template name as context
          section_type: typeMap[block.type],
          context: block.title,
          tone: resolvedTone, // Pass Tone
          skills: skills      // Pass Skills
        })
      });

      const data = await res.json();
      if (data.content) {
        updateBlock(block.id, 'content', data.content);
      }
    } catch (e) {
      console.error(e);
      alert("AI generation failed");
    } finally {
      setCanvasBlocks(prev => prev.map(b => b.id === block.id ? { ...b, isGenerating: false } : b));
    }
  };

  const generateAll = async () => {
    if (!name) return alert("Please enter a template name first.");
    setIsGlobalGenerating(true);

    // Changed from sequential for-loop to Promise.all for parallel execution
    await Promise.all(canvasBlocks.map(block => generateBlockContent(block)));

    setIsGlobalGenerating(false);
  };

  // --- SAVE LOGIC ---
  const handleSave = async () => {
    if (!name) return alert("Please enter a template name.");
    setIsSaving(true);

    // This logic decides: Do we hardcode text, or use dynamic Handlebars?
    let markdown = `# {{job_title}}\n\n`;

    canvasBlocks.forEach(block => {
      if (block.title) markdown += `## ${block.title}\n\n`;

      // If content exists, use it (Static Template). If empty, use placeholder (Dynamic Template).
      if (block.content && block.content.trim() !== '') {
        markdown += `${block.content}\n\n`;
      } else {
        // Fallback to dynamic placeholders if user left it empty
        switch (block.type) {
          case 'AI_SUMMARY': markdown += `{{ai_summary}}\n\n`; break;
          case 'AI_RESPONSIBILITIES': markdown += `{{ai_responsibilities}}\n\n`; break;
          case 'AI_REQUIREMENTS': markdown += `{{ai_requirements}}\n\n`; break;
          case 'LEGAL': markdown += `{{> legal_block}}\n\n`; break;
          case 'CUSTOM': markdown += `[Add ${block.title} details here]\n\n`; break;
        }
      }
    });

    const payload = {
      name,
      structure: markdown,
      structureJson: canvasBlocks, // [NEW] Save the robust JSON structure
      defaultScreeningTemplateId: selectedScorecardId || null,
      aiTone: aiTone || null
    };

    const method = initialData?.id ? 'PATCH' : 'POST';
    const url = initialData?.id
      ? `${process.env.NEXT_PUBLIC_API_URL}/templates/job/${initialData.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/templates/job`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addToast('Template saved successfully', 'success');
        router.refresh();
      } else {
        addToast('Failed to save template', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--color-background)]">

      {/* Header */}
      <header className="sticky top-0 z-20 flex h-20 w-full items-center justify-between border-b border-[var(--color-border)] bg-white px-8 shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]">
            <span>←</span> Back
          </button>
          <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">
            {initialData ? 'Edit Template' : 'New Template'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Template Name (e.g. Senior Java Dev)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-80 rounded-[var(--radius-md)] border-2 border-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-text-dark)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all"
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 px-6 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-hover)] transition-all shadow-[var(--shadow-glow)] disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>

          {/* LEFT: Canvas */}
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto min-h-full flex flex-col">
              <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm min-h-[600px] flex flex-col">

                {/* Toolbar */}
                <div className="px-8 py-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center bg-gray-50/50">
                  <span className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Template Structure</span>
                  <button
                    onClick={generateAll}
                    disabled={isGlobalGenerating || !name}
                    className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:bg-[var(--color-primary)]/10 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    <SparkleIcon className="w-3.5 h-3.5" />
                    {isGlobalGenerating ? 'Generating All...' : 'Auto-Fill All Content'}
                  </button>
                </div>

                <div className="flex-1 p-8 bg-white">
                  <Droppable droppableId="canvas">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`space-y-6 min-h-[400px] ${snapshot.isDraggingOver ? 'bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/20 rounded-lg p-4' : ''}`}
                      >
                        {canvasBlocks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-soft)] opacity-50 py-20">
                            <div className="w-16 h-16 mb-4 border-2 border-dashed border-current rounded-lg flex items-center justify-center text-2xl">📄</div>
                            <p>Drag blocks here to build your template</p>
                          </div>
                        )}

                        {canvasBlocks.map((block, index) => (
                          <Draggable key={block.id} draggableId={block.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative bg-white border border-[var(--color-border)] rounded-xl shadow-sm group hover:border-[var(--color-primary)]/50 transition-all ${snapshot.isDragging ? 'shadow-xl ring-2 ring-[var(--color-primary)] rotate-1 z-50' : ''}`}
                                style={provided.draggableProps.style}
                              >
                                {/* Block Header */}
                                <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)] bg-gray-50/30 rounded-t-xl">
                                  <div {...provided.dragHandleProps} className="cursor-grab text-[var(--color-neutral-300)] hover:text-[var(--color-text-dark)]">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" /></svg>
                                  </div>
                                  <div className="p-1.5 bg-white border border-[var(--color-border)] rounded-md shadow-sm">
                                    {BlockIcons[block.type]}
                                  </div>

                                  <input
                                    type="text"
                                    value={block.title}
                                    onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                                    className="font-bold text-[var(--color-text-dark)] bg-transparent outline-none w-full"
                                    placeholder="Section Title"
                                  />

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => generateBlockContent(block)}
                                      disabled={block.isGenerating}
                                      className="p-1.5 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded transition-colors"
                                      title="Generate Content for this block"
                                    >
                                      {block.isGenerating ? <span className="animate-spin block">✨</span> : <SparkleIcon className="w-4 h-4" />}
                                    </button>
                                    <button
                                      onClick={() => removeBlock(block.id)}
                                      className="p-1.5 text-[var(--color-neutral-400)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded transition-colors"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Block Content Area */}
                                <div className="p-4">
                                  <textarea
                                    value={block.content}
                                    onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                                    className="w-full text-sm text-[var(--color-text-dark)] border border-[var(--color-border)] rounded-lg p-3 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none resize-y bg-white min-h-[100px]"
                                    placeholder={`(Optional) Enter static text for this section, or leave empty to auto-generate based on job title later.`}
                                  />
                                  {block.content === '' && (
                                    <p className="text-[10px] text-[var(--color-primary)] mt-2 flex items-center gap-1">
                                      <SparkleIcon className="w-3 h-3" />
                                      <span>Will generate dynamically during job creation if left empty.</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <button
                    onClick={addCustomBlock}
                    className="w-full mt-6 py-3 border-2 border-dashed border-[var(--color-border)] rounded-lg text-[var(--color-text-soft)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Custom Block
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT: Sidebar */}
          <aside className="w-80 bg-white border-l border-[var(--color-border)] flex flex-col shadow-sm z-10">
            <div className="p-6 border-b border-[var(--color-border)]">
              <h3 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-4">Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-dark)] mb-1.5">Default Scorecard</label>
                  <div className="relative">
                    <select
                      value={selectedScorecardId}
                      onChange={(e) => setSelectedScorecardId(e.target.value)}
                      className="w-full appearance-none bg-[var(--color-neutral-50)] border border-[var(--color-border)] text-[var(--color-text-dark)] text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    >
                      <option value="">-- None --</option>
                      {scorecards.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-dark)] mb-1.5">AI Tone Override</label>
                  <div className="relative">
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      className="w-full appearance-none bg-[var(--color-neutral-50)] border border-[var(--color-border)] text-[var(--color-text-dark)] text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    >
                      <option value="">-- Default ({globalTone}) --</option>
                      <option value="Professional">Professional</option>
                      <option value="Casual">Casual</option>
                      <option value="Energetic">Energetic</option>
                      <option value="Formal">Formal</option>
                      <option value="Friendly">Friendly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-neutral-50)]/50">
              <div className="px-6 py-4 border-b border-[var(--color-border)] bg-white">
                <h3 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Available Blocks</h3>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <Droppable droppableId="toolbox">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`space-y-3 min-h-[100px] ${snapshot.isDraggingOver ? 'opacity-50' : ''}`}
                    >
                      {toolboxBlocks.map((block, index) => (
                        <Draggable key={block.id} draggableId={block.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => {
                                const sourceClone = Array.from(toolboxBlocks);
                                const destClone = Array.from(canvasBlocks);
                                const idx = sourceClone.findIndex(b => b.id === block.id);
                                if (idx !== -1) {
                                  const [movedItem] = sourceClone.splice(idx, 1);
                                  destClone.push(movedItem);
                                  setToolboxBlocks(sourceClone);
                                  setCanvasBlocks(destClone);
                                }
                              }}
                              className={`bg-white p-3 rounded-lg border border-[var(--color-border)] shadow-sm hover:shadow-md cursor-pointer active:cursor-grabbing transition-all flex items-center gap-3 ${snapshot.isDragging ? 'ring-2 ring-[var(--color-primary)] rotate-2' : ''}`}
                              style={provided.draggableProps.style}
                            >
                              <div className="w-8 h-8 rounded-md bg-[var(--color-neutral-100)] flex items-center justify-center shrink-0">
                                {BlockIcons[block.type]}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-[var(--color-text-dark)]">{block.title}</h4>
                                <p className="text-[10px] text-[var(--color-text-soft)]">Drag to add</p>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </aside>

        </DragDropContext>
      </div>
    </div>
  );
}