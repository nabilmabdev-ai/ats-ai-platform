import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingService {
    constructor(private prisma: PrismaService) { }

    private getDateFilter(start?: string, end?: string) {
        if (!start && !end) return {};
        return {
            createdAt: {
                gte: start ? new Date(start) : undefined,
                lte: end ? new Date(end) : undefined,
            }
        };
    }

    async getPipelineFunnel(start?: string, end?: string) {
        const raw = await this.prisma.application.groupBy({
            by: ['status'],
            _count: { id: true },
            where: this.getDateFilter(start, end)
        });

        const order = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'SOURCED'];
        return raw
            .map(item => ({ name: item.status, value: item._count.id }))
            .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
    }

    async getRecruiterPerformance(start?: string, end?: string) {
        // Use scheduledAt for filtering
        const dateFilter: any = {};
        if (start) dateFilter['scheduledAt'] = { gte: new Date(start) };
        if (end) {
            if (!dateFilter['scheduledAt']) dateFilter['scheduledAt'] = {};
            dateFilter['scheduledAt']['lte'] = new Date(end);
        }

        const interviewsFiltered = await this.prisma.interview.groupBy({
            by: ['interviewerId'],
            _count: { id: true },
            where: dateFilter
        });

        const userIds = interviewsFiltered.map(i => i.interviewerId);
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, fullName: true, email: true }
        });

        return interviewsFiltered.map(i => {
            const user = users.find(u => u.id === i.interviewerId);
            return {
                name: user?.fullName || user?.email || 'Unknown',
                interviews: i._count.id
            }
        }).sort((a, b) => b.interviews - a.interviews);
    }

    async getTimeToHireTrend(start?: string, end?: string) {
        // Defaults to last 6 months if no range provided
        let dateFilter = this.getDateFilter(start, end);
        if (!start && !end) {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            dateFilter = { createdAt: { gte: sixMonthsAgo, lte: undefined } };
        }

        const offers = await this.prisma.offer.findMany({
            where: {
                status: 'ACCEPTED',
                ...dateFilter
            },
            select: {
                createdAt: true,
                application: { select: { createdAt: true } }
            }
        });

        const monthlyData: Record<string, number[]> = {};

        offers.forEach(offer => {
            // If range is small (< 2 months), group by day? For now keep Month for simplicity
            const month = offer.createdAt.toISOString().slice(0, 7);
            const days = (new Date(offer.createdAt).getTime() - new Date(offer.application.createdAt).getTime()) / (1000 * 3600 * 24);

            if (!monthlyData[month]) monthlyData[month] = [];
            monthlyData[month].push(days);
        });

        return Object.keys(monthlyData).map(month => ({
            date: month,
            days: Math.round(monthlyData[month].reduce((a, b) => a + b, 0) / monthlyData[month].length)
        })).sort((a, b) => a.date.localeCompare(b.date));
    }

    async getDashboardStats(start?: string, end?: string) {
        const filter = this.getDateFilter(start, end);
        const [totalApps, interviewsScheduled, offersSent] = await Promise.all([
            this.prisma.application.count({ where: filter }),
            this.prisma.interview.count({
                where: {
                    status: { in: ['CONFIRMED', 'COMPLETED'] },
                    scheduledAt: filter.createdAt // Use roughly same range
                }
            }),
            this.prisma.offer.count({
                where: {
                    status: 'SENT',
                    createdAt: filter.createdAt
                }
            })
        ]);

        return {
            totalApplications: totalApps,
            activeInterviews: interviewsScheduled,
            outstandingOffers: offersSent
        };
    }

    // --- NEW METRICS ---

    async getSourceEffectiveness(start?: string, end?: string) {
        const raw = await this.prisma.application.groupBy({
            by: ['source'],
            _count: { id: true },
            where: this.getDateFilter(start, end)
        });

        return raw.map(i => ({ name: i.source || 'Unknown', value: i._count.id }))
            .sort((a, b) => b.value - a.value);
    }

    async getRejectionReasons(start?: string, end?: string) {
        const raw = await this.prisma.application.groupBy({
            by: ['rejectionReason'],
            _count: { id: true },
            where: {
                status: 'REJECTED',
                ...this.getDateFilter(start, end)
            }
        });

        return raw.filter(i => i.rejectionReason) // Exclude nulls
            .map(i => ({ name: i.rejectionReason, value: i._count.id }))
            .sort((a, b) => b.value - a.value);
    }
}
