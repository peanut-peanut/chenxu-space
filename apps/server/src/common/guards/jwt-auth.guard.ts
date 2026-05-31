import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import {
  IS_PUBLIC_KEY,
  IS_ADMIN_KEY,
  IS_OPTIONAL_AUTH_KEY,
} from '../decorators/auth.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 先执行 JWT 验证
    const result = super.canActivate(context);

    if (isOptional) {
      // 可选认证：JWT 验证失败时仍放行，user 为 null
      if (result instanceof Promise) return result.catch(() => true);
      return true;
    }

    // @AdminOnly() 路由：在 JWT 验证通过后额外检查 role
    const isAdmin = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isAdmin) return result;

    // 异步情况（JWT 验证返回 Promise）
    if (result instanceof Promise) {
      return result.then(() => {
        const req = context
          .switchToHttp()
          .getRequest<{ user?: { role: string } }>();
        if (req.user?.role !== 'admin') throw new ForbiddenException('无权限');
        return true;
      });
    }

    // 同步情况
    if (!result) return false;
    const req = context
      .switchToHttp()
      .getRequest<{ user?: { role: string } }>();
    if (req.user?.role !== 'admin') throw new ForbiddenException('无权限');
    return true;
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isOptional) return (user ?? null) as TUser;
    if (err instanceof Error) throw err;
    if (!user) throw new UnauthorizedException('请先登录');
    return user;
  }
}
