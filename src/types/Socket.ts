export enum SOCKETEVENTS {
    CREATE = 'create',
    JOIN_ROOM = "join_room",
}
export interface SOCKETREQ {
    data: any,
    userId: string,
    roomId: string
}

export type SOCKETREQUEST = SOCKETREQ | null;