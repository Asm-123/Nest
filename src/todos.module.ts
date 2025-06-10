import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TodosController } from './modules/todos/todos.controller';
import { TodosService } from './modules/todos/todos.service';
import { LoggingMiddleware } from './core/loggingMiddleware';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Todo, Todoschema } from './modules/todos/entities/todo.entity';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Todo.name, schema: Todoschema }]),
    AuthModule,
  ],
  controllers: [TodosController],
  providers: [TodosService],
  exports: [TodosService],
})
export class TodosModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(TodosController);
  }
}
