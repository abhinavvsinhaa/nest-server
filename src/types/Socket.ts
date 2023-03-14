import { MEETTYPE } from "./Meet";
import { dataInterface, errorInterface } from "./Response"
export enum SOCKETEVENTS {
    CREATE = 'create',
    JOIN_ROOM = "join_room",
    ALLOW_IN = "allow_in",
    DENY = "deny",
    SUCCESSFULL_CREATE = "successfully_create",
    USER_JOINED = "user_joined",
    SHARE_FILE="share_file",
    RECIEVED_FILE='recieved_file',
    SEND_CAPTIONS='send_captions',
    RECIEVED_CAPTIONS='recieve_captions',
    SEND_MESSAGE='share_message',
    RECIEVE_MESSAGE='recieve_message'
}

export interface SOCKETREQ {
    data: any,
    userId: string,
    type: MEETTYPE,
    meetId: string
}

export interface SOCKETRESPONSE<T> {
    success: boolean,
    data: dataInterface<T> | null,
    error: errorInterface | null,

}

export type SOCKETREQUEST = SOCKETREQ | null;