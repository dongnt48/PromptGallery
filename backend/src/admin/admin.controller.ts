import {
  Controller, Get, Patch, Delete, Query, Param, Body,
  ParseIntPipe, DefaultValuePipe, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page, limit, search);
  }

  @Patch('users/bulk')
  bulkUpdateUsers(@Body() body: { ids: string[]; isDelete?: boolean }) {
    const bigIntIds = body.ids.map(id => BigInt(id));
    return this.adminService.bulkUpdateUsers(bigIntIds, { isDelete: body.isDelete });
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() body: { role?: string; isDelete?: boolean },
  ) {
    return this.adminService.updateUser(BigInt(id), body);
  }

  @Get('prompts')
  getPrompts(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getPrompts(page, limit, search);
  }

  @Patch('prompts/bulk')
  bulkUpdatePrompts(@Body() body: { ids: string[]; isDelete?: boolean; isPublic?: boolean }) {
    const bigIntIds = body.ids.map(id => BigInt(id));
    return this.adminService.bulkUpdatePrompts(bigIntIds, { 
      isDelete: body.isDelete, 
      isPublic: body.isPublic 
    });
  }

  @Delete('prompts/bulk')
  bulkDeletePrompts(@Body() body: { ids: string[] }) {
    const bigIntIds = body.ids.map(id => BigInt(id));
    return this.adminService.bulkDeletePromptsPermanently(bigIntIds);
  }

  @Patch('prompts/:id')
  updatePrompt(
    @Param('id') id: string,
    @Body() body: { isPublic?: boolean; isDelete?: boolean },
  ) {
    return this.adminService.updatePrompt(BigInt(id), body);
  }

  @Delete('prompts/:id')
  deletePrompt(@Param('id') id: string) {
    return this.adminService.deletePromptPermanently(BigInt(id));
  }
}
