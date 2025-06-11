// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt'; // تأكد إنك بتستخدم 'bcrypt'
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument, UserRole } from '../users/entities/user.entity'; // <--- أضف User هنا
import { Types } from 'mongoose'; // إضافة Types من mongoose

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtservice: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    // <--- تم تغيير Promise<UserDocument> إلى Promise<User>
    console.log(
      'AuthService: Starting registration for email:',
      createUserDto.email,
    );

    // تحقق لو الإيميل موجود بالفعل
    const existingUser = await this.userService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      console.log(
        'AuthService: Email already registered:',
        createUserDto.email,
      );
      throw new BadRequestException('Email already registered.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const userWithHashedPassword = {
      ...createUserDto,
      password: hashedPassword,
    };

    try {
      const user = await this.userService.create(userWithHashedPassword);
      console.log(
        'AuthService: User created successfully by UsersService:',
        user.email,
      );
      // بعد ما المستخدم يتم إنشاؤه، بنرجعه كـ plain object عشان ميبقاش فيه الـ Mongoose methods
      return user.toObject({ getters: true, virtuals: true });
    } catch (error) {
      console.error('AuthService: Error during user creation:', error);
      throw error;
    }
  }

  async login(loginAuthDto: LoginAuthDto): Promise<string> {
    let user: UserDocument | null;
    try {
      user = await this.userService.findOneByEmail(loginAuthDto.email);
    } catch (error) {
      // لو findOneByEmail رمت أي خطأ (نادراً ما يحدث الآن بعد التعديل)، نرميه.
      // هذا الجزء أصبح أقل احتمالية للحدوث لأن findOneByEmail ترجع null
      // لكنه يبقى كـ safety net.
      throw error;
    }

    // **التصحيح هنا:** التحقق من أن user ليس null قبل استخدام خصائصه
    if (!user) {
      throw new UnauthorizedException('Invalid credentials'); // رسالة عامة للأمان
    }

    const isValid = await bcrypt.compare(loginAuthDto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials'); // رسالة عامة للأمان
    }

    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtservice.signAsync(payload);
    return token;
  }

  async validateToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtservice.verifyAsync(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async updateProfile(
    userId: Types.ObjectId,
    updateData: any,
  ): Promise<UserDocument> {
    const user = await this.userService.update(userId.toString(), updateData);
    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    return user;
  }

  async getProfile(userId: Types.ObjectId): Promise<UserDocument> {
    // هنا الأفضل إنك تمرر الـ Types.ObjectId مباشرة
    const user = await this.userService.findOne(userId); // <<<<<<< كده أفضل وأصح

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    return user;
  }
}
