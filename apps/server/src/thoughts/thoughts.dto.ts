import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  IsArray,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

const thoughtTypes = [
  'daily',
  'sport',
  'diet',
  'investment',
  'literature',
  'idea',
] as const;

const sportTypes = ['basketball', 'fitness', 'swimming'] as const;

export class CreateThoughtDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsIn(thoughtTypes)
  type?: (typeof thoughtTypes)[number];

  @IsOptional()
  @IsIn(sportTypes)
  sportType?: (typeof sportTypes)[number];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sportDuration?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sportCalories?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parentId?: number;
}

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 20;

  @IsOptional()
  @IsIn(thoughtTypes)
  type?: (typeof thoughtTypes)[number];
}
