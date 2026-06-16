import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const catIds = ['danhuang', 'liuliu'] as const;
const mediaTypes = ['image', 'video'] as const;

export class CatMediaQueryDto {
  @IsOptional()
  @IsIn(catIds)
  cat?: (typeof catIds)[number];

  @IsOptional()
  @IsIn(mediaTypes)
  type?: (typeof mediaTypes)[number];

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 40;
}

export class CreateCatMediaDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(500)
  url: string;

  @IsString()
  @MaxLength(500)
  key: string;

  @IsIn(mediaTypes)
  type: (typeof mediaTypes)[number];

  @IsInt()
  @Type(() => Number)
  size: number;

  @IsIn(catIds)
  cat: (typeof catIds)[number];

  @IsOptional()
  @IsString()
  shotAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class PresignCatMediaDto {
  @IsString()
  filename: string;

  @IsString()
  contentType: string;
}
