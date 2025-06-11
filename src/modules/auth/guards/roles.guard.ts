// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { Request } from 'express';

// import { Reflector } from '@nestjs/core';
// @Injectable()
// export class RolesAuthGuard implements CanActivate {
//   private readonly reflector: Reflector;
//   constructor() {
//     this.reflector = new Reflector();
//   }
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
//       context.getClass(),
//       context.getHandler(),
//     ]);
//     const request: Request = context.switchToHttp().getRequest();

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
//     console.log({ 'authenticated user data': request['user']?.role });
//     console.log({ requiredRoles: requiredRoles });

//     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
//     requiredRoles.includes(request['user'].role);
//     return true;
//   }
// }
// src/modules/auth/guards/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../todos/PublicEndpoint'; // <--- المسار الصحيح لديك
import { ROLES_KEY } from '../../todos/Roles.decorator'; // <--- المسار الصحيح لديك

// تأكد من المسار الصحيح للديكوريتور

@Injectable()
export class RolesAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // Reflector بيتعمله inject هنا

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // **تعديل 1: التحقق من @Public() decorator**
      // لو الـ Endpoint ده public، يبقى الـ RolesGuard مش محتاجة تتحقق من الأدوار.
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (isPublic) {
        return true; // اسمح بالوصول إذا كان Endpoint عام
      }

      // **تعديل 2: جلب الأدوار المطلوبة**
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      // لو مفيش أدوار محددة للـ route دي (يعني مش محتاجة دور معين بس محتاجة تسجيل دخول)، يبقى مسموح طالما فيه token صالح
      if (!requiredRoles || requiredRoles.length === 0) {
        // إذا كان Endpoint ليس public ولكن لا يتطلب أدوار محددة،
        // فإنه يتطلب فقط أن يكون المستخدم مصادق عليه (JWT Guard تكفي لذلك).
        // لذا، إذا وصل الكود إلى هنا، فهذا يعني أن JWT Guard سمحت بمرور الطلب،
        // وبالتالي المستخدم مصادق عليه، ويمكننا السماح له بالمرور.
        return true;
      }

      const request: Request = context.switchToHttp().getRequest();
      // الـ `user` object ده المفروض يكون جاهز من الـ `JwtAuthGuard` اللي قبله
      // وبما إننا عدينا الـ `public` check، يبقى `user` مش هيكون `undefined`.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const user = request['user'];

      console.log('RolesAuthGuard: Authenticated user data:', user); // للـ debugging
      console.log('RolesAuthGuard: Required Roles:', requiredRoles); // للـ debugging

      // **تعديل 3: التحقق الفعلي من الدور**
      // نتحقق إن الـ user موجود وإن له role، وإن الـ role بتاعه ضمن الـ requiredRoles
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if (!user || !user.role || !requiredRoles.includes(user.role)) {
        throw new UnauthorizedException(
          'You do not have permission to access this resource.',
        );
      }

      return true; // لو كل حاجة تمام، يبقى المستخدم مصرح له
    } catch (error) {
      console.error('RolesAuthGuard: Error in canActivate:', error);
      // لو الخطأ UnauthorizedException، نرجعه. غير كده، نرمي UnauthorizedException عامة
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'An unexpected error occurred during role validation.',
      );
    }
  }
}
