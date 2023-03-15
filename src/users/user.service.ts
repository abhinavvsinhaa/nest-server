import { Injectable } from "@nestjs/common";
import { GetDetailsDto } from "src/dto/user.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { userType } from "src/types";
import { ResponseType } from 'src/types/Response';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService) { }

    async getDetails(dto: GetDetailsDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: dto.id
            }
        })
        delete user.hash
        const res: ResponseType<userType> = {
            success: true,
            error: null,
            code: 200,
            path: 'auth/signup',
            data: {
                body: {
                    ...user
                },
                message: 'User created successfully!',
                statusCode: 200,
            },
        };
        return res;
    }
}