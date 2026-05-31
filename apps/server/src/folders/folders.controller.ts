import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import {
  CreateFolderDto,
  UpdateFolderDto,
  PresignFolderFileDto,
  SaveFolderFileDto,
} from './folders.dto';
import {
  OptionalAuth,
  AdminOnly,
  Public,
} from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

interface JwtUser {
  id: number;
  role: string;
}

@Controller('folders')
export class FoldersController {
  constructor(private folders: FoldersService) {}

  @OptionalAuth()
  @Get()
  getRootFolders(@CurrentUser() user: JwtUser | null) {
    return this.folders.getRootFolders(user?.role === 'admin');
  }

  // 注意：必须在 :id 路由之前声明，避免被当作 id 匹配
  @Public()
  @Get('public-files')
  getPublicFiles(@Query('type') type?: string) {
    return this.folders.getPublicFiles(type);
  }

  @OptionalAuth()
  @Get(':id')
  getFolderContent(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser | null,
  ) {
    return this.folders.getFolderContent(id, user?.role === 'admin');
  }

  @AdminOnly()
  @Post()
  createFolder(@Body() dto: CreateFolderDto) {
    return this.folders.createFolder(dto);
  }

  @AdminOnly()
  @Patch(':id')
  updateFolder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.folders.updateFolder(id, dto);
  }

  @AdminOnly()
  @Delete(':id')
  deleteFolder(@Param('id', ParseIntPipe) id: number) {
    return this.folders.deleteFolder(id);
  }

  @AdminOnly()
  @Post(':id/presign')
  presign(
    @Param('id', ParseIntPipe) _id: number,
    @Body() dto: PresignFolderFileDto,
  ) {
    return this.folders.generatePresignUrl(dto.filename, dto.contentType);
  }

  @AdminOnly()
  @Post(':id/files')
  saveFile(@Body() dto: SaveFolderFileDto) {
    return this.folders.saveFile(dto);
  }

  @AdminOnly()
  @Delete(':id/files/:fileId')
  deleteFile(
    @Param('id', ParseIntPipe) folderId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    return this.folders.deleteFile(folderId, fileId);
  }
}
