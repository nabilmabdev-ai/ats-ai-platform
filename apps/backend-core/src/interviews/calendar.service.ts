import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  addMinutes,
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
import { OutlookCalendarService } from './outlook-calendar.service';

interface Availability {
  timezone?: string;
  workHours?: { start: number; end: number };
}

@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private googleCalendarService: GoogleCalendarService,
    private outlookCalendarService: OutlookCalendarService,
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

    const availability = (interviewer.availability as unknown as Availability) || {
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

    // 2.5 Fetch External Conflicts
    let externalBusyRanges: { start: Date; end: Date }[] = [];

    // Google
    if (interviewer.googleAccessToken) {
      try {
        const googleBusy = await this.googleCalendarService.getBusyPeriods(
          // @ts-ignore
          interviewer,
          start,
          end,
        );
        externalBusyRanges = [...externalBusyRanges, ...googleBusy];
      } catch (e) {
        console.error('Google Calendar Sync Failed', e);
      }
    }

    // Outlook
    if (interviewer.outlookAccessToken) {
      try {
        const outlookBusy = await this.outlookCalendarService.getBusyPeriods(
          // @ts-ignore
          interviewer,
          start,
          end,
        );
        externalBusyRanges = [...externalBusyRanges, ...outlookBusy];
      } catch (e) {
        console.error('Outlook Calendar Sync Failed', e);
      }
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

        // External Check
        // Slot is [cursor, cursor + 60min)
        const slotEnd = addMinutes(cursor, 60);
        const isExternalConflict = externalBusyRanges.some((busy) => {
          // Overlap check: (StartA < EndB) and (EndA > StartB)
          return cursor < busy.end && slotEnd > busy.start;
        });

        if (!isInternalConflict && !isExternalConflict) {
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

  async getAvailability(interviewerId: string, start: Date, end: Date) {
    const interviewer = await this.prisma.user.findUnique({
      where: { id: interviewerId },
    });

    if (!interviewer) return [];

    let busySlots: { start: Date; end: Date; source: string }[] = [];

    // Google
    if (interviewer.googleAccessToken) {
      try {
        const googleBusy = await this.googleCalendarService.getBusyPeriods(
          interviewer,
          start,
          end,
        );
        busySlots.push(...googleBusy.map(b => ({ ...b, source: 'Google' })));
      } catch (e) {
        console.error('Google Calendar Fetch Failed', e);
      }
    }

    // Outlook
    if (interviewer.outlookAccessToken) {
      try {
        const outlookBusy = await this.outlookCalendarService.getBusyPeriods(
          interviewer,
          start,
          end,
        );
        busySlots.push(...outlookBusy.map(b => ({ ...b, source: 'Outlook' })));
      } catch (e) {
        console.error('Outlook Calendar Fetch Failed', e);
      }
    }

    return busySlots;
  }


  async syncEventToExternal(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        interviewer: true,
        application: {
          include: {
            candidate: true,
            job: true,
          }
        }
      }
    });

    if (!interview || !interview.interviewer || !interview.scheduledAt) return;

    const user = interview.interviewer;

    // Google Sync
    if (user.googleAccessToken) {
      await this.googleCalendarService.createEvent(user, interview);
    }

    // Outlook Sync
    if (user.outlookAccessToken) {
      await this.outlookCalendarService.createEvent(user, interview);
    }
  }
}
