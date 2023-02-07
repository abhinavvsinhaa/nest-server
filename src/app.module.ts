import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config"
import { EventsGateway } from './events/events.gateway';
import { EventsModule } from './events/events.module';
import { checkRequest } from './middlewares/auth.middleware';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthController } from './auth/auth.controller';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { MailerModule } from '@nestjs-modules/mailer';
import { createTransport } from 'nodemailer';
const AllControllers = [AuthController]


const addPrefix = (path: string) => {
  return 'api/v1/' + path
}

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
          },
          secure: true
        },
        defaults: {
          from: '"Reunir" <org.reunir@gmail.com>'
        }
      })
    }),
    ConfigModule.forRoot(),
    EventsModule,
    AuthModule,
    PrismaModule,
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6379
      }
    })
  ],
  providers: [EventsGateway],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(checkRequest)
      .exclude(
        { path: addPrefix('auth/login'), method: RequestMethod.POST },
        { path: addPrefix('auth/signup'), method: RequestMethod.POST },
        { path: addPrefix('auth/verifyemail'), method: RequestMethod.POST },
        { path: addPrefix('auth/verifyOTP'), method: RequestMethod.POST },
      )
      .forRoutes(...AllControllers)
  }
}
