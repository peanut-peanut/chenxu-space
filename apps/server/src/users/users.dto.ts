import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: '头像链接格式不正确' })
  @MaxLength(500)
  avatar?: string;
}
