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

@WebSocketGateway(+process.env.SOCKET_PORT, {
  namespace: 'socketio',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly redis: Redis;
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
        chatHistory: '',
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

  @SubscribeMessage(SOCKETEVENTS.RAISE_HAND)
  async handleRaiseHand(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    try {
      if (payload.data) {
        const socketResponse: SOCKETRESPONSE<Object> = {
          data: {
            message: 'Hand raised',
            statusCode: 200,
            body: {
              message: `Hand raised by ${payload.data.senderName}`,
            },
          },
          success: true,
          error: null,
        };

        client
          .to(payload.meetId)
          .emit(SOCKETEVENTS.HAND_RAISED, socketResponse);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // handle message sharing
  @SubscribeMessage(SOCKETEVENTS.SEND_MESSAGE)
  async handleMessaging(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    try {
      console.log('message from client', payload);

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
          senderName: payload.data.senderName,
          senderEmail: payload.data.senderEmail,
          text: payload.data.text,
          inReplyTo: payload.data.inReplyTo,
          reacts: payload.data.reacts,
          type: payload.data.type,
          language: payload.data.language,
          timeAndDate: payload.data.timeAndDate,
        };
        let chatStringfied = btoa(JSON.stringify(newChat));
        let oldChatHistory = meetData[6];
        let newChatHistory = oldChatHistory + chatStringfied + ';';
        console.log(newChatHistory);
        const meetDetails: MEETDATA = {
          meetId: meetData[0],
          type: mtype,
          admin: meetData[2],
          participantCount: +meetData[3],
          participants: [meetData[4]],
          fileSharingHistory: [meetData[5]],
          chatHistory: newChatHistory,
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

        client
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

        client
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
            chatHistory: meetDetails[6],
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
          client.to(payload.meetId).emit(SOCKETEVENTS.RECIEVED_FILE, response);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  @SubscribeMessage(SOCKETEVENTS.VERIFY)
  async handleVerifyMeet(
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
        client.emit(SOCKETEVENTS.DENY, errRes);
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
        client.emit(SOCKETEVENTS.DENY, errRes);
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
        chatHistory: meetDetails[6],
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
      client.emit(SOCKETEVENTS.ALLOW_IN, successRes); // emitting to connected client that he is allowed to join
    } catch (err) {
      console.log(err);
    }
  }

  @SubscribeMessage(SOCKETEVENTS.JOIN_ROOM)
  async handleJoinMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    console.log(payload);
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });
    const meetDetails = await this.redis.hmget(
      payload.meetId,
      'meetId',
      'type',
      'admin',
      'participantCount',
      'participants',
      'chatHistory',
      'fileHistory',
    );
    delete user.hash;
    const userres: SOCKETRESPONSE<any> = {
      success: true,
      error: null,
      data: {
        message: `${user.firstName} joined!`,
        statusCode: 200,
        body: {
          user,
          peerId: payload.peerId,
          userSocketId: client.id,
          meetDetails: {
            meetId: payload.meetId,
            type: meetDetails[1],
            admin: meetDetails[2],
            participantCount: +meetDetails[3],
            participants: [meetDetails[4]],
            chatHistory: [meetDetails[5]],
            fileHistory: [meetDetails[6]],
          },
        },
      },
    };
    const res: SOCKETRESPONSE<any> = {
      success: true,
      error: null,
      data: {
        body: {
          meetDetails: {
            meetId: payload.meetId,
            type: meetDetails[1],
            admin: meetDetails[2],
            participantCount: +meetDetails[3],
            participants: [meetDetails[4]],
            chatHistory: [meetDetails[5]],
            fileHistory: [meetDetails[6]],
          },
        },
        statusCode: 200,
        message: 'Joined successfully!',
      },
    };
    console.log('SOCKETS IN ROOM:', client.rooms);

    client.emit(SOCKETEVENTS.SUCCESSFULL_JOIN, res);
    client.broadcast.to(payload.meetId).emit(SOCKETEVENTS.USER_JOINED, userres); // emitting all connected clients in the room
  }

  @SubscribeMessage(SOCKETEVENTS.LEAVE_ROOM)
  async handleLeaveMeet(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    console.log(payload);

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });
    delete user.hash;
    try {
      const meetDetails = await this.redis.hmget(
        payload.meetId,
        'meetId',
        'type',
        'admin',
        'participantCount',
        'participants',
        'chatHistory',
        'fileHistory',
      );
      let oldParticipants: string[] = [meetDetails[4]];
      let updatedParticipants: string[];
      if (meetDetails[4]) {
        updatedParticipants = oldParticipants.filter(function (
          value,
          index,
          arr,
        ) {
          return value != payload.userId;
        });
      } else {
        updatedParticipants = [];
      }

      let mtype: MEETTYPE;
      if (meetDetails[1] === 'restricted') {
        mtype = MEETTYPE.RESTRICTED;
      } else {
        mtype = MEETTYPE.UNRESTRICTED;
      }

      let newAdmin = meetDetails[2];
      if (meetDetails[2] == payload.userId) {
        // admin has left
        if (updatedParticipants) {
          newAdmin =
            updatedParticipants[
              Math.floor(Math.random() * updatedParticipants.length)
            ];
        } else {
          newAdmin = '';
        }
      }
      const updatedMeetDetails: MEETDATA = {
        meetId: meetDetails[0],
        type: mtype,
        admin: newAdmin,
        participantCount: +meetDetails[3] > 1 ? +meetDetails[3] - 1 : 0,
        participants: updatedParticipants,
        fileSharingHistory: [meetDetails[5]],
        chatHistory: meetDetails[6],
      };
      try {
        await this.redis.hmset(payload.meetId, updatedMeetDetails);
        const res: SOCKETRESPONSE<any> = {
          success: true,
          error: null,
          data: {
            message: `${user.firstName} left!`,
            statusCode: 200,
            body: null,
          },
        };
        console.log('User left');
        client.to(payload.meetId).emit(SOCKETEVENTS.USER_LEAVE, res);
      } catch (error) {
        console.log(error);
      }
    } catch (err) {
      console.log(err);
    }
  }

  @SubscribeMessage(SOCKETEVENTS.SEND_STREAM_TYPE)
  async handleStreamShare(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    console.log(payload);
    const req: SOCKETRESPONSE<any> = {
      success: true,
      data: {
        body: {
          streamType: payload.data.streamType,
          userName: payload.data.user.name,
          socketId: client.id,
        },
        message: 'Success!',
        statusCode: 200,
      },
      error: null,
    };
    client.broadcast
      .to(payload.data.connectedSocket)
      .emit(SOCKETEVENTS.RECEIVE_STREAM_TYPE, req);
  }

  @SubscribeMessage(SOCKETEVENTS.I_JOINED_SUCCESSFULLY)
  async handleSuccessUserJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    const res: SOCKETRESPONSE<any> = {
      data: {
        body: {
          socketId: payload.data.socketId,
        },
        statusCode: 200,
        message: 'Success!',
      },
      error: null,
      success: true,
    };
    client.broadcast
      .to(payload.meetId)
      .emit(SOCKETEVENTS.USER_HAS_JOINED_SUCCESSFULLY, res);
  }
  @SubscribeMessage(SOCKETEVENTS.SEND_ACK)
  async handleSendACK(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    console.log(payload);
    const req: SOCKETRESPONSE<any> = {
      data: {
        body: {
          peerId: payload.data.peerId,
          user: payload.data.user,
        },
        message: '',
        statusCode: 200,
      },
      error: null,
      success: true,
    };
    client.broadcast.to(payload.data.to).emit(SOCKETEVENTS.RECEIVE_ACK, req);
  }

  @SubscribeMessage(SOCKETEVENTS.GET_MEET_DATA)
  async handleGetMeetData(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SOCKETREQUEST,
  ) {
    const meetDetails = await this.redis.hmget(
      payload.meetId,
      'meetId',
      'type',
      'admin',
      'participantCount',
      'participants',
    );
    console.log(payload);

    const res: SOCKETRESPONSE<any> = {
      data: {
        statusCode: 200,
        message: 'Meeting data',
        body: {
          meetId: meetDetails[0],
          type: meetDetails[1],
          admin: meetDetails[2],
          participantCount: meetDetails[3],
          participants: [meetDetails[4]],
        },
      },
      error: null,
      success: true,
    };
    client.emit(SOCKETEVENTS.SEND_MEET_DATA, res);
  }
}
