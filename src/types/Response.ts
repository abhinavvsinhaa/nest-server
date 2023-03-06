export type ResponseType<T> = {
    success: boolean,
    code: number,
    data: dataInterface<T> | null,
    error: errorInterface | null
    path: string
}
export interface dataInterface<T> {
    body: T,
    message: string
    statusCode: number
}
export interface errorInterface {
    message: string,
    statusCode: number
}