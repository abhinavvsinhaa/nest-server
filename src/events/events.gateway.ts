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
import { PrismaService } from 'src/prisma/prisma.service';
import { MEETDATA, MEETTYPE, PARTICIPANT, SOCKETEVENTS, SOCKETREQUEST, SOCKETRESPONSE } from 'src/types';

@WebSocketGateway(8001, {
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  private readonly redis: Redis;
  @WebSocketServer()
  server: Server;

  constructor(private readonly redisService: RedisService, private prisma: PrismaService) {
    this.redis = redisService.getClient();
  }
  handleConnection(client: any, ...args: any[]) {
    console.log('socket connected: ', client.id);
  }

  handleDisconnect(client: any) {
    console.log('socket disconnected: ', client.id);
  }

  @SubscribeMessage(SOCKETEVENTS.CREATE)
  async handleCreateMeet(@ConnectedSocket() client: Socket, @MessageBody() payload: SOCKETREQUEST) {
    if (payload !== null) {
      try {
        const res = await this.redis.hmget(payload.meetId, 'meetId');
        if (res[0] !== null) {
          const errRes: SOCKETRESPONSE<null> = {
            data: null,
            success: false,
            error: {
              message: 'Meeting already exists',
              statusCode: 403
            }
          }
          client.emit(SOCKETEVENTS.DENY, errRes);
        }
      } catch (err) {
        console.log(err);
      }
      const meetData: MEETDATA = {
        meetId: payload.meetId,
        type: payload.type,
        admin: payload.userId,
        participantCount: 0,
        participants: []
      }
      try {
        const res = await this.redis.hmset(payload.meetId, meetData);
      } catch (error) {
        console.log(error);
      }
      const createSuccess: SOCKETRESPONSE<Object> = {
        data: {
          message: 'Meeting created',
          statusCode: 200,
          body: {
            meetId: payload.meetId
          }
        },
        success: true,
        error: null
      }
      this.server.emit(SOCKETEVENTS.SUCCESSFULL_CREATE, createSuccess)
    }
    //TODO: Error Handling
  }

  @SubscribeMessage(SOCKETEVENTS.JOIN_ROOM)
  async handleJoinMeet(@ConnectedSocket() client: Socket, @MessageBody() payload: SOCKETREQUEST) {
    try {
      const meetDetails = await this.redis.hmget(payload.meetId, 'meetId', 'type', 'admin', 'participantCount', 'participants');
      console.log(meetDetails[4]);
      if (meetDetails[0] === null) {
        const errRes: SOCKETRESPONSE<null> = {
          data: null,
          success: false,
          error: {
            message: 'Invalid meeting code!',
            statusCode: 403
          }
        }
        this.server.emit(SOCKETEVENTS.DENY, errRes);
      }
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.userId
        }
      })

      if ((!(user.isFaceVerified) || !(user.isVoiceVerified)) && (meetDetails[1] === 'restricted')) {
        const errRes: SOCKETRESPONSE<null> = {
          data: null,
          success: false,
          error: {
            message: 'Please verify your biometrics!',
            statusCode: 403
          }
        }
        this.server.emit(SOCKETEVENTS.DENY, errRes)
      }

      const successRes: SOCKETRESPONSE<any> = {
        error: null,
        success: true,
        data: {
          message: "Joined successfully!",
          statusCode: 200,
          body: {
            meetId: payload.meetId
          }
        }
      }
      let updatedParticipants: string[];
      if (meetDetails[4]) {
        updatedParticipants = [meetDetails[4], payload.userId]
      } else {
        updatedParticipants = [payload.userId]
      }
      let mtype: MEETTYPE;
      if (meetDetails[1] === 'restricted') {
        mtype = MEETTYPE.RESTRICTED
      } else {
        mtype = MEETTYPE.UNRESTRICTED
      }
      const updatedMeetDetails: MEETDATA = {
        meetId: meetDetails[0],
        type: mtype,
        admin: meetDetails[2],
        participantCount: +(meetDetails[3]) + 1,
        participants: updatedParticipants
      }
      try {
        await this.redis.hmset(payload.meetId, updatedMeetDetails);
      } catch (error) {
        console.log(error);
      }
      delete user.hash;
      const userres: SOCKETRESPONSE<any> = {
        success: true,
        error: null,
        data: {
          message: `${user.firstName} joined!`,
          statusCode: 200,
          body: {
            user
          }
        }
      }
      client.join(payload.meetId)
      client.emit(SOCKETEVENTS.ALLOW_IN, successRes);
      client.to(payload.meetId).emit(SOCKETEVENTS.USER_JOINED, userres)
    } catch (err) {
      console.log(err);
    }

  }
}
