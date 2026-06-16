import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourcesService } from './resources.service';
import type { UploadedResourceFile } from './resources.service';
import { PresignDto, SaveResourceDto, ResourceQueryDto } from './resources.dto';
import { Public, AdminOnly } from '../common/decorators/auth.decorator';

@Controller('resources')
export class ResourcesController {
  constructor(private resources: ResourcesService) {}

  @Public()
  @Get()
  findAll(@Query() dto: ResourceQueryDto) {
    return this.resources.findAll(dto);
  }

  @Public()
  @Get('categories')
  getCategories() {
    return this.resources.getCategories();
  }

  @AdminOnly()
  @Post('presign')
  presign(@Body() dto: PresignDto) {
    return this.resources.generatePresignUrl(dto.filename, dto.contentType);
  }

  @AdminOnly()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: UploadedResourceFile | undefined) {
    return this.resources.uploadFile(file);
  }

  @Public()
  @Post('avatar/presign')
  presignAvatar(@Body() dto: PresignDto) {
    return this.resources.generateAvatarPresignUrl(
      dto.filename,
      dto.contentType,
    );
  }

  @AdminOnly()
  @Post()
  save(@Body() dto: SaveResourceDto) {
    return this.resources.save(dto);
  }

  @AdminOnly()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.resources.deleteResource(id);
  }
}
