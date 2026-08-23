import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  register(@Body() registerDto: any) {
    return this.authService.registerPatient(registerDto);
  }

  @Get('check-email')
  checkEmailAvailability(@Query('email') email: string) {
    return this.authService.checkEmailAvailability(email);
  }
}
