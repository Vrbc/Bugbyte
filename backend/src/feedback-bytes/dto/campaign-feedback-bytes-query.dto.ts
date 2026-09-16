import { Type } from 'class-transformer';
import { FeedbackType } from '@prisma/client';
import { IsEnum, IsInt, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class CampaignFeedbackBytesQueryDto extends PaginationQueryDto {
  @IsEnum(FeedbackType)
  type!: FeedbackType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  fromSeconds!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  toSeconds!: number;
}
