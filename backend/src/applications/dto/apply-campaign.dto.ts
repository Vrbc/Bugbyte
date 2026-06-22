import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
