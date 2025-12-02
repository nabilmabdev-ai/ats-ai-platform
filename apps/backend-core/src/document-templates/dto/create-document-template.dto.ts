import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDocumentTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}
