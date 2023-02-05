import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { LoginDto, SignupDto } from 'src/dto';
import * as argon from 'argon2'
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ResponseType } from 'src/types/Response';
import { Request } from 'express';
import { userType } from 'src/types/User';

type UserToken = {
    token: string
}

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService) { }
    async sigup(dto: SignupDto) {
        const hash = await argon.hash(dto.password);

        const olduser = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        })
        if (olduser) throw new ForbiddenException('Email already registered!')

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                hash: hash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                seed: dto.seed,
                stripe: dto.stripe,
                backgroundColor: dto.backgroundColor
            }
        })
        const token = this.jwt.sign({
            id: user.id
        },
            {
                secret: process.env.JWT_SECRET_KEY
            }
        )
        const res: ResponseType<UserToken> = {
            success: true,
            error: null,
            code: 200,
            path: 'auth/signup',
            data: {
                body: {
                    token
                },
                message: 'User created successfully!',
                statusCode: 200
            }
        }
        console.log(res);

        return res;
    }
    async login(dto: LoginDto) {

        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (!user) throw new ForbiddenException('User not found!')

        const pwMatches = await argon.verify(user.hash, dto.password);
        if (!pwMatches) throw new ForbiddenException('Invalid Password!')

        const token = this.jwt.sign({
            id: user.id
        },
            {
                secret: process.env.JWT_SECRET_KEY
            }
        )
        const res: ResponseType<UserToken> = {
            success: true,
            error: null,
            code: 200,
            path: 'auth/login',
            data: {
                body: {
                    token
                },
                message: 'Login successfully!',
                statusCode: 200
            }
        }
        console.log(res);

        return res;
    }
    async me(req: any) {
        const res: ResponseType<userType> = {
            success: true,
            data: {
                body: req.body.user,
                message: 'User verified and found!',
                statusCode: 200
            },
            error: null,
            code: 200,
            path: 'auth/me'
        }
        return res;
    }
}