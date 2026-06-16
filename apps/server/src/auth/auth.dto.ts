import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsUrl,
} from 'class-validator';

export class RegisterDto {
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsString()
  @MinLength(8, { message: '密码至少8位' })
  @MaxLength(50)
  password: string;

  @IsString()
  @MinLength(1, { message: '昵称不能为空' })
  @MaxLength(30)
  nickname: string;

  @IsOptional()
  @IsUrl({}, { message: '头像链接格式不正确' })
  @MaxLength(500)
  avatar?: string;
}

export class LoginDto {
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone: string;

  @IsString()
  @MinLength(1)
  password: string;
}
