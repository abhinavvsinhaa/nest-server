import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { LoginDto, SignupDto } from 'src/dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }
    @Post('signup')
    signup(@Body() dto: SignupDto) {
        return this.authService.sigup(dto);
    }
    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }
    @Get('me')
    me(@Request() req) {
        return this.authService.me(req);
    }
}
