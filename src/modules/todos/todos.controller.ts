/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Query, // <--- تأكد إنها هنا
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './CreateTodo';
import { ConfigService } from '@nestjs/config';

import { RolesAuthGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

import { UpdateTodoDto } from './UpdateTodoDto';
import { Types } from 'mongoose'; // <--- استيراد Types فقط
import { Request } from 'express'; // <--- استيراد Request
import { Roles } from './Roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-guads';

interface ApiResponse {
  status: boolean;
  data: any;
  message: string;
}

@Controller('todos')
@UseGuards(JwtAuthGuard, RolesAuthGuard)
export class TodosController {
  constructor(
    private readonly todosService: TodosService,
    private readonly configService: ConfigService,
  ) {
    const x = this.configService.get('db_URL');
    console.log(x);
  }

  @Post()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async create(
    @Req() req: Request,
    @Body() createTodoDto: CreateTodoDto,
  ): Promise<ApiResponse> {
    const todo = await this.todosService.create(
      new Types.ObjectId(req.user!.userId),
      createTodoDto,
    );
    return {
      status: true,
      data: todo,
      message: 'Todo created successfully',
    };
  }

  @Get()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async findAll(
    @Req() req: Request,
    @Query('isCompleted') isCompleted?: string,
    @Query('isAssigned') isAssigned?: string,
  ): Promise<ApiResponse> {
    const completed = isCompleted ? isCompleted === 'true' : undefined;
    const assigned = isAssigned ? isAssigned === 'true' : undefined;

    const todos = await this.todosService.findAll(
      new Types.ObjectId(req.user!.userId),

      req.user!.role as UserRole,
      completed,
      assigned,
    );
    return {
      status: true,
      data: todos,
      message: 'Todos fetched successfully',
    };
  }
  @Get(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ApiResponse> {
    const todo = await this.todosService.findOne(
      id,
      new Types.ObjectId(req.user!.userId),
      req.user!.role as UserRole,
    );

    return {
      status: true,
      data: todo,
      message: 'Todo fetched successfully',
    };
  }

  @Patch(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<ApiResponse> {
    const updatedTodo = await this.todosService.update(
      id,
      new Types.ObjectId(req.user!.userId),
      req.user!.role as UserRole,
      updateTodoDto,
    );
    return {
      status: true,
      data: updatedTodo,
      message: 'Todo updated successfully',
    };
  }

  @Delete(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async remove(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ApiResponse> {
    await this.todosService.remove(
      id,
      new Types.ObjectId(req.user!.userId), // <--- هنا نستخدم !
      req.user!.role as UserRole, // <--- هنا نستخدم !
    );
    return {
      status: true,
      data: null,
      message: 'Todo deleted successfully',
    };
  }
  @Patch(':id/complete')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async completeTodo(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ApiResponse> {
    const completedTodo = await this.todosService.completeTodo(
      id,
      new Types.ObjectId(req.user!.userId),
      req.user!.role as UserRole, // <<<<< أضيفي السطر ده هنا!
    );
    return {
      status: true,
      data: completedTodo,
      message: 'Todo marked as completed',
    };
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/assign/:userId')
  async assignTodo(
    @Param('id') todoId: string,
    @Param('userId') assigneeId: string,
  ): Promise<ApiResponse> {
    const assignedTodo = await this.todosService.assignTodo(todoId, assigneeId);
    return {
      status: true,
      data: assignedTodo,
      message: 'Todo assigned successfully',
    };
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/unassign')
  async unassignTodo(@Param('id') todoId: string): Promise<ApiResponse> {
    const unassignedTodo = await this.todosService.unassignTodo(todoId);
    return {
      status: true,
      data: unassignedTodo,
      message: 'Todo unassigned successfully',
    };
  }
}
