import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from '../auth.service';
import { Reflector } from '@nestjs/core';
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly reflector: Reflector;
  constructor(private readonly authService: AuthService) {
    this.reflector = new Reflector();
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<string>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log(isPublic);
    if (isPublic) {
      return true;
    }
    const request: Request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer')) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const token = authHeader.split(' ')[1];
    const payload = await this.authService.validateToken(token);
    request['user'] = payload;
    return true;
  }
}
