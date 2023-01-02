import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config"
import { EventsGateway } from './events/events.gateway';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventsModule,
    AuthModule
  ],
  providers: [EventsGateway],
})
export class AppModule {}
