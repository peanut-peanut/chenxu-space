import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminOnly, Public } from '../common/decorators/auth.decorator';
import { CatsService, type UploadedCatFile } from './cats.service';
import {
  CatMediaQueryDto,
  CreateCatMediaDto,
  PresignCatMediaDto,
} from './cats.dto';

@Controller('cats')
export class CatsController {
  constructor(private cats: CatsService) {}

  @Public()
  @Get()
  findCats() {
    return this.cats.getCats();
  }

  @Public()
  @Get('media')
  findMedia(@Query() dto: CatMediaQueryDto) {
    return this.cats.findMedia(dto);
  }

  @AdminOnly()
  @Post('media/upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: UploadedCatFile | undefined) {
    return this.cats.uploadFile(file);
  }

  @AdminOnly()
  @Post('media/presign')
  presign(@Body() dto: PresignCatMediaDto) {
    return this.cats.generatePresignUrl(dto.filename, dto.contentType);
  }

  @AdminOnly()
  @Post('media')
  createMedia(@Body() dto: CreateCatMediaDto) {
    return this.cats.createMedia(dto);
  }

  @AdminOnly()
  @Delete('media/:id')
  deleteMedia(@Param('id', ParseIntPipe) id: number) {
    return this.cats.deleteMedia(id);
  }
}
