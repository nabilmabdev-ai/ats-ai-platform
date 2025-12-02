'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
    TrashIcon,
    PlusIcon,
} from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Eye, GripVertical } from 'lucide-react';

export interface OfferTemplateData {
    id?: string;
    name: string;
    content: string; // HTML content
    type: 'OFFER';
}

type BlockType = 'OPENING' | 'COMPENSATION' | 'LEGAL' | 'SIGNATURE' | 'CUSTOM' | 'OFFER_SUMMARY' | 'BRANDING_HEADER';

interface TemplateBlock {
    id: string;
    type: BlockType;
    title: string;
    content?: string;
}

// --- Icons for Blocks ---
const BlockIcons: Record<BlockType, React.ReactNode> = {
    OPENING: <span className="text-lg">👋</span>,
    COMPENSATION: <span className="text-lg">💰</span>,
    LEGAL: <span className="text-lg">⚖️</span>,
    SIGNATURE: <span className="text-lg">✍️</span>,
    CUSTOM: <span className="text-lg">📝</span>,
    OFFER_SUMMARY: <span className="text-lg">📋</span>,
    BRANDING_HEADER: <span className="text-lg">🏢</span>,
};

const UNIQUE_BLOCK_defs: { type: BlockType; title: string; desc: string; defaultContent: string }[] = [
    {
        type: 'BRANDING_HEADER',
        title: 'Branding Header',
        desc: 'Logo and company address.',
        defaultContent: '<div style="text-align: center; margin-bottom: 20px;"><img src="/logo-placeholder.png" alt="Company Logo" style="height: 40px;" /><p style="color: #666; font-size: 12px; margin-top: 5px;">{{company_address}}</p></div>'
    },
    {
        type: 'OPENING',
        title: 'Opening',
        desc: 'Greeting and introduction.',
        defaultContent: '<p>Dear {{candidate_name}},</p><p>We are pleased to offer you the position of <strong>{{job_title}}</strong> at {{company_name}}!</p>'
    },
    {
        type: 'OFFER_SUMMARY',
        title: 'Offer Summary',
        desc: 'Key details table.',
        defaultContent: '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;"><tbody><tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Role</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">{{job_title}}</td></tr><tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Salary</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${{salary}} / year</td></tr><tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Start Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">{{start_date}}</td></tr></tbody></table>'
    },
    {
        type: 'COMPENSATION',
        title: 'Compensation Details',
        desc: 'Salary, equity, and benefits text.',
        defaultContent: '<p>You will receive an annual base salary of <strong>${{salary}}</strong>, paid semi-monthly.</p><p><strong>Equity:</strong> {{equity}} stock options.</p>'
    },
    {
        type: 'LEGAL',
        title: 'Legal Terms',
        desc: 'At-will employment, confidentiality.',
        defaultContent: '<p style="font-size: 12px; color: #666;">This offer is contingent upon successful completion of background checks. Employment with {{company_name}} is at-will.</p>'
    },
    {
        type: 'SIGNATURE',
        title: 'Signature',
        desc: 'Space for candidate signature.',
        defaultContent: '<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;"><p>Please sign below to accept this offer:</p><br/><br/><div style="display: flex; justify-content: space-between;"><div style="border-top: 1px solid #000; width: 45%; padding-top: 5px;">Signature</div><div style="border-top: 1px solid #000; width: 45%; padding-top: 5px;">Date</div></div></div>'
    },
];

const AVAILABLE_VARIABLES = [
    { label: 'Candidate Name', value: '{{candidate_name}}' },
    { label: 'Job Title', value: '{{job_title}}' },
    { label: 'Company Name', value: '{{company_name}}' },
    { label: 'Company Address', value: '{{company_address}}' },
    { label: 'Salary', value: '{{salary}}' },
    { label: 'Equity', value: '{{equity}}' },
    { label: 'Start Date', value: '{{start_date}}' },
    { label: 'Manager Name', value: '{{manager_name}}' },
];

interface Props {
    initialData?: OfferTemplateData | null;
}

