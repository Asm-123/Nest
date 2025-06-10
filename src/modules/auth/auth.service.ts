import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtservice: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const userWithHashedPassword = {
      ...createUserDto,
      password: hashedPassword,
    };

    const user = await this.userService.create(userWithHashedPassword);
    return user;
  }
  async login(loginAuthDto: LoginAuthDto) {
    const user = await this.userService.findOneByEmail(loginAuthDto.email);
    const isValid = await bcrypt.compare(loginAuthDto.password, user.password);
    if (!user) {
      throw new UnauthorizedException('Email or Password is wrong');
    }
    if (!isValid) {
      throw new UnauthorizedException('Email or Password is wrong');
    }
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtservice.signAsync(payload);
    return token;
  }
  async validateToken(token: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = await this.jwtservice.verifyAsync(token);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return payload;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
