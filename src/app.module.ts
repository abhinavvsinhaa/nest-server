import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config"
import { EventsGateway } from './events/events.gateway';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventsModule
  ],
  providers: [EventsGateway],
})
export class AppModule {}
