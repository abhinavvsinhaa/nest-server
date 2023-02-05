import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseType } from './types/Response';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();
        const error = exception.message;
        const res: ResponseType<null> = {
            success: false,
            code: status,
            data: null,
            error: {
                statusCode: status,
                message: error
            },
            path: request.url
        }
        response
            .status(status)
            .json(res);
    }
}