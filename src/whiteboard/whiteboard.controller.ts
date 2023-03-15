import { Body, Controller, Post } from "@nestjs/common";
import { CreateWbDto, getWbDetailsDto } from "src/dto";
import { WBService } from "./whiteboard.service";

@Controller('whiteboard')
export class WBController {
    constructor(private wbService: WBService) { }
    @Post('create')
    create(@Body() dto: CreateWbDto) {
        return this.wbService.create(dto);
    }
    @Post('get')
    getDetails(@Body() dto: getWbDetailsDto) {
        return this.wbService.getDetails(dto);
    }
}