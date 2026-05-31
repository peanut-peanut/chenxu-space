import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { estimateReadingTime } from '../common/utils';
import type {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryDto,
} from './articles.dto';

const tagSelect = { id: true, name: true };
const categorySelect = { id: true, name: true, slug: true };

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: ArticleQueryDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const where = {
      status: 'published' as const,
      ...(dto.categoryId && { categoryId: dto.categoryId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          cover: true,
          summary: true,
          status: true,
          viewCount: true,
          readingTime: true,
          createdAt: true,
          updatedAt: true,
          category: { select: categorySelect },
          tags: { include: { tag: { select: tagSelect } } },
        },
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      data: data.map((a) => ({
        ...a,
        tags: a.tags.map((t) => t.tag),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        category: { select: categorySelect },
        tags: { include: { tag: { select: tagSelect } } },
      },
    });
    if (!article || article.status !== 'published')
      throw new NotFoundException('文章不存在');

    // increment view
    await this.prisma.article.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    return {
      ...article,
      tags: article.tags.map((t) => t.tag),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };
  }

  async create(dto: CreateArticleDto) {
    const { tagIds, ...rest } = dto;
    const readingTime = estimateReadingTime(dto.content);
    return this.prisma.article.create({
      data: {
        ...rest,
        readingTime,
        tags: tagIds?.length
          ? { create: tagIds.map((id) => ({ tag: { connect: { id } } })) }
          : undefined,
      },
    });
  }

  async update(id: number, dto: UpdateArticleDto) {
    const { tagIds, ...rest } = dto;
    if (rest.content) rest['readingTime'] = estimateReadingTime(rest.content);

    return this.prisma.article.update({
      where: { id },
      data: {
        ...rest,
        ...(tagIds && {
          tags: {
            deleteMany: {},
            create: tagIds.map((tid) => ({ tag: { connect: { id: tid } } })),
          },
        }),
      },
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async getTags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }
}
