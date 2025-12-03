import { IsString, IsOptional, IsArray } from 'class-validator';

export class GenerateQuestionsDto {
  @IsString()
  jobTitle: string;

  @IsString()
  @IsOptional()
  jobDescription?: string;

  @IsArray()
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  candidateName?: string;
}
