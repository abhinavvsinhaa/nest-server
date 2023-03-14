export enum MEETTYPE {
    RESTRICTED = "restricted",
    UNRESTRICTED = "unrestricted"
}

export type PARTICIPANT = {
    userId: string
}

export type FILESHARE = {
    name: string,
    timestamp: Date,
    sharedBy: string
}

export type CHATHISTORY = {
    timestamp: Date,
    name: string,
    message: string
}

export type MEETDATA = {
    meetId: string,
    type: MEETTYPE,
    admin: string,
    participantCount: number,
    participants: string[] | [],
    fileSharingHistory: string[] | [],
    chatHistory: string[] | []
}