import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsInt,
  IsEnum,
  IsDateString,
  IsUUID,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

export enum JobPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum RemoteType {
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID',
  REMOTE = 'REMOTE',
}

@ValidatorConstraint({ name: 'isSalaryMaxGreaterThanMin', async: false })
export class IsSalaryMaxGreaterThanMin implements ValidatorConstraintInterface {
  validate(salaryMax: number, args: ValidationArguments) {
    const object = args.object as any;
    // Only validate if both are present
    if (object.salaryMin !== undefined && salaryMax !== undefined) {
      return salaryMax > object.salaryMin;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Salary Max must be greater than Salary Min';
  }
}

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  descriptionText: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsArray()
  requirements?: string[];

  @IsOptional()
  @IsInt()
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  @Validate(IsSalaryMaxGreaterThanMin)
  salaryMax?: number;

  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @IsOptional()
  @IsEnum(RemoteType)
  remoteType?: RemoteType;

  @IsOptional()
  @IsInt()
  headcount?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  targetHireDate?: string;

  // --- NEW: TEMPLATE IDs ---
  @IsOptional()
  @IsUUID()
  templateId?: string; // Job Structure Template

  @IsOptional()
  @IsUUID()
  screeningTemplateId?: string; // Scorecard Template

  // --- KNOCK-OUT QUESTIONS ---
  @IsOptional()
  @IsArray()
  knockoutQuestions?: Record<string, any>[];

  @IsOptional()
  @IsString()
  status?: string;
}
