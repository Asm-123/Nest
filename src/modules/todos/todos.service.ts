import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoDto } from './CreateTodo';
import { Todo, TodoDocument } from './entities/todo.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TodosService {
  private todos = [{ id: 1, title: 'title', description: 'description' }];
  constructor(@InjectModel(Todo.name) private todoModel: Model<TodoDocument>) {
    console.log('todoService');
  }

  async findAll(): Promise<TodoDocument[]> {
    return await this.todoModel.find().exec();
  }

  async findOne(id: string) {
    console.log('Looking for todo with ID:', id);
    const todo = await this.todoModel.findById(id).exec();
    if (!todo) {
      console.log('Todo not found, throwing NotFoundException');
      throw new NotFoundException(`Todo #${id} not found`);
    }
    return todo;
  }

  async create(createTodo: CreateTodoDto) {
    const createdTodo = new this.todoModel(createTodo);
    return await createdTodo.save();
  }

  async update(id: string, body: CreateTodoDto) {
    const updated = await this.todoModel.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!updated) {
      throw new NotFoundException(`Todo with id #${id} not found`);
    }
    return updated;
  }

  async delete(id: string) {
    const deleted = await this.todoModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException(`Todo with id #${id} not found`);
    }
  }
}
