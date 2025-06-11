// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import mongoose, { Types } from 'mongoose';
// import { User } from 'src/modules/users/entities/user.entity';
// export type TodoDocument = Todo & Document;
// @Schema()
// export class Todo {
//   @Prop({ required: true })
//   title: string;

//   @Prop()
//   description?: string;
//   @Prop({
//     required: false,
//     type: mongoose.Schema.Types.ObjectId,
//     ref: User.name,
//   })
//   user?: Types.ObjectId;
// }
// export const Todoschema = SchemaFactory.createForClass(Todo);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/entities/user.entity';
export type TodoDocument = HydratedDocument<Todo>;
// export type TodoDocument = Todo & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true },
})
export class Todo {
  @Prop({ required: true, minlength: 3, maxlength: 100, unique: true })
  title: string;

  @Prop({ required: true, minlength: 10 })
  description: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: User.name,
  })
  createdBy: Types.ObjectId;

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: User.name,
    default: null,
  })
  assignedTo: Types.ObjectId | null;

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: User.name,
    default: null,
  })
  completedBy: Types.ObjectId | null;

  @Prop({ default: false })
  isCompleted: boolean;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);
TodoSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});
TodoSchema.virtual('assignee', {
  ref: 'User',
  localField: 'assignedTo',
  foreignField: '_id',
  justOne: true,
});

TodoSchema.virtual('completer', {
  ref: 'User',
  localField: 'completedBy',
  foreignField: '_id',
  justOne: true,
});
