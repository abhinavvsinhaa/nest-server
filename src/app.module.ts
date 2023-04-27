import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsGateway } from './events/events.gateway';
import { EventsModule } from './events/events.module';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthController } from './auth/auth.controller';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { MailerModule } from '@nestjs-modules/mailer';
import { createTransport } from 'nodemailer';
import { FshareModule } from './fshare/fshare.module';
import { WBModule } from './whiteboard/whiteboard.module';
import { UserModule } from './users/user.module';
const AllControllers = [AuthController];

const addPrefix = (path: string) => {
  console.log('api/v1/' + path);

  return 'api/v1/' + path;
};

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS,
          },
          secure: true,
        },
        defaults: {
          from: '"Reunir" <org.reunir@gmail.com>',
        },
      }),
    }),
    ConfigModule.forRoot(),
    AuthModule,
    UserModule,
    WBModule,
    PrismaModule,
    RedisModule.forRoot({
      config: {
        host: 'redis-12354.c212.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 12354,
        password: 'tjqwLWFELkjuKUYPoDvDw2S0Iu32ENiw',
      },
    }),
    FshareModule,
  ],
  providers: [EventsGateway],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/signup', method: RequestMethod.POST },
        { path: 'auth/verifyemail', method: RequestMethod.POST },
        { path: 'auth/verifyOTP', method: RequestMethod.POST },
        { path: 'auth/google/login', method: RequestMethod.POST },
      )
      .forRoutes(...AllControllers);
  }
}
