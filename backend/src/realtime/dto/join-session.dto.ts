import { IsNotEmpty, IsString } from 'class-validator';

export class JoinSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
