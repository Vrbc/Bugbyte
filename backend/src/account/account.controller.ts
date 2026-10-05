import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('account')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DEVELOPER, UserRole.TESTER)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('me')
  getMyAccount(@CurrentUser() user: CurrentUserPayload) {
    return this.accountService.getMyAccount(user);
  }

  @Patch('me')
  updateMyAccount(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.updateMyAccount(user, dto);
  }
}
