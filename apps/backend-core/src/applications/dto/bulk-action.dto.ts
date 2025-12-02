import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AppStatus } from './update-status.dto';

export class BulkStatusDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  applicationIds: string[];

  @IsEnum(AppStatus)
  @IsNotEmpty()
  status: AppStatus;
}

export class BulkRejectDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  applicationIds: string[];

  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  sendEmail?: boolean;
}

export class BulkAssignDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  applicationIds: string[];

  @IsUUID()
  @IsNotEmpty()
  ownerId: string;
}

export class BulkTagDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  applicationIds: string[];

  @IsString()
  @IsNotEmpty()
  tag: string;
}
