import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
    constructor() {
        super({
            datasources: {
                db: {
                    url: 'mongodb+srv://reunir-admin:xWTi8neKW0DAARR8@reunir.gavorhx.mongodb.net/reunir?retryWrites=true&w=majority'
                }
            }
        })
    }
}
