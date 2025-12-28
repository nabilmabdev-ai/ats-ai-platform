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
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('offers')
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly prisma: PrismaService,
  ) {}

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
  async create(@Body() createOfferDto: CreateOfferDto) {
    // Mock Auth: Get first user to act as Creator
    const user = await this.prisma.user.findFirst();
    if (!user)
      throw new NotFoundException('No system user found to create offer');

    return this.offersService.create(createOfferDto, user.id);
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
