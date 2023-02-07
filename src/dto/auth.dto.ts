import { userType } from "src/types/User";
import { IsEmail, IsNotEmpty, IsString, Length, MaxLength } from 'class-validator'
export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
export class UserInRequest {
    user: userType;
}
export class SignupDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    seed: string;

    @IsString()
    @IsNotEmpty()
    stripe: string;

    @IsString()
    @IsNotEmpty()
    backgroundColor: string;

    @IsString()
    @IsNotEmpty()
    @Length(10, 10, {
        message: 'Phone number must be of 10 digits'
    })
    phone: string
}

export enum TEMPLATETYPE {
    VERIFY = 'VERIFY',
    FORGET = 'FORGET'
}

export class VerifyEmailOTPDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    type: TEMPLATETYPE
}
export class verifyUserOtpDto {
    @IsString()
    @IsNotEmpty()
    otpURI: string;

    @IsString()
    @IsNotEmpty()
    otp: string;

    @IsString()
    @IsNotEmpty()
    check: string
}