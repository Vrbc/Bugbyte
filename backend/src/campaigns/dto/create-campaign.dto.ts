import { CampaignStatus, CampaignType } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString()
  gameId!: string;

  @IsString()
  buildId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsEnum(CampaignType)
  type!: CampaignType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(10)
  instructions!: string;

  @IsInt()
  @Min(1)
  requiredTesters!: number;

  @IsNumber()
  @Min(0)
  minTesterRating!: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  requiredPlatforms!: string[];

  @IsInt()
  @Min(1)
  estimatedMinutes!: number;

  @IsOptional()
  @IsEnum(CampaignStatus)
  @IsIn([CampaignStatus.DRAFT, CampaignStatus.ACTIVE])
  status?: CampaignStatus;
}
