import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ApplicationsService } from './applications.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ApplyCampaignDto } from './dto/apply-campaign.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('campaigns/:campaignId/apply')
  @Roles(UserRole.TESTER)
  applyToCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('campaignId') campaignId: string,
    @Body() dto: ApplyCampaignDto,
  ) {
    return this.applicationsService.applyToCampaign(user, campaignId, dto);
  }

  @Get('campaigns/:campaignId/my-application')
  @Roles(UserRole.TESTER)
  findMyApplicationForCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('campaignId') campaignId: string,
  ) {
    return this.applicationsService.findMyApplicationForCampaign(
      user,
      campaignId,
    );
  }

  @Get('applications/my')
  @Roles(UserRole.TESTER)
  findMyApplications(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PaginationQueryDto,
  ) {
    return this.applicationsService.findMyApplications(user, query);
  }

  @Get('campaigns/:campaignId/applications')
  @Roles(UserRole.DEVELOPER)
  findApplicationsForCampaign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('campaignId') campaignId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.applicationsService.findApplicationsForCampaign(
      user,
      campaignId,
      query,
    );
  }

  @Patch('applications/:id/status')
  @Roles(UserRole.DEVELOPER)
  updateApplicationStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateApplicationStatus(user, id, dto);
  }

  @Patch('applications/:id/cancel')
  @Roles(UserRole.TESTER)
  cancelApplication(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.applicationsService.cancelApplication(user, id);
  }
}
