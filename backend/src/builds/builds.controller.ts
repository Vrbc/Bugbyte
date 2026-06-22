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
import { BuildsService } from './builds.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { CreateBuildDto } from './dto/create-build.dto';
import { UpdateBuildDto } from './dto/update-build.dto';
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEVELOPER)
export class BuildsController {
  constructor(private readonly buildsService: BuildsService) {}

  @Get('games/:gameId/builds')
  findBuildsForGame(
    @CurrentUser() user: CurrentUserPayload,
    @Param('gameId') gameId: string,
  ) {
    return this.buildsService.findBuildsForGame(user, gameId);
  }

  @Post('games/:gameId/builds')
  createBuild(
    @CurrentUser() user: CurrentUserPayload,
    @Param('gameId') gameId: string,
    @Body() dto: CreateBuildDto,
  ) {
    return this.buildsService.createBuild(user, gameId, dto);
  }

  @Patch('builds/:id')
  async updateBuild(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBuildDto,
  ) {
    return this.buildsService.updateBuild(user, id, dto);
  }

  @Delete('builds/:id')
  async archiveBuild(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.buildsService.archiveBuild(user, id);
  }
}
