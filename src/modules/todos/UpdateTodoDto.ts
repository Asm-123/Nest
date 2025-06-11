// src/modules/todos/dto/update-todo.dto.ts
import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  IsMongoId,
} from 'class-validator';

export class UpdateTodoDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: 'isCompleted must be a boolean' })
  isCompleted?: boolean;

  @IsOptional()
  @IsMongoId({ message: 'assignedTo must be a valid MongoId string' })
  assignedTo?: string;
}
