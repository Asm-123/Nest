import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { Reflector } from '@nestjs/core';
@Injectable()
export class RolesAuthGuard implements CanActivate {
  private readonly reflector: Reflector;
  constructor() {
    this.reflector = new Reflector();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getClass(),
      context.getHandler(),
    ]);
    const request: Request = context.switchToHttp().getRequest();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    console.log({ 'authenticated user data': request['user']?.role });
    console.log({ requiredRoles: requiredRoles });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    requiredRoles.includes(request['user'].role);
    return true;
  }
}
