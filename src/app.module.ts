import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config"
import { EventsGateway } from './events/events.gateway';
import { EventsModule } from './events/events.module';
import { checkRequest } from './middlewares/auth.middleware';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthController } from './auth/auth.controller';
import { RedisModule } from '@liaoliaots/nestjs-redis';

const AllControllers = [AuthController]


const addPrefix = (path: string) => {
  return 'api/v1/' + path
}

@Module({
  imports: [
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
        { path: addPrefix('auth/signup'), method: RequestMethod.POST }
      )
      .forRoutes(...AllControllers)
  }
}
