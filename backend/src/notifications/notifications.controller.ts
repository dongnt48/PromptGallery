import { Controller, Get, Post, Body, Req, UseGuards, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: any) {
    return this.notificationsService.getUserNotifications(req.user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Post()
  async createNotification(@Req() req: any, @Body() body: { message: string, type?: string }) {
    return this.notificationsService.createNotification(req.user.id, body.message, body.type);
  }
}
