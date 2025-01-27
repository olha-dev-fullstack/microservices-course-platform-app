import { PassportModule } from '@nestjs/passport';
import {
  IDomainEvent,
  IUser,
  IUserCourses,
  PurchaseState,
  UserRole,
} from '@microservices-app/interfaces';
import { genSalt, hash, compare } from 'bcryptjs';
import { AccountChangedCourse } from '@microservices-app/contracts';

export class UserEntity implements IUser {
  _id?: string;
  displayName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  courses?: IUserCourses[];
  events: IDomainEvent[] = [];

  constructor(user: IUser) {
    this._id = user._id;
    this.displayName = user.displayName;
    this.email = user.email;
    this.passwordHash = user.passwordHash;
    this.role = user.role;
    this.courses = user.courses;
  }

  public addCourse(courseId: string) {
    const exists = this.courses.find((c) => c._id === courseId);
    if (exists) {
      throw new Error('This course already exists');
    }
    this.courses.push({
      courseId,
      purchaseState: PurchaseState.Started,
    });
  }

  public deleteCourse(courseId: string) {
    this.courses = this.courses.filter((c) => c._id !== courseId);
  }

  public setCourseStatus(courseId: string, state: PurchaseState) {
    const exist = this.courses.find((c) => c._id === courseId);
    if (!exist) {
      this.courses.push({
        courseId,
        purchaseState: PurchaseState.Started,
      });
      return this;
    }
    if (state === PurchaseState.Cancelled) {
      this.courses = this.courses.filter((c) => c._id !== courseId);
      return this;
    }
    this.courses = this.courses.map((c) => {
      if (c._id === courseId) {
        c.purchaseState = state;
        return c;
      }
      return c;
    });
    this.events.push({
      topic: AccountChangedCourse.topic,
      data: { courseId, userId: this._id, state },
    });
    return this;
  }
  public updateCourseStatus(courseId: string, state: PurchaseState) {
    this.courses = this.courses.map((c) => {
      if (c._id === courseId) {
        c.purchaseState = state;
        return c;
      }
      return c;
    });
  }

  public getPublicProfile() {
    return {
      email: this.email,
      role: this.role,
      displayName: this.displayName,
    };
  }

  public async setPassword(password: string) {
    const salt = await genSalt(10);
    this.passwordHash = await hash(password, salt);
    return this;
  }

  public validatePassword(password: string) {
    return compare(password, this.passwordHash);
  }

  public updateProfile(displayName: string) {
    this.displayName = displayName;
    return this;
  }
}
