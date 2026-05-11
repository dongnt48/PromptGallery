import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const result = await this.authService.validateGoogleUser(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const userParam = encodeURIComponent(JSON.stringify(result.user));
    return res.redirect(`${frontendUrl}/login-success?token=${result.accessToken}&user=${userParam}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: any) {
    return {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      name: req.user.name,
      avatarUrl: req.user.avatarUrl,
      role: req.user.role
    };
  }
}
