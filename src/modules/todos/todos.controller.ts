import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './CreateTodo';
import { ConfigService } from '@nestjs/config';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-guads';
import { PublicEndpoint } from './PublicEndpoint';
import { RolesAuthGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { Roles } from './Roles.decorator';

interface ApiResponse {
  status: boolean;
  data: any;
  message: string;
}

@Controller('todos')
export class TodosController {
  constructor(
    private readonly todosService: TodosService,
    private readonly configService: ConfigService,
  ) {
    const x = this.configService.get('db_URL');
    console.log(x);
  }
  @UseGuards(JwtAuthGuard, RolesAuthGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async createTodo(@Body() todoBody: CreateTodoDto): Promise<ApiResponse> {
    const todo = await this.todosService.create(todoBody);
    return {
      status: true,
      data: todo,
      message: 'Todo created successfully',
    };
  }
  @PublicEndpoint()
  @SetMetadata('isPublic', true)
  @Get()
  async findAllTodos(): Promise<ApiResponse> {
    const todos = await this.todosService.findAll();
    return {
      status: true,
      data: todos,
      message: 'Todos fetched successfully',
    };
  }
  @PublicEndpoint()
  @Get(':id')
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<ApiResponse> {
    const todo = await this.todosService.findOne(id);
    return {
      status: true,
      data: todo,
      message: 'Todo fetched successfully',
    };
  }

  @Put(':id')
  async updateTodo(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: CreateTodoDto,
  ): Promise<ApiResponse> {
    const updatedTodo = await this.todosService.update(id, body);
    return {
      status: true,
      data: updatedTodo,
      message: 'Todo updated successfully',
    };
  }

  @Delete(':id')
  async deleteTodo(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<ApiResponse> {
    await this.todosService.delete(id);
    return {
      status: true,
      data: null,
      message: 'Todo deleted successfully',
    };
  }
}
