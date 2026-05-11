import {
  Controller, Get, Post, Query, Param, Req, Body,
  ParseIntPipe, DefaultValuePipe, UseGuards, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { PromptsService } from './prompts.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('prompts')
export class PromptsController {
  constructor(
    private readonly promptsService: PromptsService,
    private readonly jwtService: JwtService,
  ) {}

  private getUserIdFromRequest(req: any): bigint | undefined {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }
    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token);
      return BigInt(payload.sub);
    } catch {
      return undefined;
    }
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Req() req: any,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.promptsService.findAll(page, limit, userId);
  }

  @Get('status/:jobId')
  getJobStatus(@Param('jobId') jobId: string) {
    return this.promptsService.getJobStatus(jobId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = this.getUserIdFromRequest(req);
    return this.promptsService.findOne(BigInt(id), userId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('images', 5))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
    @Req() req: any,
  ) {
    const tags = body.tags ? (typeof body.tags === 'string' ? JSON.parse(body.tags) : body.tags) : [];
    const isPublic = body.isPublic === 'true' || body.isPublic === true;

    return this.promptsService.createPromptQueued(
      req.user.id,
      {
        content: body.content,
        aiModel: body.aiModel || 'Unknown',
        isPublic,
        tags,
        negativePrompt: body.negativePrompt || undefined,
      },
      files || [],
    );
  }

  @Post(':id/like')
  @UseGuards(AuthGuard('jwt'))
  async toggleLike(@Param('id') id: string, @Req() req: any) {
    return this.promptsService.toggleLike(req.user.id, BigInt(id));
  }

  @Post(':id/bookmark')
  @UseGuards(AuthGuard('jwt'))
  async toggleBookmark(@Param('id') id: string, @Req() req: any) {
    return this.promptsService.toggleBookmark(req.user.id, BigInt(id));
  }
}
