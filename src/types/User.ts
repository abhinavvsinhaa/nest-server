export interface userInterface {
    email: string,
    firstName: string,
    lastName: string,
    seed: string,
    stripe: string,
    backgroundColor: string,
    role: string,
    id: string
}
export type userType = userInterface | null;

export type AChat = {
    senderEmail: string,
    inReplyTo: number,
    senderName: string,
    text: string,
    timeAndDate: Date
    language: string,
    reacts: [],
    type: string
}

export type StreamOptions = {
    audio: boolean;
    video: boolean;
}

export const CAPTURE_OPTIONS: StreamOptions = {
    audio: true,
    video: true,
};