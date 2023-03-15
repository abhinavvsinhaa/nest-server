import { IsEmail, IsMongoId, IsNotEmpty, IsString } from "class-validator";

export class GetDetailsDto {
    @IsString()
    @IsNotEmpty()
    id: string;
}