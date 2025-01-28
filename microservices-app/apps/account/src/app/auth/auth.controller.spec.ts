import { getMongoConfig } from './../config/mongo.config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { RMQModule, RMQService, RMQTestService } from 'nestjs-rmq';
import { UserModule } from '../user/user.module';
import { AuthModule } from './auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { INestApplication } from '@nestjs/common';
import { UserRepository } from '../user/repositories/user.repository';
import { AccountLogin, AccountRegister } from '@microservices-app/contracts';
import { resolve } from 'path';
const authLogin: AccountLogin.Request = {
  email: 'test@test.com',
  password: '1',
};
const authRegister: AccountRegister.Request = {
  ...authLogin,
  displayName: 'John',
};
describe('AuthController', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let rmqService: RMQTestService;
  beforeAll(async () => {
    console.log(12345);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: resolve(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            '..',
            'envs',
            '.account.env'
          ),
          validate(config) {
            console.log(123, config);

            return config;
          },
        }),
        RMQModule.forTest({}),
        UserModule,
        AuthModule,
        MongooseModule.forRootAsync(getMongoConfig()),
      ],
    }).compile();
    app = module.createNestApplication();
    userRepository = app.get<UserRepository>(UserRepository);
    rmqService = app.get(RMQService);
    await app.init();
  });
  it('Register', async () => {
    const res = await rmqService.triggerRoute<
      AccountRegister.Request,
      AccountRegister.Response
    >(AccountRegister.topic, authRegister);
    expect(res.email).toEqual(authRegister.email);
  });
  it('Login', async () => {
    const res = await rmqService.triggerRoute<
      AccountLogin.Request,
      AccountLogin.Response
    >(AccountLogin.topic, authLogin);
    expect(res.access_token).toBeDefined();
  });
  afterAll(async () => {
    await userRepository.deleteUser(authRegister.email);
    app.close();
  });
});
