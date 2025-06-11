/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, HydratedDocument } from 'mongoose';

import { Todo, TodoDocument } from './entities/todo.entity';
import { UsersService } from '../users/users.service';
import {
  UserDocument,
  UserRole,
  UserSchema,
} from '../users/entities/user.entity';
import { CreateTodoDto } from './CreateTodo';
import { UpdateTodoDto } from './UpdateTodoDto';

// ...

type PopulatedFields = {
  createdBy: UserDocument;
  assignedTo: UserDocument | null;
  completedBy: UserDocument | null;
};

// Definition for PopulatedTodoDocument
export type PopulatedTodoDocument = HydratedDocument<Todo & PopulatedFields>;

@Injectable()
export class TodosService {
  constructor(
    @InjectModel(Todo.name) private readonly todoModel: Model<TodoDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    userId: Types.ObjectId,
    createTodoDto: CreateTodoDto,
  ): Promise<TodoDocument> {
    const newTodo = new this.todoModel({
      ...createTodoDto,
      createdBy: userId,
    });
    const savedTodo = await newTodo.save();
    return savedTodo;
  }

  async findAll(
    userId: Types.ObjectId,
    userRole: UserRole,
    isCompleted?: boolean,
    isAssigned?: boolean,
  ): Promise<PopulatedTodoDocument[]> {
    const filter: any = {};

    if (userRole === UserRole.USER) {
      filter.$or = [{ createdBy: userId }, { assignedTo: userId }];
    }

    if (isCompleted !== undefined) {
      filter.isCompleted = isCompleted;
    }
    if (isAssigned !== undefined) {
      filter.assignedTo = isAssigned ? { $ne: null } : null;
    }

    const todos = (await this.todoModel
      .find(filter)
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .populate('completedBy', 'fullName email')
      .lean()
      .exec()) as PopulatedTodoDocument[];

    return todos;
  }

  // ...

  async findOne(
    id: string,
    userId: Types.ObjectId,
    userRole: UserRole,
  ): Promise<TodoDocument | null> {
    const query: any = { _id: id }; // <--- هنا المشكلة!

    if (userRole === UserRole.USER) {
      // query.$or = [{ creator: userId }, { assignedTo: userId }]; // <<<<< الغلطة هنا!
      query.$or = [{ createdBy: userId }, { assignedTo: userId }]; // <<<<< لازم تكون createdBy مش creator
    }
    // الـ Admin كده كده مسموح له يشوف كله

    const todo = await this.todoModel.findOne(query).exec();

    if (!todo) {
      throw new NotFoundException('Todo not found.');
    }

    return todo;
  }
  async update(
    id: string,
    userId: Types.ObjectId,
    userRole: UserRole,
    updateTodoDto: UpdateTodoDto,
  ): Promise<TodoDocument> {
    const todo = await this.todoModel.findById(id).exec();
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found.`);
    }

    if (
      userRole !== UserRole.ADMIN &&
      todo.createdBy.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'You are not authorized to update this todo.',
      ); // Changed to English
    }

    if (
      (updateTodoDto.isCompleted !== undefined &&
        updateTodoDto.isCompleted !== null) ||
      (updateTodoDto.assignedTo !== undefined &&
        updateTodoDto.assignedTo !== null)
    ) {
      throw new BadRequestException(
        'Cannot update isCompleted or assignedTo directly. Use dedicated endpoints.',
      );
    }

    const updatedTodo = await this.todoModel
      .findByIdAndUpdate(
        id,
        {
          title: updateTodoDto.title,
          description: updateTodoDto.description,
        },
        { new: true },
      )
      .exec();

    if (!updatedTodo) {
      throw new NotFoundException(`Todo with ID ${id} not found after update.`);
    }

    return updatedTodo;
  }

  async remove(
    id: string,
    userId: Types.ObjectId,
    userRole: UserRole,
  ): Promise<void> {
    const todo = await this.todoModel.findById(id).exec();
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found.`);
    }

    if (
      userRole !== UserRole.ADMIN &&
      todo.createdBy.toString() !== userId.toString()
    ) {
      throw new ForbiddenException(
        'You are not authorized to delete this todo.',
      ); // Changed to English
    }

    await todo.deleteOne();
  }

  async completeTodo(
    todoId: string,
    userId: Types.ObjectId,
    userRole: UserRole,
  ): Promise<TodoDocument> {
    const todo = await this.todoModel.findById(todoId).exec();
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${todoId} not found.`);
    }

    if (
      userRole !== UserRole.ADMIN && // <<<<< هنا كانت المشكلة في سطر 118 و 187 اللي عندك
      todo.createdBy.toString() !== userId.toString() &&
      (!todo.assignedTo || todo.assignedTo.toString() !== userId.toString())
    ) {
      throw new ForbiddenException(
        'You can only complete tasks you created or are assigned to.',
      ); // Updated message
    }

    if (todo.isCompleted) {
      throw new BadRequestException('This todo is already completed.');
    }

    todo.isCompleted = true;
    todo.completedBy = userId;
    todo.assignedTo = null;

    const completedTodo = await todo.save();
    return completedTodo;
  }

  async assignTodo(todoId: string, assigneeId: string): Promise<TodoDocument> {
    const todo = await this.todoModel.findById(todoId).exec();
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${todoId} not found.`);
    }

    const assigneeUser = await this.usersService.findOne(assigneeId);
    if (!assigneeUser) {
      throw new BadRequestException(
        `Assignee user with ID ${assigneeId} not found.`,
      );
    }

    if (todo.isCompleted) {
      throw new BadRequestException('Cannot assign a completed todo.'); // Changed to English
    }

    todo.assignedTo = new Types.ObjectId(assigneeId);

    const assignedTodo = await todo.save();
    return assignedTodo;
  }

  async unassignTodo(todoId: string): Promise<TodoDocument> {
    const todo = await this.todoModel.findById(todoId).exec();
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${todoId} not found.`);
    }

    if (!todo.assignedTo) {
      throw new BadRequestException(
        'This todo is not currently assigned to anyone.',
      );
    }

    todo.assignedTo = null;

    const unassignedTodo = await todo.save();
    return unassignedTodo;
  }
}
