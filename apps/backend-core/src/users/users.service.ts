import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, Role } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Use provided password or default to temp
    const password = (dto as any).password || 'password123';
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        role: dto.role as any,
        passwordHash: passwordHash,
        availability: {
          timezone: 'Europe/Paris',
          workHours: { start: 9, end: 18 },
        },
      },
    });
  }

  async updatePassword(id: string, password: string) {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  // Needed for Auth Service
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findAll(role?: string) {
    const where = role ? { role: role as any } : {};
    return this.prisma.user.findMany({
      where,
      orderBy: { fullName: 'asc' },
      // Exclude passwordHash in response (best practice is to use interceptors, but select works here)
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        availability: true,
        createdAt: true,
        _count: { select: { jobsManaged: true, interviews: true } },
      },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
