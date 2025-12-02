import { Controller, Post, Body, Get, Param, Query, ParseIntPipe, ParseDatePipe } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { SaveHumanScorecardDto } from './dto/save-human-scorecard.dto';
import { SaveAiScorecardDto } from './dto/save-ai-scorecard.dto';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) { }

  // --- NEW: Get All Interviews (Calendar View) ---
  @Get()
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('startDate', new ParseDatePipe({ optional: true })) startDate?: Date,
  ) {
    return this.interviewsService.findAll(page, limit, startDate);
  }

  @Post('scorecard')
  saveScorecard(@Body() dto: SaveHumanScorecardDto) {
    return this.interviewsService.saveHumanScorecard(dto);
  }

  @Post('save-ai-scorecard')
  saveAiScorecard(@Body() dto: SaveAiScorecardDto) {
    return this.interviewsService.saveAiScorecard(dto);
  }

  @Post('analyze')
  create(@Body() createInterviewDto: CreateInterviewDto) {
    return this.interviewsService.analyzeAndSave(createInterviewDto);
  }

  @Get('application/:id')
  findByApp(@Param('id') id: string) {
    return this.interviewsService.findByApp(id);
  }

  @Get('booking/:token')
  getBookingSlots(
    @Param('token') token: string,
    @Query('tz') candidateTimeZone?: string,
  ) {
    return this.interviewsService.getAvailableSlots(token, candidateTimeZone);
  }

  @Post('booking/:token')
  confirmBooking(
    @Param('token') token: string,
    @Body() body: { slot: string },
  ) {
    return this.interviewsService.confirmBooking(token, body.slot);
  }
}
