import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ThoughtsService } from './thoughts.service';
import {
  CreateThoughtDto,
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

  @AdminOnly()
  @Post()
  create(@Body() dto: CreateThoughtDto, @CurrentUser() user: JwtUser) {
    return this.thoughts.create(user.id, dto, dto.images ?? []);
  }

  @Post(':id/like')
  like(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.thoughts.toggleLike(id, user.id);
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

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.thoughts.delete(id, user.id, user.role);
  }
}
