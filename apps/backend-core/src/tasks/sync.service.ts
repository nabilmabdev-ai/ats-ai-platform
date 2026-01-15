import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleCalendarService } from '../interviews/google-calendar.service';
import { OutlookCalendarService } from '../interviews/outlook-calendar.service';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(
        private prisma: PrismaService,
        private googleCalendarService: GoogleCalendarService,
        private outlookCalendarService: OutlookCalendarService,
    ) { }

    @Cron('0 */15 * * * *')
    async handleCron() {
        this.logger.log('Starting calendar synchronization task...');

        // 1. Fetch users with connected calendars
        const users = await this.prisma.user.findMany({
            where: {
                OR: [
                    { googleAccessToken: { not: null } },
                    { outlookAccessToken: { not: null } },
                ],
            },
        });

        this.logger.log(`Found ${users.length} users to sync.`);

        for (const user of users) {
            try {
                // Future Enhancement: Implement incremental sync (fetching changes since last syncToken/time)
                // For MVP: We are relying on "Push" (Outbound) primarily. 
                // Inbound (External -> ATS) needs robust conflict resolution logic which is Phase 2.
                // For now, this cron can be used to refresh tokens or health checks.

                if (user.googleAccessToken) {
                    // Logic to refresh Google Token if needed could go here or be implicit in service calls
                }

                if (user.outlookAccessToken) {
                    // Logic to refresh Outlook Token if needed
                }

                // Placeholder: Log that we processed the user
                this.logger.debug(`Synced user ${user.email}`);

            } catch (error) {
                this.logger.error(`Failed to sync user ${user.id}`, error);
            }
        }

        this.logger.log('Calendar synchronization task finished.');
    }
}
