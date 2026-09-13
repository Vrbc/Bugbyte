import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CampaignsService } from './campaigns.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PublicCampaignsQueryDto } from './dto/public-campaigns-query.dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('public')
  @Roles(UserRole.TESTER)
  async findPublicCampaigns(@Query() query: PublicCampaignsQueryDto) {
    return this.campaignsService.findPublicCampaigns(query);
  }

  @Get('public/:id')
  @Roles(UserRole.TESTER)
  async findPublicCampaign(@Param('id') id: string) {
    return this.campaignsService.findPublicCampaign(id);
  }

  @Get('my')
  @Roles(UserRole.DEVELOPER)
  findMyCampaigns(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationQueryDto,
  ) {
    return this.campaignsService.findMyCampaigns(user, query);
  }

  @Get(':id')
  @Roles(UserRole.DEVELOPER)
  findOneCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.findOneCampaign(user, id);
  }

  @Get(':id/timeline')
  @Roles(UserRole.DEVELOPER)
  getCampaignTimeline(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.getCampaignTimeline(user, id);
  }

  @Post()
  @Roles(UserRole.DEVELOPER)
  createCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.createCampaign(user, dto);
  }

  @Patch(':id')
  @Roles(UserRole.DEVELOPER)
  updateCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.updateCampaign(user, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.DEVELOPER)
  archiveCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.archiveCampaign(user, id);
  }
}
