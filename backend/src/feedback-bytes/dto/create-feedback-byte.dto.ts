import { FeedbackSeverity, FeedbackType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFeedbackByteDto {
  @IsEnum(FeedbackType)
  type!: FeedbackType;

  @IsInt()
  @Min(0)
  timestampSeconds!: number;

  @IsOptional()
  @IsEnum(FeedbackSeverity)
  severity?: FeedbackSeverity;

  @IsString()
  @MaxLength(1000)
  comment!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reproductionSteps?: string;

  @IsOptional()
  @IsString()
  screenshotUrl?: string;
}
