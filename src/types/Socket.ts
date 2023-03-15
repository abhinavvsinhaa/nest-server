import { MEETTYPE } from "./Meet";
import { dataInterface, errorInterface } from "./Response"
export enum SOCKETEVENTS {
    CREATE = 'create',
    JOIN_ROOM = "join_room",
    ALLOW_IN = "allow_in",
    DENY = "deny",
    VERIFY = "verify",
    SUCCESSFULL_CREATE = "successfully_create",
    SUCCESSFULL_JOIN = "successfully_join",
    USER_JOINED = "user_joined",
    LEAVE_ROOM = "leave_room",
    USER_LEAVE = "user_leave",
    SEND_STREAM_TYPE = "send_stream_type",
    RECEIVE_STREAM_TYPE = "receive_stream_type",
    SEND_ACK = "send_ack",
    RECEIVE_ACK = "receive_ack",
    GET_MEET_DATA = "get_meet_data",
    SEND_MEET_DATA = "send_meet_data"
}

export interface SOCKETREQ {
    data: any,
    userId: string,
    type: MEETTYPE,
    meetId: string,
    peerId?: string
}

export interface SOCKETRESPONSE<T> {
    success: boolean,
    data: dataInterface<T> | null,
    error: errorInterface | null,

}

export type SOCKETREQUEST = SOCKETREQ | null;