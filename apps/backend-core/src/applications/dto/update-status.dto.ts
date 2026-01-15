import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Matching the Prisma Enum 'AppStatus'
export enum AppStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  SOURCED = 'SOURCED',
}

export class UpdateApplicationStatusDto {
  @IsNotEmpty()
  @IsEnum(AppStatus)
  status: AppStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
