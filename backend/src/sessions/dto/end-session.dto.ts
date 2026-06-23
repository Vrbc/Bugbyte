import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class EndSessionDto {
  @IsInt()
  @Min(1)
  @Max(5)
  finalFunRating!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  finalDifficultyRating!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  finalClarityRating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  finalComment?: string;
}
