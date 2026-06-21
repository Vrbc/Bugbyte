import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GamesService } from './games.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Controller('games')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEVELOPER)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('my')
  findMyGames(@CurrentUser() user: CurrentUserPayload) {
    return this.gamesService.findMyGames(user);
  }

  @Get(':id')
  findOneGame(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.gamesService.findOneGame(user, id);
  }
  @Post()
  createGame(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateGameDto,
  ) {
    return this.gamesService.createGame(user, dto);
  }

  @Patch(':id')
  updateGame(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateGameDto,
  ) {
    return this.gamesService.updateGame(user, id, dto);
  }

  @Delete(':id')
  archiveGame(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.gamesService.archiveGame(user, id);
  }
}
