import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class SaveAiScorecardDto {
  @IsString()
  @IsNotEmpty()
  interviewId: string;

  @IsObject()
  @IsNotEmpty()
  scorecard: any;
}
