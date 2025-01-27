import {
  IUser,
  IUserCourses,
  PurchaseState,
  UserRole,
} from '@microservices-app/interfaces';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class UserCourses extends Document implements IUserCourses {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: string;
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  courseId: string;
  @Prop({
    required: true,
    enum: PurchaseState,
    type: String,
  })
  purchaseState: PurchaseState;
}

export const UserCoursesSchema = SchemaFactory.createForClass(UserCourses);

@Schema()
export class User extends Document implements IUser {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: string;
  @Prop()
  displayName?: string;
  @Prop({ required: true })
  email: string;
  @Prop({ required: true })
  passwordHash: string;
  @Prop({
    required: true,
    enum: UserRole,
    type: String,
    default: UserRole.Student,
  })
  role: UserRole;

  @Prop({ type: [UserCoursesSchema] })
  courses: Types.Array<UserCourses>;
}

export const UserSchema = SchemaFactory.createForClass(User);
