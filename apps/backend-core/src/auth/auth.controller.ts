import { Controller, Post, Body, HttpCode, HttpStatus, Get, Res, Query, Req } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  async googleAuth(@Res() res: Response, @Query('userId') userId: string) {
    if (!userId) {
      return res.status(HttpStatus.BAD_REQUEST).send('Missing userId');
    }
    const url = this.authService.getGoogleAuthUrl(userId);
    res.redirect(url);
  }

  @Get('google/callback')
  async googleAuthCallback(@Query('code') code: string, @Req() req, @Res() res: Response) {
    const state = req.query.state as string; // We will pass userId here
    if (!code || !state) {
      return res.redirect('http://localhost:3000/settings?error=oauth_failed');
    }

    await this.authService.handleGoogleCallback(code, state);
    // Redirect back to frontend settings
    res.redirect('http://localhost:3000/settings?success=google_connected');
  }

  @Post('magic-link')
  async sendMagicLink(@Body('email') email: string) {
    return this.authService.sendMagicLink(email);
  }

  @Post('magic-login')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(@Body('token') token: string) {
    return this.authService.verifyMagicLink(token);
  }
}
