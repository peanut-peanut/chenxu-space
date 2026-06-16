import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { PrismaService } from '../prisma/prisma.service';
import type { SaveResourceDto, ResourceQueryDto } from './resources.dto';

export interface UploadedResourceFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

@Injectable()
export class ResourcesService {
  private oss: OSS;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.oss = new OSS({
      region: this.config.get('OSS_REGION'),
      accessKeyId: this.config.get('OSS_ACCESS_KEY_ID') ?? '',
      accessKeySecret: this.config.get('OSS_ACCESS_KEY_SECRET') ?? '',
      bucket: this.config.get('OSS_BUCKET'),
      internal: this.config.get('NODE_ENV') === 'production',
    });
  }

  generatePresignUrl(filename: string, contentType: string) {
    const ext = filename.split('.').pop() ?? '';
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const url = this.oss.signatureUrl(key, {
      method: 'PUT',
      expires: 300,
      'Content-Type': contentType,
    });

    const publicUrl = `https://${this.config.get('OSS_BUCKET')}.${this.config.get('OSS_ENDPOINT')}/${key}`;

    return { uploadUrl: url, key, publicUrl };
  }

  async uploadFile(file: UploadedResourceFile | undefined) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('只能上传图片文件');
    }

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await this.oss.put(key, file.buffer, {
      headers: {
        'Content-Type': file.mimetype,
        'x-oss-object-acl': 'public-read',
      },
    });

    const publicUrl = `https://${this.config.get('OSS_BUCKET')}.${this.config.get('OSS_ENDPOINT')}/${key}`;

    return { key, publicUrl };
  }

  generateAvatarPresignUrl(filename: string, contentType: string) {
    if (!contentType.startsWith('image/')) {
      throw new BadRequestException('头像必须是图片文件');
    }

    const ext = filename.split('.').pop() ?? 'jpg';
    const key = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadUrl = this.oss.signatureUrl(key, {
      method: 'PUT',
      expires: 300,
      'Content-Type': contentType,
      'x-oss-object-acl': 'public-read',
    } as unknown as OSS.SignatureUrlOptions);
    const publicUrl = `https://${this.config.get('OSS_BUCKET')}.${this.config.get('OSS_ENDPOINT')}/${key}`;

    return { uploadUrl, key, publicUrl };
  }

  async save(dto: SaveResourceDto) {
    return this.prisma.resource.create({
      data: {
        name: dto.name,
        url: dto.url,
        key: dto.key,
        type: dto.type,
        size: dto.size,
        categoryId: dto.categoryId,
      },
      include: { category: true },
    });
  }

  async findAll(dto: ResourceQueryDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 50;

    const where = {
      ...(dto.type && { type: dto.type }),
      ...(dto.categoryId && { categoryId: dto.categoryId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      data: data.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getCategories() {
    return this.prisma.resourceCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async deleteResource(id: number) {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (resource) {
      await this.oss.delete(resource.key).catch(() => {});
      await this.prisma.resource.delete({ where: { id } });
    }
  }
}
