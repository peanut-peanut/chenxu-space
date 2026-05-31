import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryDto,
} from './articles.dto';
import { Public, AdminOnly } from '../common/decorators/auth.decorator';

@Controller('articles')
export class ArticlesController {
  constructor(private articles: ArticlesService) {}

  @Public()
  @Get()
  findAll(@Query() dto: ArticleQueryDto) {
    return this.articles.findAll(dto);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.articles.findOne(slug);
  }

  @AdminOnly()
  @Post()
  create(@Body() dto: CreateArticleDto) {
    return this.articles.create(dto);
  }

  @AdminOnly()
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticleDto) {
    return this.articles.update(id, dto);
  }
}

@Controller('categories')
export class CategoriesController {
  constructor(private articles: ArticlesService) {}
  @Public()
  @Get()
  getAll() {
    return this.articles.getCategories();
  }
}

@Controller('tags')
export class TagsController {
  constructor(private articles: ArticlesService) {}
  @Public()
  @Get()
  getAll() {
    return this.articles.getTags();
  }
}
