import { Module } from '@nestjs/common';
import {
  ArticlesController,
  CategoriesController,
  TagsController,
} from './articles.controller';
import { ArticlesService } from './articles.service';

@Module({
  controllers: [ArticlesController, CategoriesController, TagsController],
  providers: [ArticlesService],
})
export class ArticlesModule {}
