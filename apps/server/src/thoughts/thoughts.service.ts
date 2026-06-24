import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateThoughtDto,
  UpdateThoughtDto,
  CreateCommentDto,
  PaginationDto,
} from './thoughts.dto';

const userSelect = { id: true, nickname: true, avatar: true };
const sportTypeLabels = {
  basketball: '篮球',
  fitness: '健身',
  swimming: '游泳',
} as const;

@Injectable()
export class ThoughtsService {
  constructor(private prisma: PrismaService) {}

  private formatThought(t: any, userId?: number) {
    return {
      id: t.id,
      content: t.content,
      images: t.images as string[],
      type: t.type,
      sportType: t.sportType,
      sportDuration: t.sportDuration,
      sportCalories: t.sportCalories,
      userId: t.userId,
      user: t.user,
      likesCount: t.likesCount,
      dislikesCount: t.dislikesCount,
      commentsCount: t._count.comments,
      liked: userId
        ? (t.likes as { userId: number }[]).some((l) => l.userId === userId)
        : false,
      disliked: userId
        ? (t.dislikes as { userId: number }[]).some(
            (l) => l.userId === userId,
          )
        : false,
      createdAt: t.createdAt.toISOString(),
    };
  }

  async findAll(dto: PaginationDto, userId?: number) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = {
      deletedAt: null,
      ...(dto.type ? { type: dto.type } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.thought.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: userSelect },
          likes: userId
            ? { where: { userId }, select: { userId: true } }
            : false,
          dislikes: userId
            ? { where: { userId }, select: { userId: true } }
            : false,
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.thought.count({ where }),
    ]);

    return {
      data: data.map((t) => this.formatThought(t, userId)),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async findOne(thoughtId: number, userId?: number) {
    const thought = await this.prisma.thought.findFirst({
      where: { id: thoughtId, deletedAt: null },
      include: {
        user: { select: userSelect },
        likes: userId ? { where: { userId }, select: { userId: true } } : false,
        dislikes: userId
          ? { where: { userId }, select: { userId: true } }
          : false,
        _count: { select: { comments: true } },
      },
    });
    if (!thought) throw new NotFoundException('内容不存在');
    return this.formatThought(thought, userId);
  }

  async getInsights() {
    const [sportThoughts, investmentThoughts] = await Promise.all([
      this.prisma.thought.findMany({
        where: { type: 'sport', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: userSelect },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.thought.findMany({
        where: { type: 'investment', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: userSelect },
          _count: { select: { comments: true } },
        },
      }),
    ]);

    const totalDuration = sportThoughts.reduce(
      (sum, thought) => sum + (thought.sportDuration ?? 0),
      0,
    );
    const totalCalories = sportThoughts.reduce(
      (sum, thought) => sum + (thought.sportCalories ?? 0),
      0,
    );
    const sportPostsWithDuration = sportThoughts.filter(
      (thought) => thought.sportDuration !== null,
    ).length;
    const sportPostsWithCalories = sportThoughts.filter(
      (thought) => thought.sportCalories !== null,
    ).length;

    return {
      sport: {
        totalPosts: sportThoughts.length,
        totalDuration,
        totalCalories,
        avgDuration: sportPostsWithDuration
          ? Math.round(totalDuration / sportPostsWithDuration)
          : 0,
        avgCalories: sportPostsWithCalories
          ? Math.round(totalCalories / sportPostsWithCalories)
          : 0,
        activeDays: this.countActiveDays(sportThoughts),
        byType: this.getSportTypeStats(sportThoughts),
        monthly: this.getMonthlyStats(sportThoughts),
        recent: sportThoughts.slice(0, 5).map((thought) => ({
          id: thought.id,
          content: this.getContentPreview(thought.content),
          sportType: thought.sportType,
          sportDuration: thought.sportDuration,
          sportCalories: thought.sportCalories,
          createdAt: thought.createdAt.toISOString(),
        })),
      },
      investment: {
        totalPosts: investmentThoughts.length,
        activeDays: this.countActiveDays(investmentThoughts),
        totalImages: investmentThoughts.reduce(
          (sum, thought) =>
            sum + (Array.isArray(thought.images) ? thought.images.length : 0),
          0,
        ),
        monthly: this.getMonthlyStats(investmentThoughts),
        recent: investmentThoughts.slice(0, 5).map((thought) => ({
          id: thought.id,
          content: this.getContentPreview(thought.content),
          imagesCount: Array.isArray(thought.images) ? thought.images.length : 0,
          createdAt: thought.createdAt.toISOString(),
        })),
      },
    };
  }

  private getSportTypeStats(
    thoughts: Array<{
      sportType: keyof typeof sportTypeLabels | null;
      sportDuration: number | null;
      sportCalories: number | null;
    }>,
  ) {
    return Object.entries(sportTypeLabels).map(([value, label]) => {
      const items = thoughts.filter((thought) => thought.sportType === value);
      return {
        value,
        label,
        count: items.length,
        duration: items.reduce(
          (sum, thought) => sum + (thought.sportDuration ?? 0),
          0,
        ),
        calories: items.reduce(
          (sum, thought) => sum + (thought.sportCalories ?? 0),
          0,
        ),
      };
    });
  }

  private getMonthlyStats(thoughts: Array<{ createdAt: Date }>) {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1,
      );
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return {
        value,
        label: `${date.getMonth() + 1}月`,
        count: 0,
      };
    });
    const monthByValue = new Map(months.map((month) => [month.value, month]));
    thoughts.forEach((thought) => {
      const value = `${thought.createdAt.getFullYear()}-${String(
        thought.createdAt.getMonth() + 1,
      ).padStart(2, '0')}`;
      const month = monthByValue.get(value);
      if (month) month.count += 1;
    });
    return months;
  }

  private countActiveDays(thoughts: Array<{ createdAt: Date }>) {
    return new Set(
      thoughts.map((thought) => thought.createdAt.toISOString().slice(0, 10)),
    ).size;
  }

  private getContentPreview(content: string) {
    return content
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
  }

  async create(userId: number, dto: CreateThoughtDto, imageUrls: string[]) {
    return this.prisma.thought.create({
      data: {
        content: dto.content,
        images: imageUrls,
        type: dto.type ?? 'daily',
        sportType: dto.type === 'sport' ? dto.sportType : null,
        sportDuration: dto.type === 'sport' ? dto.sportDuration : null,
        sportCalories: dto.type === 'sport' ? dto.sportCalories : null,
        userId,
      },
    });
  }

  async update(thoughtId: number, dto: UpdateThoughtDto, imageUrls: string[]) {
    const thought = await this.prisma.thought.findFirst({
      where: { id: thoughtId, deletedAt: null },
      select: { id: true },
    });
    if (!thought) throw new NotFoundException('内容不存在');

    const type = dto.type ?? 'daily';
    const isSport = type === 'sport';
    return this.prisma.thought.update({
      where: { id: thoughtId },
      data: {
        content: dto.content,
        images: imageUrls,
        type,
        sportType: isSport ? (dto.sportType ?? null) : null,
        sportDuration: isSport ? (dto.sportDuration ?? null) : null,
        sportCalories: isSport ? (dto.sportCalories ?? null) : null,
      },
    });
  }

  async toggleLike(thoughtId: number, userId: number) {
    const thought = await this.prisma.thought.findFirst({
      where: { id: thoughtId, deletedAt: null },
      select: { id: true },
    });
    if (!thought) throw new NotFoundException('内容不存在');

    const existing = await this.prisma.thoughtLike.findUnique({
      where: { thoughtId_userId: { thoughtId, userId } },
    });

    const existingDislike = await this.prisma.thoughtDislike.findUnique({
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
      const ops: Prisma.PrismaPromise<unknown>[] = [
        this.prisma.thoughtLike.create({ data: { thoughtId, userId } }),
        this.prisma.thought.update({
          where: { id: thoughtId },
          data: { likesCount: { increment: 1 } },
        }),
      ];
      if (existingDislike) {
        ops.push(
          this.prisma.thoughtDislike.delete({
            where: { thoughtId_userId: { thoughtId, userId } },
          }),
          this.prisma.thought.updateMany({
            where: { id: thoughtId, dislikesCount: { gt: 0 } },
            data: { dislikesCount: { decrement: 1 } },
          }),
        );
      }
      await this.prisma.$transaction(ops);
      return { liked: true };
    }
  }

  async toggleDislike(thoughtId: number, userId: number) {
    const thought = await this.prisma.thought.findFirst({
      where: { id: thoughtId, deletedAt: null },
      select: { id: true },
    });
    if (!thought) throw new NotFoundException('内容不存在');

    const existing = await this.prisma.thoughtDislike.findUnique({
      where: { thoughtId_userId: { thoughtId, userId } },
    });
    const existingLike = await this.prisma.thoughtLike.findUnique({
      where: { thoughtId_userId: { thoughtId, userId } },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.thoughtDislike.delete({
          where: { thoughtId_userId: { thoughtId, userId } },
        }),
        this.prisma.thought.updateMany({
          where: { id: thoughtId, dislikesCount: { gt: 0 } },
          data: { dislikesCount: { decrement: 1 } },
        }),
      ]);
      return { disliked: false };
    }

    const ops: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.thoughtDislike.create({ data: { thoughtId, userId } }),
      this.prisma.thought.update({
        where: { id: thoughtId },
        data: { dislikesCount: { increment: 1 } },
      }),
    ];
    if (existingLike) {
      ops.push(
        this.prisma.thoughtLike.delete({
          where: { thoughtId_userId: { thoughtId, userId } },
        }),
        this.prisma.thought.updateMany({
          where: { id: thoughtId, likesCount: { gt: 0 } },
          data: { likesCount: { decrement: 1 } },
        }),
      );
    }
    await this.prisma.$transaction(ops);
    return { disliked: true };
  }

  async getComments(thoughtId: number) {
    const comments = await this.prisma.thoughtComment.findMany({
      where: { thoughtId, thought: { deletedAt: null } },
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
    if (!thought || thought.deletedAt) throw new NotFoundException('内容不存在');

    return this.prisma.thoughtComment.create({
      data: { content: dto.content, thoughtId, userId, parentId: dto.parentId },
      include: { user: { select: userSelect } },
    });
  }

  async delete(thoughtId: number) {
    const thought = await this.prisma.thought.findFirst({
      where: { id: thoughtId, deletedAt: null },
    });
    if (!thought) throw new NotFoundException('内容不存在');
    return this.prisma.thought.update({
      where: { id: thoughtId },
      data: { deletedAt: new Date() },
    });
  }
}
