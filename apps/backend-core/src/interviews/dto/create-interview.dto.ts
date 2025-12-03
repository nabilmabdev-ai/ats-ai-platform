import { IsString, IsNotEmpty } from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  @IsNotEmpty()
  applicationId: string;

  @IsString()
  notes: string;
}
