import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateThoughtDto,
  CreateCommentDto,
  PaginationDto,
} from './thoughts.dto';

const userSelect = { id: true, nickname: true, avatar: true };

@Injectable()
export class ThoughtsService {
  constructor(private prisma: PrismaService) {}

  async findAll(dto: PaginationDto, userId?: number) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.thought.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: userSelect },
          likes: userId
            ? { where: { userId }, select: { userId: true } }
            : false,
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.thought.count(),
    ]);

    return {
      data: data.map((t) => ({
        id: t.id,
        content: t.content,
        images: t.images as string[],
        userId: t.userId,
        user: t.user,
        likesCount: t.likesCount,
        commentsCount: t._count.comments,
        liked: userId
          ? (t.likes as { userId: number }[]).some((l) => l.userId === userId)
          : false,
        createdAt: t.createdAt.toISOString(),
      })),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async create(userId: number, dto: CreateThoughtDto, imageUrls: string[]) {
    return this.prisma.thought.create({
      data: {
        content: dto.content,
        images: imageUrls,
        userId,
      },
    });
  }

  async toggleLike(thoughtId: number, userId: number) {
    const existing = await this.prisma.thoughtLike.findUnique({
      where: { thoughtId_userId: { thoughtId, userId } },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.thoughtLike.delete({
          where: { thoughtId_userId: { thoughtId, userId } },
        }),
        this.prisma.thought.updateMany({
          where: { id: thoughtId, likesCount: { gt: 0 } },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      return { liked: false };
    } else {
      await this.prisma.$transaction([
        this.prisma.thoughtLike.create({ data: { thoughtId, userId } }),
        this.prisma.thought.update({
          where: { id: thoughtId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      return { liked: true };
    }
  }

  async getComments(thoughtId: number) {
    const comments = await this.prisma.thoughtComment.findMany({
      where: { thoughtId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: userSelect },
        parent: { include: { user: { select: userSelect } } },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      userId: c.userId,
      user: c.user,
      parentId: c.parentId,
      parent: c.parent ? { id: c.parent.id, user: c.parent.user } : null,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async addComment(thoughtId: number, userId: number, dto: CreateCommentDto) {
    const thought = await this.prisma.thought.findUnique({
      where: { id: thoughtId },
    });
    if (!thought) throw new NotFoundException('想法不存在');

    return this.prisma.thoughtComment.create({
      data: { content: dto.content, thoughtId, userId, parentId: dto.parentId },
      include: { user: { select: userSelect } },
    });
  }

  async delete(thoughtId: number, userId: number, role: string) {
    const thought = await this.prisma.thought.findUnique({
      where: { id: thoughtId },
    });
    if (!thought) throw new NotFoundException();
    if (thought.userId !== userId && role !== 'admin')
      throw new ForbiddenException();
    return this.prisma.thought.delete({ where: { id: thoughtId } });
  }
}
