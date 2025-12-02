import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class SaveHumanScorecardDto {
  @IsUUID()
  interviewId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  scorecard?: Record<string, any>; // e.g. { "React": 5, "Communication": 4 }
}
