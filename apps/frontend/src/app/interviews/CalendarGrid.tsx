'use client';

import React, { useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarGridProps {
    events: any[];
    date?: Date;
    onNavigate?: (newDate: Date) => void;
    onEventClick?: (event: any) => void;
    onEventDrop?: (event: any) => void;
}

export default function CalendarGrid({ events, date, onNavigate, onEventClick }: CalendarGridProps) {

    const { components, eventPropGetter } = useMemo(() => ({
        // ... (same)
        components: {},
        eventPropGetter: (event: any) => {
            let className = 'event-confirmed';
            if (event.resource?.status === 'PENDING') className = 'event-pending';
            if (event.resource?.status === 'COMPLETED') className = 'event-completed';
            if (event.resource?.status === 'COMPLETED') className = 'event-completed';
            if (event.resource?.status === 'CANCELLED') className = 'event-cancelled';
            if (event.resource?.type === 'EXTERNAL') className = 'event-external-busy'; // Gray/Busy style
            return { className };

        }
    }), []);

    return (
        <div className="h-[800px] w-full bg-white rounded-[var(--radius-xl)] p-6 shadow-sm border border-[var(--color-border)]">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                defaultView={Views.WEEK}

                // Controlled Navigation
                date={date}
                onNavigate={onNavigate}

                eventPropGetter={eventPropGetter}
                onSelectEvent={onEventClick}
                popup
                tooltipAccessor={(e) => `${e.title} - ${e.resource?.status}`}
            />
        </div>
    );
}
