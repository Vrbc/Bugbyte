import { GameStatus } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateGameDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsString()
  @MinLength(2)
  genre!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  platforms!: string[];

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;
}
