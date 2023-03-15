import { Injectable } from "@nestjs/common";
import { TYPE, Whiteboards } from "@prisma/client";
import { CreateWbDto, getWbDetailsDto } from "src/dto";
import { PrismaService } from "src/prisma/prisma.service";
import { ResponseType } from "src/types";

export interface WhiteBoardCreateBody {
    whiteboardId: string
}
export interface WhiteBoardDetailsBody {
    board: {
        data: any,
        refId: string,
        wbId: string,
        type: string
    }
}

@Injectable()
export class WBService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateWbDto) {
        console.log(dto);

        let wbtype: TYPE
        if (dto.type == 'unrestricted')
            wbtype = TYPE.UNRESTRICTED
        else
            wbtype = TYPE.RESTRICTED
        const wb = await this.prisma.whiteboards.create({
            data: {
                type: wbtype,
                data: {},
                refId: dto.createdBy,
                wbId: dto.whiteboardId
            }
        })
        const res: ResponseType<WhiteBoardCreateBody> = {
            success: true,
            error: null,
            code: 200,
            path: 'whiteboard/create',
            data: {
                body: {
                    whiteboardId: wb.wbId
                },
                message: 'Whiteboard created successfully!',
                statusCode: 200
            }
        }
        return res;
    }
    async getDetails(dto: getWbDetailsDto) {
        const wb = await this.prisma.whiteboards.findFirst({
            where: {
                wbId: dto.whiteboardId
            }
        })
        const res: ResponseType<WhiteBoardDetailsBody> = {
            success: true,
            error: null,
            code: 200,
            path: 'whiteboard/getDetails',
            data: {
                body: {
                    board: {
                        data: wb.data,
                        refId: wb.refId,
                        wbId: wb.wbId,
                        type: wb.type
                    }
                },
                message: 'Whiteboard details fetched successfully!',
                statusCode: 200
            }
        }
        return res;
    }
}