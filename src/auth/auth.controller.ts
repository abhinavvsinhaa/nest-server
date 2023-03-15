import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { GoogleLoginDto, LoginDto, SignupDto, VerifyEmailOTPDto, verifyUserOtpDto } from 'src/dto';
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
    @Post('verifyemail')
    verifyEmail(@Body() dto: VerifyEmailOTPDto) {
        return this.authService.verifyEmail(dto)
    }

    @Post('verifyOTP')
    verifyOTP(@Body() dto: verifyUserOtpDto) {
        return this.authService.verifyOTP(dto)
    }

    @Post('google/login')
    googleLogin(@Body() dto: GoogleLoginDto) {
        return this.authService.googleLogin(dto)
    }

}
