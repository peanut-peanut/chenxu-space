import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFolderDto {
  @IsString() name: string;
  @IsOptional() @IsInt() @Type(() => Number) parentId?: number;
  @IsOptional() @IsBoolean() isPublic?: boolean;
}

export class UpdateFolderDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
}

export class PresignFolderFileDto {
  @IsString() filename: string;
  @IsString() contentType: string;
}

export class SaveFolderFileDto {
  @IsString() name: string;
  @IsString() url: string;
  @IsString() key: string;
  @IsEnum(['image', 'video', 'file']) type: 'image' | 'video' | 'file';
  @IsInt() @Type(() => Number) size: number;
  @IsInt() @Type(() => Number) folderId: number;
}
