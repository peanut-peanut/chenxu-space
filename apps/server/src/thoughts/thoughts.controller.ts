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
import { ThoughtsService } from './thoughts.service';
import {
  CreateThoughtDto,
  UpdateThoughtDto,
  CreateCommentDto,
  PaginationDto,
} from './thoughts.dto';
import {
  Public,
  AdminOnly,
  OptionalAuth,
} from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

interface JwtUser {
  id: number;
  email: string;
  role: string;
}

@Controller('thoughts')
export class ThoughtsController {
  constructor(private thoughts: ThoughtsService) {}

  @OptionalAuth()
  @Get()
  findAll(@Query() dto: PaginationDto, @CurrentUser() user?: JwtUser) {
    return this.thoughts.findAll(dto, user?.id);
  }

  @OptionalAuth()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user?: JwtUser) {
    return this.thoughts.findOne(id, user?.id);
  }

  @AdminOnly()
  @Post()
  create(@Body() dto: CreateThoughtDto, @CurrentUser() user: JwtUser) {
    return this.thoughts.create(user.id, dto, dto.images ?? []);
  }

  @AdminOnly()
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateThoughtDto,
  ) {
    return this.thoughts.update(id, dto, dto.images ?? []);
  }

  @Post(':id/like')
  like(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.thoughts.toggleLike(id, user.id);
  }

  @Post(':id/dislike')
  dislike(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.thoughts.toggleDislike(id, user.id);
  }

  @Public()
  @Get(':id/comments')
  getComments(@Param('id', ParseIntPipe) id: number) {
    return this.thoughts.getComments(id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.thoughts.addComment(id, user.id, dto);
  }

  @AdminOnly()
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.thoughts.delete(id);
  }
}
