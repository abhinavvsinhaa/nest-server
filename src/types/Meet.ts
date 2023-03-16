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
    senderEmail: string,
    inReplyTo: number,
    senderName: string,
    text: string,
    timeAndDate: string
    language: string,
    reacts: [],
    type: string
}

export type MEETDATA = {
    meetId: string,
    type: MEETTYPE,
    admin: string,
    participantCount: number,
    participants: string[] | [],
    fileSharingHistory: string[] | [],
    chatHistory: string
}