import { ApplicationStatus } from '@prisma/client';
import { IsEnum, IsIn } from 'class-validator';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  @IsIn([ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED])
  status!: ApplicationStatus;
}
