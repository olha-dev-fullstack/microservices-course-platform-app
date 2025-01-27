import {
  CourseGetCourse,
  PaymentCheck,
  PaymentGenerateLink,
  PaymentStatus,
} from '@microservices-app/contracts';
import { UserEntity } from '../entities/user.entity';
import { BuyCourseSagaState } from './buy-course.state';
import { PurchaseState } from '@microservices-app/interfaces';

export class BuyCourseSagaStateStarted extends BuyCourseSagaState {
  public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    const { course } = await this.saga.rmqService.send<
      CourseGetCourse.Request,
      CourseGetCourse.Response
    >(CourseGetCourse.topic, {
      id: this.saga.courseId,
    });
    if (!course) {
      throw new Error("Course doesn't exist");
    }
    if (course.price == 0) {
      this.saga.setState(PurchaseState.Purchased, course._id);
      return { paymentLink: null, user: this.saga.user };
    }
    const { paymentLink } = await this.saga.rmqService.send<
      PaymentGenerateLink.Request,
      PaymentGenerateLink.Response
    >(PaymentGenerateLink.topic, {
      courseId: course._id,
      userId: this.saga.user._id,
      sum: course.price,
    });
    this.saga.setState(PurchaseState.WaitingForPayment, course._id);
    return { paymentLink, user: this.saga.user };
  }
  public checkPayment(): Promise<{ user: UserEntity; status: PaymentStatus }> {
    throw new Error('Cannot check not existing payment');
  }
  public async cancel(): Promise<{ user: UserEntity }> {
    this.saga.setState(PurchaseState.Cancelled, this.saga.courseId);
    return { user: this.saga.user };
  }
}

export class BuyCourseSagaStateWaitingForPayment extends BuyCourseSagaState {
  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Cannot create payment link while payment in progress');
  }
  public async checkPayment(): Promise<{
    user: UserEntity;
    status: PaymentStatus;
  }> {
    const { status } = await this.saga.rmqService.send<
      PaymentCheck.Request,
      PaymentCheck.Response
    >(PaymentCheck.topic, {
      userId: this.saga.user._id,
      courseId: this.saga.courseId,
    });
    if (status === 'canceled') {
      this.saga.setState(PurchaseState.Cancelled, this.saga.courseId);
      return { user: this.saga.user, status: 'canceled' };
    }
    if (status !== 'success') {
      return { user: this.saga.user, status: 'in-progress' };
    }
    this.saga.setState(PurchaseState.Purchased, this.saga.courseId);
    return { user: this.saga.user, status: 'success' };
  }
  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Not possible not cancel processing payment');
  }
}

export class BuyCourseSagaStatePurchased extends BuyCourseSagaState {
  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Cannot pay for purchased course');
  }
  public checkPayment(): Promise<{ user: UserEntity; status: PaymentStatus }> {
    throw new Error('Cannot check payment for purchased course');
  }
  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Cannot cancel purchased course');
  }
}

export class BuyCourseSagaStateCancelled extends BuyCourseSagaState {
  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    this.saga.setState(PurchaseState.Started, this.saga.courseId);
    return this.saga.getState().pay();
  }
  public checkPayment(): Promise<{ user: UserEntity; status: PaymentStatus }> {
    throw new Error('Cannot check payment for canceled course');
  }
  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Cannot cancel canceled course');
  }
}
