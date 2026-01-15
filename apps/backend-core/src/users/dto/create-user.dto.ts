import { IsEmail, IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export enum Role {
  ADMIN = 'ADMIN',
  RECRUITER = 'RECRUITER',
  MANAGER = 'MANAGER',
  INTERVIEWER = 'INTERVIEWER',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(Role)
  role: Role;

  @IsNotEmpty()
  availability?: {
    timezone: string;
    workHours: {
      start: number;
      end: number;
    };
  };
}
