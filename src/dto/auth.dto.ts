import { userType } from "src/types/User";
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
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
export declare class SignupDto {
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
}
