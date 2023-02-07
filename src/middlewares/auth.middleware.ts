import { ForbiddenException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export async function checkRequest(req: Request, res: Response, next: NextFunction) {

    const prisma = new PrismaClient();
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
        delete user.hash
        if (user) {
            req.body.user = user;
            next();
        } else {
            throw new ForbiddenException('User unverified!');
        }
    }
}