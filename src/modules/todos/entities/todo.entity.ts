import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { User } from 'src/modules/users/entities/user.entity';
export type TodoDocument = Todo & Document;
@Schema()
export class Todo {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;
  @Prop({
    required: false,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  user?: Types.ObjectId;
}
export const Todoschema = SchemaFactory.createForClass(Todo);
