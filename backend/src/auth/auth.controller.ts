import { Controller, Get, Req, UseGuards, Res, Post, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}

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
    
    res.cookie('Authentication', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userParam = encodeURIComponent(JSON.stringify(result.user));
    return res.redirect(`${frontendUrl}/login-success?user=${userParam}`);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('Authentication');
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(OptionalJwtAuthGuard)
  getProfile(@Req() req: any) {
    if (!req.user) {
      return null;
    }
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
