import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  type CurrentUserPayload,
} from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('developer')
  @Roles(UserRole.DEVELOPER)
  getDeveloperDashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getDeveloperDashboard(user);
  }

  @Get('tester')
  @Roles(UserRole.TESTER)
  getTesterDashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getTesterDashboard(user);
  }
}
