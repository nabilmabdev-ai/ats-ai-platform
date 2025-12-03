import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async getCompany() {
    const company = await this.prisma.company.findFirst();
    if (!company) {
      return this.prisma.company.create({
        data: {
          name: 'My Company',
          address: '',
          careerPageUrl: '',
          defaultTimezone: 'GMT',
        },
      });
    }
    return company;
  }

  async updateCompany(data: {
    name?: string;
    logoUrl?: string;
    address?: string;
    careerPageUrl?: string;
    defaultTimezone?: string;
    aiTone?: string;
    enableAutoMerge?: boolean;
  }) {
    const company = await this.getCompany();
    return this.prisma.company.update({
      where: { id: company.id },
      data,
    });
  }
}
