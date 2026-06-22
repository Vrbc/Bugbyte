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
import { CampaignsService } from './campaigns.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEVELOPER)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('my')
  findMyCampaigns(@CurrentUser() user: CurrentUserPayload) {
    return this.campaignsService.findMyCampaigns(user);
  }

  @Get(':id')
  findOneCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.findOneCampaign(user, id);
  }

  @Post()
  createCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.createCampaign(user, dto);
  }

  @Patch(':id')
  updateCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignsService.updateCampaign(user, id, dto);
  }

  @Delete(':id')
  archiveCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.campaignsService.archiveCampaign(user, id);
  }
}
