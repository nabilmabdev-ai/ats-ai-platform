import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Get,
  NotFoundException,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('offers')
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
  ) { }

  // --- NEW: Get All Offers ---
  @Get()
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.offersService.findAll(page, limit);
  }

  // 1. Create Draft Offer
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createOfferDto: CreateOfferDto, @Request() req: any) {
    return this.offersService.create(createOfferDto, req.user.id);
  }

  // 2. Send Offer Email
  @Post(':id/send')
  sendOffer(@Param('id') id: string) {
    return this.offersService.sendOffer(id);
  }

  // 3. Regenerate PDF
  @Post(':id/regenerate')
  regenerate(@Param('id') id: string) {
    return this.offersService.regeneratePdf(id);
  }

  // --- NEW: Request Approval ---
  @Post(':id/request-approval')
  requestApproval(@Param('id') id: string) {
    return this.offersService.requestApproval(id);
  }

  // --- NEW: Approve Offer ---
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string, @Request() req: any) {
    return this.offersService.approve(id, req.user.id);
  }

  // 4. Candidate/Recruiter Updates Status (Accept/Decline)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: OfferStatus }) {
    return this.offersService.updateStatus(id, body.status);
  }

  // 4. Get Offer for an Application
  @Get('application/:appId')
  findByApp(@Param('appId') appId: string) {
    return this.offersService.findByApp(appId);
  }
}
