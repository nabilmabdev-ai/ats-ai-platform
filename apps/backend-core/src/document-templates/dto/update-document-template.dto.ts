import { IsString, IsOptional } from 'class-validator';

export class UpdateDocumentTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  type?: string;
}
