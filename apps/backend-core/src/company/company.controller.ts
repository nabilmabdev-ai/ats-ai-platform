import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  getCompany() {
    return this.companyService.getCompany();
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  updateCompany(@Body() body: any) {
    return this.companyService.updateCompany(body);
  }
}
