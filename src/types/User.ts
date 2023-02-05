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

export type StreamOptions = {
    audio: boolean;
    video: boolean;
}

export const CAPTURE_OPTIONS: StreamOptions = {
    audio: true,
    video: true,
};