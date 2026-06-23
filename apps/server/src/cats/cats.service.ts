import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { PrismaService } from '../prisma/prisma.service';
import type { CatMediaQueryDto, CreateCatMediaDto } from './cats.dto';

export interface UploadedCatFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const cats = [
  {
    id: 'danhuang',
    name: '蛋黄',
    breed: '短毛金渐层',
    gender: '母猫',
    birthday: '2023-04-08',
  },
  {
    id: 'liuliu',
    name: '六六',
    breed: '长毛橘猫',
    gender: '公猫',
    birthday: '2024-06-06',
  },
] as const;

@Injectable()
export class CatsService {
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
      secure: true,
    });
  }

  getCats() {
    return cats;
  }

  async uploadFile(file: UploadedCatFile | undefined) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (!isImage && !isVideo) {
      throw new BadRequestException('只能上传图片或视频');
    }

    const ext = file.originalname.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg');
    const key = `cats/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await this.oss.put(key, file.buffer, {
      headers: {
        'Content-Type': file.mimetype,
        'x-oss-object-acl': 'public-read',
      },
    });

    const publicUrl = `https://${this.config.get('OSS_BUCKET')}.${this.config.get('OSS_ENDPOINT')}/${key}`;

    return {
      key,
      publicUrl,
      name: file.originalname,
      size: file.size,
      type: isVideo ? 'video' : 'image',
    };
  }

  generatePresignUrl(filename: string, contentType: string) {
    const isImage = contentType.startsWith('image/');
    const isVideo = contentType.startsWith('video/');
    if (!isImage && !isVideo) {
      throw new BadRequestException('只能上传图片或视频');
    }

    const ext = filename.split('.').pop() ?? (isVideo ? 'mp4' : 'jpg');
    const key = `cats/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadUrl = this.oss.signatureUrl(key, {
      method: 'PUT',
      expires: 300,
      'Content-Type': contentType,
      'x-oss-object-acl': 'public-read',
    } as unknown as OSS.SignatureUrlOptions);
    const publicUrl = `https://${this.config.get('OSS_BUCKET')}.${this.config.get('OSS_ENDPOINT')}/${key}`;

    return {
      uploadUrl,
      key,
      publicUrl,
      name: filename,
      type: isVideo ? 'video' : 'image',
    };
  }

  async createMedia(dto: CreateCatMediaDto) {
    const shotAt = dto.shotAt ? new Date(dto.shotAt) : null;
    if (shotAt && Number.isNaN(shotAt.getTime())) {
      throw new BadRequestException('拍摄时间格式不正确');
    }

    const media = await this.prisma.catMedia.create({
      data: {
        name: dto.name,
        url: dto.url,
        key: dto.key,
        type: dto.type,
        size: dto.size,
        cat: dto.cat,
        shotAt,
        note: dto.note?.trim() || null,
      },
    });

    return this.formatMedia(media);
  }

  async findMedia(dto: CatMediaQueryDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 40;
    const where = {
      ...(dto.cat && { cat: dto.cat }),
      ...(dto.type && { type: dto.type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.catMedia.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ shotAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.catMedia.count({ where }),
    ]);

    return {
      data: data.map((item) => this.formatMedia(item)),
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async deleteMedia(id: number) {
    const media = await this.prisma.catMedia.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('猫猫媒体不存在');
    await this.oss.delete(media.key).catch(() => {});
    await this.prisma.catMedia.delete({ where: { id } });
  }

  private formatMedia(media: {
    id: number;
    name: string;
    url: string;
    key: string;
    type: 'image' | 'video' | 'file';
    size: number;
    cat: 'danhuang' | 'liuliu';
    shotAt: Date | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...media,
      shotAt: media.shotAt?.toISOString() ?? null,
      createdAt: media.createdAt.toISOString(),
      updatedAt: media.updatedAt.toISOString(),
    };
  }
}
