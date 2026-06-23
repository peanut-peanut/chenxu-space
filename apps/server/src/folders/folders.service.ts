import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OSS from 'ali-oss';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateFolderDto,
  UpdateFolderDto,
  SaveFolderFileDto,
} from './folders.dto';

@Injectable()
export class FoldersService {
  private oss: OSS;
  private envPrefix: string;

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
    this.envPrefix = this.config.get('NODE_ENV') === 'production' ? 'prod' : 'dev';
  }

  getPublicFiles(type?: string) {
    return this.prisma.folderFile.findMany({
      where: {
        folder: { isPublic: true },
        ...(type && { type: type as 'image' | 'video' | 'file' }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getRootFolders(isAdmin: boolean) {
    return this.prisma.folder.findMany({
      where: { level: 1, ...(isAdmin ? {} : { isPublic: true }) },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getFolderContent(id: number, isAdmin: boolean) {
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('文件夹不存在');
    if (!isAdmin && !folder.isPublic)
      throw new NotFoundException('文件夹不存在');

    const [subfolders, files] = await Promise.all([
      this.prisma.folder.findMany({
        where: { parentId: id, ...(isAdmin ? {} : { isPublic: true }) },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.folderFile.findMany({
        where: { folderId: id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { folder, subfolders, files };
  }

  async createFolder(dto: CreateFolderDto) {
    let level = 1;
    if (dto.parentId) {
      const parent = await this.prisma.folder.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException('父文件夹不存在');
      if (parent.level >= 3)
        throw new BadRequestException('最多支持三级文件夹');
      level = parent.level + 1;
    }

    return this.prisma.folder.create({
      data: {
        name: dto.name,
        parentId: dto.parentId ?? null,
        level,
        isPublic: dto.isPublic ?? false,
      },
    });
  }

  async updateFolder(id: number, dto: UpdateFolderDto) {
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('文件夹不存在');
    return this.prisma.folder.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });
  }

  async deleteFolder(id: number) {
    const folder = await this.prisma.folder.findUnique({ where: { id } });
    if (!folder) throw new NotFoundException('文件夹不存在');
    await this.deleteFolderRecursive(id);
  }

  private async deleteFolderRecursive(id: number) {
    const files = await this.prisma.folderFile.findMany({
      where: { folderId: id },
    });
    await Promise.all(files.map((f) => this.oss.delete(f.key).catch(() => {})));

    const children = await this.prisma.folder.findMany({
      where: { parentId: id },
    });
    await Promise.all(children.map((c) => this.deleteFolderRecursive(c.id)));

    await this.prisma.folder.delete({ where: { id } });
  }

  generatePresignUrl(filename: string, contentType: string) {
    const ext = filename.split('.').pop() ?? '';
    const key = `${this.envPrefix}/folders/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const url = this.oss.signatureUrl(key, {
      method: 'PUT',
      expires: 300,
      'Content-Type': contentType,
    });
    const publicUrl = `https://${this.config.get('OSS_BUCKET')}.${this.config.get('OSS_ENDPOINT')}/${key}`;
    return { uploadUrl: url, key, publicUrl };
  }

  async saveFile(dto: SaveFolderFileDto) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: dto.folderId },
    });
    if (!folder) throw new NotFoundException('文件夹不存在');
    return this.prisma.folderFile.create({
      data: {
        name: dto.name,
        url: dto.url,
        key: dto.key,
        type: dto.type,
        size: dto.size,
        folderId: dto.folderId,
      },
    });
  }

  async deleteFile(folderId: number, fileId: number) {
    const file = await this.prisma.folderFile.findUnique({
      where: { id: fileId },
    });
    if (!file || file.folderId !== folderId)
      throw new NotFoundException('文件不存在');
    await this.oss.delete(file.key).catch(() => {});
    await this.prisma.folderFile.delete({ where: { id: fileId } });
  }
}
