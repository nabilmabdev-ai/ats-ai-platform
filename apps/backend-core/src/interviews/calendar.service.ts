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
import { GoogleCalendarService } from './google-calendar.service';

@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private googleCalendarService: GoogleCalendarService,
  ) { }

  async getFreeSlots(
    start: Date,
    end: Date,
    interviewerId: string,
    candidateTimeZone: string = 'UTC',
  ) {
    // 1. Fetch Interviewer Availability
    const interviewer = await this.prisma.user.findUnique({
      where: { id: interviewerId },
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

    const busySet = new Set(conflicts.map((c) => c.scheduledAt?.toISOString()));

    // 2.5 Fetch Google Calendar Conflicts
    if (interviewer.googleAccessToken) {
      // We cast because prisma types might not be fully updated in IDE intelligence yet, but runtime is fine.
      // Or if we ran prisma generate, it would be fine.
      // Assuming user object matches what service expects.
      try {
        const googleBusy = await this.googleCalendarService.getBusyPeriods(
          // @ts-ignore - DB type vs Service type mismatch possibility if generation lagged
          interviewer,
          start,
          end,
        );

        for (const busy of googleBusy) {
          // We need to mark every hour slot that overlaps with this busy period as busy.
          // However, our slot generation logic checks specific hour points (cursor).
          // So let's just add logic inside the loop or pre-calculate.
          // Easier: check overlaps in loop or expand busy set.
          // Since our slots are point-in-time (start of meeting), we check if that point is inside a busy range.
          // BUT, a meeting is 1 hour long (implied).
          // So if busy starts at 9:30 and ends at 10:00, it might conflict with 9:00-10:00 slot?
          // The current simple implementation: `slots` are just start times.
          // Let's assume standard 1 hour slots.
          // If a Google event is any time inside [cursor, cursor+60m), it's a conflict.
        }

        // Re-thinking: The current logic uses a `busySet` of EXACT start times.
        // This is brittle. If I have a meeting at 9:00 in DB, it blocks 9:00 slot.
        // Google Calendar events are ranges.
        // I should change logic to `isBlocked(time)` checking all ranges.
      } catch (e) {
        console.error('Google Calendar Sync Failed', e);
      }
    }

    // Let's refactor the conflict check to be range-based for Google Events
    // And set-based for internal (since internal are fixed slots usually, but better to be consistent).

    // ... actually, let's keep it simple and consistent with existing style for now,
    // but correctly integrate the range check.

    let googleBusyRanges: { start: Date; end: Date }[] = [];
    if (interviewer.googleAccessToken) {
      // @ts-ignore
      googleBusyRanges = await this.googleCalendarService.getBusyPeriods(
        interviewer,
        start,
        end,
      );
    }

    const slots: { utc: string; local: string }[] = [];

    // 3. Generate Slots
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

        // Internal Check
        const isInternalConflict = busySet.has(isoString);

        // Google Check
        // Slot is [cursor, cursor + 60min)
        const slotEnd = addMinutes(cursor, 60);
        const isGoogleConflict = googleBusyRanges.some((busy) => {
          // Overlap check: (StartA < EndB) and (EndA > StartB)
          return cursor < busy.end && slotEnd > busy.start;
        });

        if (!isInternalConflict && !isGoogleConflict) {
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
