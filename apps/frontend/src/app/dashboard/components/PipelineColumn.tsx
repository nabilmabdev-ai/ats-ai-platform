import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import CandidateCard from '../../components/CandidateCard';
import { Application } from '../PipelineBoard';

interface PipelineColumnProps {
    statusKey: string;
    title: string;
    apps: Application[];
    isJobClosed: boolean;
    columnColor: string;
}

const EMPTY_STATE_MESSAGES: Record<string, string> = {
    SOURCED: 'Drag potential candidates here.',
    APPLIED: 'No new applicants yet.',
    SCREENING: 'Drag candidates here to start screening.',
    INTERVIEW: 'Drag candidates here to schedule interviews.',
    OFFER: 'Drag candidates here to create an offer.',
    HIRED: 'Drag hired candidates here.',
    REJECTED: 'Drag rejected candidates here.',
};

const PipelineColumn: React.FC<PipelineColumnProps> = ({
    statusKey,
    title,
    apps,
    isJobClosed,
    columnColor
}) => {
    return (
        <div className="flex flex-col w-[280px] h-full">
            {/* 1. Column Header (Sticky) */}
            <div className="flex items-center justify-between mb-3 px-1 sticky top-0 z-10 bg-[#F4F5F7] py-2 border-b border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-[var(--color-text-dark)] uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-text-soft)] opacity-50"></span>
                        {title}
                    </h2>
                    <span className="bg-white border border-[var(--color-border-subtle)] text-[var(--color-text-soft)] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {apps?.length || 0}
                    </span>
                </div>
            </div>

            {/* 2. Column Container (The Lane) */}
            <div className={`flex-1 bg-gray-50/50 rounded-xl border-t-4 border-x border-b border-gray-200/60 flex flex-col overflow-hidden relative ${columnColor}`}>
                <Droppable droppableId={statusKey} isDropDisabled={isJobClosed}>
                    {(provided, snapshot) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`
                            flex-1 overflow-y-auto px-2 py-2 transition-colors duration-200
                            ${snapshot.isDraggingOver ? 'bg-[var(--color-primary)]/5' : ''}
                        `}
                        >
                            <div className="flex flex-col gap-3">
                                {apps?.map((app, index) => (
                                    <Draggable key={app.id} draggableId={app.id} index={index}>
                                        {(provided, snapshot) => (
                                            <CandidateCard
                                                app={app}
                                                provided={provided}
                                                snapshot={snapshot}
                                            />
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>

                            {/* Empty State Illustration */}
                            {apps?.length === 0 && !snapshot.isDraggingOver && (
                                <div className="mt-4 bg-[var(--color-neutral-50)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-4 text-center">
                                    <p className="text-sm text-[var(--color-text-soft)] italic">
                                        {EMPTY_STATE_MESSAGES[statusKey] || 'Drag candidates here.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
};

export default PipelineColumn;
