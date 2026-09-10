import { BuildStatus } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateBuildDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  version?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  buildUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  changelog?: string;

  @IsOptional()
  @IsEnum(BuildStatus)
  status?: BuildStatus;
}
