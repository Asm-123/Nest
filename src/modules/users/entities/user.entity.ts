// user.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  email: string;
  @Prop({ enum: UserRole, default: UserRole.USER })
  role: string;
}

const UserSchema = SchemaFactory.createForClass(User);
UserSchema.virtual('todos', {
  ref: 'Todo',
  localField: '_id',
  foreignField: 'user',
});
export { UserSchema };
