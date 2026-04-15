import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PREMIUM_KEY = 'requiresPremium';

export const RequiresPremium = () =>
  (target: any, key?: string, descriptor?: any) => {
    Reflect.defineMetadata(PREMIUM_KEY, true, descriptor?.value ?? target);
    return descriptor ?? target;
  };

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresPremium = this.reflector.get<boolean>(
      PREMIUM_KEY,
      context.getHandler(),
    );
    if (!requiresPremium) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.subscription !== 'PREMIUM') {
      throw new ForbiddenException({
        code: 'PREMIUM_REQUIRED',
        message: 'This feature requires a Mali Pro subscription.',
        upgradeUrl: '/subscription/upgrade',
      });
    }
    return true;
  }
}
