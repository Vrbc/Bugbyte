import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTesterReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsBoolean()
  helpful!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
