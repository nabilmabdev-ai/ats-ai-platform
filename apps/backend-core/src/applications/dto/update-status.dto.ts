import { IsEnum, IsNotEmpty } from 'class-validator';

// Matching the Prisma Enum 'AppStatus'
export enum AppStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

export class UpdateApplicationStatusDto {
  @IsNotEmpty()
  @IsEnum(AppStatus)
  status: AppStatus;
}
