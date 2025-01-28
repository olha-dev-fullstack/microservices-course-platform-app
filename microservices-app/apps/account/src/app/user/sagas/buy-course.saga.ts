import { RMQService } from 'nestjs-rmq';
import { UserEntity } from '../entities/user.entity';
import { PurchaseState } from '@microservices-app/interfaces';
import { BuyCourseSagaState } from './buy-course.state';
import {
  BuyCourseSagaStateCancelled,
  BuyCourseSagaStatePurchased,
  BuyCourseSagaStateStarted,
  BuyCourseSagaStateWaitingForPayment,
} from './buy-course.steps';

export class BuyCourseSaga {
  private state: BuyCourseSagaState;

  constructor(
    public user: UserEntity,
    public courseId: string,
    public rmqService: RMQService
  ) {
    this.setState(user.getCourseState(courseId), courseId);
  }

  setState(state: PurchaseState, courseId: string) {
    switch (state) {
      case PurchaseState.Started:
        this.state = new BuyCourseSagaStateStarted();
        break;
      case PurchaseState.WaitingForPayment:
        this.state = new BuyCourseSagaStateWaitingForPayment();
        break;
      case PurchaseState.Purchased:
        this.state = new BuyCourseSagaStatePurchased();
        break;
      case PurchaseState.Cancelled:
        this.state = new BuyCourseSagaStateCancelled();
        break;
    }
    this.state.setContext(this);
    this.user.updateCourseStatus(courseId, state);
  }
  getState() {
    return this.state;
  }
}
