import { Body, Controller, Post } from "@nestjs/common";
import { GetDetailsDto } from "src/dto/user.dto";
import { UserService } from "./user.service";

@Controller('user')
export class UserController {
    constructor(private userService: UserService) { }

    @Post('getDetails')
    async getDetails(@Body() dto: GetDetailsDto) {
        console.log(dto);
        return this.userService.getDetails(dto);
    }
}