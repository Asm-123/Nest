/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { STATUS_CODES } from 'http';
import { PublicEndpoint } from '../todos/PublicEndpoint';
import { Types } from 'mongoose';
import { UpdateUserDto } from '../users/dto/update-user.dto';
interface ApiResponse {
  status: boolean;
  data: any;
  message: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @PublicEndpoint()
  @Post('register')
  create(@Body() createAuthDto: CreateUserDto) {
    return this.authService.register(createAuthDto);
  }
  @PublicEndpoint()
  @Post('login')
  async login(@Body() logineAuthDto: LoginAuthDto) {
    const token = await this.authService.login(logineAuthDto);
    return {
      StatusCode: 200,
      message: 'success',
      data: token,
    };
  }

  @Get('profile')
  async getProfile(@Req() req: Request): Promise<ApiResponse> {
    // السطر اللي فيه المشكلة هتعدله بالشكل ده:
    const userProfile = await this.authService.getProfile(
      (req as any).user.userId, // <<<<<<<< التعديل هنا: بنقول لـ TypeScript تجاهل النوع مؤقتًا
    );

    return {
      status: true,
      data: userProfile,
      message: 'User profile fetched successfully',
    };
  }
  @Patch('profile')
  async updateProfile(
    @Req() req: Request,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse> {
    // ونفس التعديل في سطر الـ userId هنا:
    const updatedUser = await this.authService.updateProfile(
      (req as any).user.userId, // <<<<<<<< التعديل هنا
      updateUserDto,
    );

    return {
      status: true,
      data: updatedUser,
      message: 'User profile updated successfully',
    };
  }
}
