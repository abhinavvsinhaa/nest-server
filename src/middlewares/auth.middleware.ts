import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { prisma } from "src/prisma/client.prisma";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    async use(req: Request, res: Response, next: NextFunction) {
        const jwt = new JwtService();
        const bearer = req.headers['authorization'];
        if (!bearer) throw new ForbiddenException('Authorization header not set!');
        const token = bearer.split(" ")[1];
        if (!token) throw new ForbiddenException('Authorization header not set!');
        const decoded = jwt.decode(token);
        if (decoded) {
            const user = await prisma.user.findUnique({
                where: {
                    id: decoded['id']
                }
            });
            if (user) {
                delete user.hash
                req.body.user = user;
                next();
            } else {
                throw new ForbiddenException('User unverified!');
            }
        }
    }
}