import { IUser } from '@microservices-app/interfaces';
import { IsString } from 'class-validator';
export namespace AccountUserInfo {
  export const topic = 'account.user-info.query';

  export class Request {
    @IsString()
    id: string;
  }
  export class Response {
    user: Omit<IUser, 'passwordHash'>;
  }
}
