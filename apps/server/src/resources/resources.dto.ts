import { IsString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PresignDto {
  @IsString() filename: string;
  @IsString() contentType: string;
}

export class SaveResourceDto {
  @IsString() name: string;
  @IsString() url: string;
  @IsString() key: string;
  @IsEnum(['image', 'video', 'file']) type: 'image' | 'video' | 'file';
  @IsInt() @Type(() => Number) size: number;
  @IsOptional() @IsInt() @Type(() => Number) categoryId?: number;
}

export class ResourceQueryDto {
  @IsOptional() @Type(() => Number) page?: number;
  @IsOptional() @Type(() => Number) pageSize?: number;
  @IsOptional() @IsEnum(['image', 'video', 'file']) type?:
    | 'image'
    | 'video'
    | 'file';
  @IsOptional() @Type(() => Number) categoryId?: number;
}
