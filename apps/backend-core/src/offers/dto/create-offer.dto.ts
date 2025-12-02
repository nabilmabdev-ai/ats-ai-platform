import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsUUID,
  IsObject,
} from 'class-validator';

export class CreateOfferDto {
  @IsUUID()
  @IsNotEmpty()
  applicationId: string;

  @IsUUID()
  @IsNotEmpty()
  templateId: string;

  @IsNumber()
  @IsNotEmpty()
  salary: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @IsString()
  @IsOptional()
  equity?: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsObject()
  @IsOptional()
  templateData?: Record<string, any>;
}
