import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway(8001, {
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any, ...args: any[]) {
    console.log('socket connected: ', client.id);
  }

  handleDisconnect(client: any) {
    console.log('socket disconnected: ', client.id);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any) {
    console.log(payload)
  }
}
