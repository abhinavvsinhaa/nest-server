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
import {
  CHATHISTORY,
  FILESHARE,
  MEETDATA,
  MEETTYPE,
  PARTICIPANT,
  SOCKETEVENTS,
  SOCKETREQUEST,
  SOCKETRESPONSE,
} from 'src/types';

type SHAREURL = {
  url: string;
};

@WebSocketGateway(8001, {
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly redis: Redis;
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly redisService: RedisService,
    private prisma: PrismaService,
  ) {
    this.redis = redisService.getClient();
  }
  handleConnection(client: any, ...args: any[]) {
    console.log('socket connected: ', client.id);
  }

  handleDisconnect(client: any) {
    console.log('socket disconnected: ', client.id);
  }

  @SubscribeMessage(SOCKETEVENTS.CREATE)
  async handleCreateMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    if (payload !== null) {
      try {
        const res = await this.redis.hmget(payload.meetId, 'meetId');
        if (res[0] !== null) {
          const errRes: SOCKETRESPONSE<null> = {
            data: null,
            success: false,
            error: {
              message: 'Meeting already exists',
              statusCode: 403,
            },
          };
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
        participants: [],
        fileSharingHistory: [],
        chatHistory: [],
      };
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
            meetId: payload.meetId,
          },
        },
        success: true,
        error: null,
      };
      client.emit(SOCKETEVENTS.SUCCESSFULL_CREATE, createSuccess);
    }
    //TODO: Error Handling
  }

  // handle message sharing
  @SubscribeMessage(SOCKETEVENTS.SEND_MESSAGE)
  async handleMessaging(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    try {
      if (payload.data) {
        const meetData = await this.redis.hmget(
          payload.meetId,
          'meetId',
          'type',
          'admin',
          'participantCount',
          'participants',
          'fileSharingHistory',
          'chatHistory',
        );

        let mtype: MEETTYPE;
        if (meetData[1] === 'restricted') {
          mtype = MEETTYPE.RESTRICTED;
        } else {
          mtype = MEETTYPE.UNRESTRICTED;
        }

        let newChat: CHATHISTORY = {
          timestamp: new Date(),
          name: payload.data.name,
          message: payload.data.message,
        };
        let chatStringfied = JSON.stringify(newChat);

        const meetDetails: MEETDATA = {
          meetId: meetData[0],
          type: mtype,
          admin: meetData[2],
          participantCount: +meetData[3],
          participants: [meetData[4]],
          fileSharingHistory: [meetData[5]],
          chatHistory: [meetData[6], chatStringfied],
        };

        await this.redis.hmset(payload.meetId, meetDetails);

        const sendMessage: SOCKETRESPONSE<CHATHISTORY> = {
          success: true,
          error: null,
          data: {
            message: 'Message shared',
            statusCode: 200,
            body: newChat,
          },
        };

        this.server
          .to(payload.meetId)
          .emit(SOCKETEVENTS.RECIEVE_MESSAGE, sendMessage);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // handle sharing of captions
  @SubscribeMessage(SOCKETEVENTS.SEND_CAPTIONS)
  async handleCaptions(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    try {
      if (payload.data) {
        const captionBody = {
          username: payload.data.username,
          caption: payload.data.caption,
        };

        type CAPTION = {
          username: string;
          caption: string;
        };

        const shareCaption: SOCKETRESPONSE<CAPTION> = {
          success: true,
          data: {
            message: 'Caption recieved',
            body: captionBody,
            statusCode: 200,
          },
          error: null,
        };

        this.server
          .to(payload.meetId)
          .emit(SOCKETEVENTS.RECIEVED_CAPTIONS, shareCaption);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // handles file sharing
  @SubscribeMessage(SOCKETEVENTS.SHARE_FILE)
  async handleFileShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    try {
      if (payload) {
        if (payload.data.url) {
          // fetching existing meetdata from redis
          const meetDetails = await this.redis.hmget(
            payload.meetId,
            'meetId',
            'type',
            'admin',
            'participantCount',
            'participants',
            'fileSharingHistory',
            'chatHistory',
          );

          const timestamp = new Date();
          const sharedBy = payload.userId;
          const name = payload.data.fileName;

          const fileShare: FILESHARE = {
            timestamp,
            sharedBy,
            name,
          };

          // stringify object, to store as array of strings
          const stringfiedFileShare = JSON.stringify(fileShare);

          let mtype: MEETTYPE;
          if (meetDetails[1] === 'restricted') {
            mtype = MEETTYPE.RESTRICTED;
          } else {
            mtype = MEETTYPE.UNRESTRICTED;
          }

          // updating meetData based upon file shared
          const meetData: MEETDATA = {
            meetId: meetDetails[0],
            type: mtype,
            admin: meetDetails[2],
            participantCount: +meetDetails[3],
            participants: [meetDetails[4]],
            fileSharingHistory: [meetDetails[5], stringfiedFileShare],
            chatHistory: [meetDetails[6]],
          };

          await this.redis.hmset(payload.meetId, meetData);

          const response: SOCKETRESPONSE<SHAREURL> = {
            success: true,
            error: null,
            data: {
              message: 'File recieved',
              body: {
                url: payload.data.url,
              },
              statusCode: 200,
            },
          };

          // share downloadable URLs to other sockets in the room
          this.server
            .to(payload.meetId)
            .emit(SOCKETEVENTS.RECIEVED_FILE, response);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage(SOCKETEVENTS.JOIN_ROOM)
  async handleJoinMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    try {
      const meetDetails = await this.redis.hmget(
        payload.meetId,
        'meetId',
        'type',
        'admin',
        'participantCount',
        'participants',
        'fileSharingHistory',
        'chatHistory',
      );

      console.log(meetDetails[4]);
      console.log('File Sharing History', meetDetails[5]);

      if (meetDetails[0] === null) {
        const errRes: SOCKETRESPONSE<null> = {
          data: null,
          success: false,
          error: {
            message: 'Invalid meeting code!',
            statusCode: 403,
          },
        };
        this.server.emit(SOCKETEVENTS.DENY, errRes);
      }
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.userId,
        },
      });

      if (
        (!user.isFaceVerified || !user.isVoiceVerified) &&
        meetDetails[1] === 'restricted'
      ) {
        const errRes: SOCKETRESPONSE<null> = {
          data: null,
          success: false,
          error: {
            message: 'Please verify your biometrics!',
            statusCode: 403,
          },
        };
        this.server.emit(SOCKETEVENTS.DENY, errRes);
      }

      const successRes: SOCKETRESPONSE<any> = {
        error: null,
        success: true,
        data: {
          message: 'Joined successfully!',
          statusCode: 200,
          body: {
            meetId: payload.meetId,
          },
        },
      };
      let updatedParticipants: string[];
      if (meetDetails[4]) {
        updatedParticipants = [meetDetails[4], payload.userId];
      } else {
        updatedParticipants = [payload.userId];
      }
      let mtype: MEETTYPE;
      if (meetDetails[1] === 'restricted') {
        mtype = MEETTYPE.RESTRICTED;
      } else {
        mtype = MEETTYPE.UNRESTRICTED;
      }
      const updatedMeetDetails: MEETDATA = {
        meetId: meetDetails[0],
        type: mtype,
        admin: meetDetails[2],
        participantCount: +meetDetails[3] + 1,
        participants: updatedParticipants,
        fileSharingHistory: [meetDetails[5]],
        chatHistory: [meetDetails[6]],
      };
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
            user,
          },
        },
      };
      client.join(payload.meetId);
      client.emit(SOCKETEVENTS.ALLOW_IN, successRes);
      client.to(payload.meetId).emit(SOCKETEVENTS.USER_JOINED, userres);
    } catch (err) {
      console.log(err);
    }
  }
}
