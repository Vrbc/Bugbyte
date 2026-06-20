import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from '@prisma/client';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserPayload } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  // TODO: Obrisi test metode kada ne trebaju vise.
  @Get('developer-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DEVELOPER)
  developerCheck(@CurrentUser() user: CurrentUserPayload) {
    return {
      message: 'Developer route works.',
      user,
    };
  }

  @Get('tester-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TESTER)
  testerCheck(@CurrentUser() user: CurrentUserPayload) {
    return {
      message: 'Tester route works.',
      user,
    };
  }
}
