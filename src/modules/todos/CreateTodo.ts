// import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// export class CreateTodoDto {
//   @IsNotEmpty({ message: 'Title is required' })
//   @IsString({ message: 'Title must be a string' })
//   title: string;

//   @IsNotEmpty({ message: 'Description is required' })
//   @IsString({ message: 'Description must be a string' })
//   description: string;
//   @IsOptional()
//   @IsMongoId({ message: 'Invalid user id' })
//   userId?: string;
// }
// src/modules/todos/dto/create-todo.dto.ts
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateTodoDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  description: string;
}