export default function OfferTemplateEditor({ initialData }: Props) {
    const router = useRouter();
    const { addToast } = useToast();
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Layout State
    const [isFullPagePreviewOpen, setIsFullPagePreviewOpen] = useState(false);

    const [canvasBlocks, setCanvasBlocks] = useState<TemplateBlock[]>([]);
    const [toolboxBlocks, setToolboxBlocks] = useState<TemplateBlock[]>([]);

    // Parse existing structure back into blocks
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);

            // Parse HTML structure back into blocks
            const blocks: TemplateBlock[] = [];
            const parser = new DOMParser();
            const doc = parser.parseFromString(initialData.content, 'text/html');
            const sections = doc.querySelectorAll('section[data-block-type]');

            if (sections.length > 0) {
                sections.forEach((section) => {
                    const type = section.getAttribute('data-block-type') as BlockType;
                    const title = section.getAttribute('data-block-title') || 'Section';
                    const id = section.getAttribute('data-block-id') || `block-${Date.now()}-${Math.random()}`;
                    const content = section.innerHTML;

                    blocks.push({ id, type, title, content });
                });
                setCanvasBlocks(blocks);
                // Reset toolbox (in a real app, we might filter out unique blocks that are already used)
                setToolboxBlocks(UNIQUE_BLOCK_defs.map(def => ({
                    id: `toolbox-${def.type}`, // Unique ID for toolbox items
                    type: def.type,
                    title: def.title,
                    content: def.defaultContent
                })));
            } else {
                // Fallback for legacy
                if (initialData.content) {
                    setCanvasBlocks([{
                        id: 'legacy-content',
                        type: 'CUSTOM',
                        title: 'Legacy Content',
                        content: initialData.content
                    }]);
                }
            }
        } else {
            // New Template Defaults
            setCanvasBlocks([
                // Default starting blocks
                { ...UNIQUE_BLOCK_defs.find(d => d.type === 'BRANDING_HEADER')!, id: 'default-header', content: UNIQUE_BLOCK_defs.find(d => d.type === 'BRANDING_HEADER')!.defaultContent },
                { ...UNIQUE_BLOCK_defs.find(d => d.type === 'OPENING')!, id: 'default-opening', content: UNIQUE_BLOCK_defs.find(d => d.type === 'OPENING')!.defaultContent },
                { ...UNIQUE_BLOCK_defs.find(d => d.type === 'OFFER_SUMMARY')!, id: 'default-summary', content: UNIQUE_BLOCK_defs.find(d => d.type === 'OFFER_SUMMARY')!.defaultContent },
                { ...UNIQUE_BLOCK_defs.find(d => d.type === 'COMPENSATION')!, id: 'default-comp', content: UNIQUE_BLOCK_defs.find(d => d.type === 'COMPENSATION')!.defaultContent },
                { ...UNIQUE_BLOCK_defs.find(d => d.type === 'LEGAL')!, id: 'default-legal', content: UNIQUE_BLOCK_defs.find(d => d.type === 'LEGAL')!.defaultContent },
                { ...UNIQUE_BLOCK_defs.find(d => d.type === 'SIGNATURE')!, id: 'default-sig', content: UNIQUE_BLOCK_defs.find(d => d.type === 'SIGNATURE')!.defaultContent },
            ]);
            setToolboxBlocks(UNIQUE_BLOCK_defs.map(def => ({
                id: `toolbox-${def.type}`,
                type: def.type,
                title: def.title,
                content: def.defaultContent
            })));
        }
    }, [initialData]);

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Reorder Canvas
        if (source.droppableId === 'canvas' && destination.droppableId === 'canvas') {
            const items = Array.from(canvasBlocks);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);
            setCanvasBlocks(items);
            return;
        }

        // Canvas -> Toolbox (Delete)
        if (source.droppableId === 'canvas' && destination.droppableId === 'toolbox') {
            const items = Array.from(canvasBlocks);
            items.splice(source.index, 1);
            setCanvasBlocks(items);
            return;
        }

        // Toolbox -> Canvas (Copy)
        if (source.droppableId === 'toolbox' && destination.droppableId === 'canvas') {
            const sourceBlock = toolboxBlocks[source.index];
            const newBlock = {
                ...sourceBlock,
                id: `block-${Date.now()}`, // Generate new ID
                content: sourceBlock.content // Copy default content
            };
            const destClone = Array.from(canvasBlocks);
            destClone.splice(destination.index, 0, newBlock);
            setCanvasBlocks(destClone);
            return;
        }
    };

    const addCustomBlock = () => {
        const newBlock: TemplateBlock = {
            id: `custom-${Date.now()}`,
            type: 'CUSTOM',
            title: 'Custom Section',
            content: '<p>Enter your content here...</p>'
        };
        setCanvasBlocks([...canvasBlocks, newBlock]);
    };

    const updateBlock = (id: string, field: 'title' | 'content', value: string) => {
        setCanvasBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const removeBlock = (id: string) => {
        setCanvasBlocks(prev => prev.filter(b => b.id !== id));
    };

    // --- SAVE LOGIC ---
    const handleSave = async () => {
        if (!name) return alert("Please enter a template name.");

        // Validation
        const allContent = canvasBlocks.map(b => b.content).join(' ');
        const missingVars = [];
        if (!allContent.includes('{{salary}}')) missingVars.push('Salary');
        if (!allContent.includes('{{start_date}}')) missingVars.push('Start Date');

        if (missingVars.length > 0) {
            if (!confirm(`Warning: Your template is missing common variables: ${missingVars.join(', ')}. Are you sure you want to save?`)) return;
        }

        setIsSaving(true);

        // Construct HTML with metadata attributes
        let htmlContent = '';
        canvasBlocks.forEach(block => {
            htmlContent += `<section data-block-id="${block.id}" data-block-type="${block.type}" data-block-title="${block.title}">\n`;
            htmlContent += `${block.content || ''}\n`;
            htmlContent += `</section>\n`;
        });

        const payload = {
            name,
            content: htmlContent,
            type: 'OFFER'
        };

        const method = initialData?.id ? 'PATCH' : 'POST';
        const url = initialData?.id
            ? `${process.env.NEXT_PUBLIC_API_URL}/document-templates/${initialData.id}`
            : `${process.env.NEXT_PUBLIC_API_URL}/document-templates`;

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

    // --- PREVIEW GENERATION ---
    const generatePreviewHtml = () => {
        // Replace variables with dummy data
        let html = canvasBlocks.map(b => b.content).join('<br/>');

        const dummyData: Record<string, string> = {
            '{{candidate_name}}': 'Alex Johnson',
            '{{job_title}}': 'Senior Software Engineer',
            '{{company_name}}': 'Acme Corp',
            '{{company_address}}': '123 Innovation Dr, Tech City',
            '{{salary}}': '145,000',
            '{{equity}}': '0.15%',
            '{{start_date}}': 'Oct 15, 2025',
            '{{manager_name}}': 'Sarah Connor'
        };

        Object.entries(dummyData).forEach(([key, value]) => {
            html = html.replaceAll(key, `<span class="text-blue-600 font-medium">${value}</span>`);
        });

        return html;
    };

    const usedVariables = AVAILABLE_VARIABLES.filter(v =>
        canvasBlocks.some(b => b.content?.includes(v.value))
    );

    return (
        <div className="flex flex-col h-screen bg-[var(--color-background)] overflow-hidden">

            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--color-border)] bg-white px-6 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]">
                        ←
                    </button>
                    <input
                        type="text"
                        placeholder="Template Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-lg font-bold text-[var(--color-text-dark)] bg-transparent outline-none placeholder-gray-300"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400 mr-4">
                        {canvasBlocks.length} blocks • {usedVariables.length} variables
                    </div>
                    <button
                        onClick={() => setIsFullPagePreviewOpen(true)}
                        className="h-9 px-4 rounded-[var(--radius-md)] bg-white border border-[var(--color-border)] text-[var(--color-text-dark)] text-sm font-bold hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4" /> Preview Full
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-9 px-4 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-primary-hover)] transition-all shadow-[var(--shadow-glow)] disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>

            {/* ... (Main Content) ... */}
            <div className="flex flex-1 overflow-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                    {/* ... (Toolbox, Canvas, Preview Aside) ... */}
                    <aside className="w-64 bg-gray-50 border-r border-[var(--color-border)] flex flex-col z-20">
                        {/* ... Toolbox content ... */}
                        <div className="p-4 border-b border-[var(--color-border-subtle)]">
                            <h3 className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">Smart Blocks</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <Droppable droppableId="toolbox">
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`space-y-3 min-h-[200px] transition-colors rounded-lg ${snapshot.isDraggingOver ? 'bg-red-50 border-2 border-dashed border-red-200' : ''}`}
                                    >
                                        {snapshot.isDraggingOver && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                <div className="bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-bold shadow-sm flex items-center gap-2">
                                                    <TrashIcon className="w-4 h-4" /> Drop to Remove
                                                </div>
                                            </div>
                                        )}
                                        {toolboxBlocks.map((block, index) => (
                                            <Draggable key={block.id} draggableId={block.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="bg-white p-3 rounded-lg border border-[var(--color-border)] shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing flex items-center gap-3"
                                                    >
                                                        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                                                            {BlockIcons[block.type]}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-[var(--color-text-dark)]">{block.title}</h4>
                                                            <p className="text-[10px] text-[var(--color-text-soft)] line-clamp-1">{UNIQUE_BLOCK_defs.find(d => d.type === block.type)?.desc}</p>
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
                                className="w-full mt-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-primary hover:border-primary hover:bg-primary/5 text-xs font-bold flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="w-3 h-3" />
                                Custom Block
                            </button>
                        </div>
                    </aside>

                    {/* MIDDLE: Canvas (40%) */}
                    <main className="flex-1 bg-gray-100/50 overflow-y-auto p-8 relative">
                        <div className="max-w-2xl mx-auto pb-20">
                            <Droppable droppableId="canvas">
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={`space-y-4 min-h-[400px] ${snapshot.isDraggingOver ? 'ring-2 ring-primary/20 rounded-xl' : ''}`}
                                    >
                                        {canvasBlocks.length === 0 && (
                                            <div className="text-center py-20 opacity-50">
                                                <p>Drag blocks here to start</p>
                                            </div>
                                        )}

                                        {canvasBlocks.map((block, index) => (
                                            <Draggable key={block.id} draggableId={block.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`bg-white border border-[var(--color-border)] rounded-xl shadow-sm group transition-all ${snapshot.isDragging ? 'shadow-xl rotate-1 z-50' : ''}`}
                                                    >
                                                        {/* Block Header */}
                                                        <div className="flex items-center gap-3 p-3 border-b border-gray-100 bg-gray-50/30 rounded-t-xl">
                                                            <div {...provided.dragHandleProps} className="cursor-grab text-gray-300 hover:text-gray-600">
                                                                <GripVertical className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-lg">{BlockIcons[block.type]}</div>
                                                            <input
                                                                type="text"
                                                                value={block.title}
                                                                onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
                                                                className="font-bold text-sm text-gray-800 bg-transparent outline-none flex-1"
                                                            />
                                                            <button onClick={() => removeBlock(block.id)} className="text-gray-300 hover:text-red-500">
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        {/* Rich Text Editor */}
                                                        <div className="p-0">
                                                            <RichTextEditor
                                                                initialContent={block.content || ''}
                                                                onChange={(html) => updateBlock(block.id, 'content', html)}
                                                                className="border-0 rounded-none rounded-b-xl min-h-[100px]"
                                                                variables={AVAILABLE_VARIABLES}
                                                            />
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
                    </main>

                    {/* RIGHT: Live Preview Removed */}


                </DragDropContext>
            </div>

            {/* Full Page Preview Modal */}
            {isFullPagePreviewOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-100 w-full h-full max-w-6xl rounded-xl overflow-hidden flex flex-col relative shadow-2xl">
                        {/* Modal Header */}
                        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-gray-500" /> Full Page Preview
                            </h2>
                            <button
                                onClick={() => setIsFullPagePreviewOpen(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold text-sm transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                            <div
                                className="bg-white shadow-xl w-[210mm] min-h-[297mm] p-[20mm] origin-top"
                                style={{ transform: 'scale(1)' }}
                            >
                                <div
                                    className="prose prose-base max-w-none font-serif text-gray-900"
                                    dangerouslySetInnerHTML={{ __html: generatePreviewHtml() }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
