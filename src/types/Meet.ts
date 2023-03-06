export enum MEETTYPE {
    RESTRICTED = "restricted",
    UNRESTRICTED = "unrestricted"
}

export type PARTICIPANT = {
    userId: string
}

export type MEETDATA = {
    meetId: string,
    type: MEETTYPE,
    admin: string,
    participantCount: number,
    participants: string[] | []
}