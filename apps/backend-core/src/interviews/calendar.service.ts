import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    addMinutes,
    eachMinuteOfInterval,
    format,
    getDay,
    getHours,
    isBefore,
    parseISO,
    setHours,
    setMinutes,
    startOfHour,
} from 'date-fns';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class CalendarService {
    constructor(private prisma: PrismaService) { }

    async getFreeSlots(
        start: Date,
        end: Date,
        interviewerId: string,
        candidateTimeZone: string = 'UTC',
    ) {
        // 1. Fetch Interviewer Availability
        const interviewer = await this.prisma.user.findUnique({
            where: { id: interviewerId },
            select: { availability: true, fullName: true },
        });

        if (!interviewer) {
            throw new Error('Interviewer not found');
        }

        const availability = (interviewer.availability as any) || {
            timezone: 'UTC',
            workHours: { start: 9, end: 17 },
        };

        const interviewerTz = availability.timezone || 'UTC';
        const workStartHour = availability.workHours?.start || 9;
        const workEndHour = availability.workHours?.end || 17;

        // 2. Fetch Existing Conflicts (in UTC)
        const conflicts = await this.prisma.interview.findMany({
            where: {
                interviewerId: interviewerId,
                status: { in: ['CONFIRMED', 'PENDING'] }, // Pending also blocks
                scheduledAt: {
                    gte: start,
                    lte: end,
                },
            },
            select: { scheduledAt: true },
        });

        const busySet = new Set(
            conflicts.map((c) => c.scheduledAt?.toISOString()),
        );

        const slots: { utc: string; local: string }[] = [];

        // 3. Generate Slots
        // We iterate in the INTERVIEWER'S timezone to respect working hours
        // But we need to be careful. It's easier to iterate in UTC and check if it falls in working hours in their TZ.

        // Let's iterate hour by hour from start to end
        let cursor = startOfHour(start);
        if (isBefore(cursor, start)) {
            cursor = addMinutes(cursor, 60);
        }

        while (isBefore(cursor, end)) {
            // Convert current UTC cursor to Interviewer's Timezone
            const interviewerTime = toZonedTime(cursor, interviewerTz);
            const day = getDay(interviewerTime); // 0 = Sun, 6 = Sat
            const hour = getHours(interviewerTime);

            const isWeekend = day === 0 || day === 6;
            const isWorkHours = hour >= workStartHour && hour < workEndHour;

            if (!isWeekend && isWorkHours) {
                const isoString = cursor.toISOString();
                if (!busySet.has(isoString)) {
                    // Format for Candidate
                    const candidateTime = formatInTimeZone(
                        cursor,
                        candidateTimeZone,
                        'yyyy-MM-dd HH:mm zzz',
                    );
                    slots.push({
                        utc: isoString,
                        local: candidateTime,
                    });
                }
            }

            cursor = addMinutes(cursor, 60);
        }

        return {
            interviewerName: interviewer.fullName,
            interviewerTimeZone: interviewerTz,
            candidateTimeZone: candidateTimeZone,
            slots,
        };
    }
}
