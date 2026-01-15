import { Controller, Get, Query } from '@nestjs/common';
import { ReportingService } from './reporting.service';

@Controller('reporting')
export class ReportingController {
    constructor(private readonly reportingService: ReportingService) { }

    @Get('funnel')
    getFunnel(@Query('startDate') start?: string, @Query('endDate') end?: string) {
        return this.reportingService.getPipelineFunnel(start, end);
    }

    @Get('performance')
    getPerformance(@Query('startDate') start?: string, @Query('endDate') end?: string) {
        return this.reportingService.getRecruiterPerformance(start, end);
    }

    @Get('time-to-hire')
    getTimeToHire(@Query('startDate') start?: string, @Query('endDate') end?: string) {
        return this.reportingService.getTimeToHireTrend(start, end);
    }

    @Get('stats')
    getStats(@Query('startDate') start?: string, @Query('endDate') end?: string) {
        return this.reportingService.getDashboardStats(start, end);
    }

    @Get('source')
    getSourceEffectiveness(@Query('startDate') start?: string, @Query('endDate') end?: string) {
        return this.reportingService.getSourceEffectiveness(start, end);
    }

    @Get('rejection-reasons')
    getRejectionReasons(@Query('startDate') start?: string, @Query('endDate') end?: string) {
        return this.reportingService.getRejectionReasons(start, end);
    }
}
