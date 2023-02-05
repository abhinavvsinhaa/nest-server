import { RedisService } from '@liaoliaots/nestjs-redis';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Redis } from 'ioredis';
import { Server, Socket } from 'socket.io';
import { SOCKETEVENTS } from 'src/types';

@WebSocketGateway(8001, {
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  private readonly redis: Redis;
  @WebSocketServer()
  server: Server;

  constructor(private readonly redisService: RedisService) {
    this.redis = redisService.getClient();
  }
  handleConnection(client: any, ...args: any[]) {
    console.log('socket connected: ', client.id);
  }

  handleDisconnect(client: any) {
    console.log('socket disconnected: ', client.id);
  }

  @SubscribeMessage(SOCKETEVENTS.CREATE)
  handleCreateMeet(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    console.log(payload)
  }
}
