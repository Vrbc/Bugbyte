import { BuildStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBuildDto {
  @IsString()
  @MinLength(1)
  version!: string;

  @IsString()
  @MinLength(5)
  buildUrl!: string;

  @IsOptional()
  @IsString()
  changelog?: string;

  @IsOptional()
  @IsEnum(BuildStatus)
  status?: BuildStatus;
}
