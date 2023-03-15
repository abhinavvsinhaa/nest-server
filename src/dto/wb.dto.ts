import { IsNotEmpty, IsString } from "class-validator";

export class CreateWbDto {
    @IsString()
    @IsNotEmpty()
    whiteboardId: string;

    @IsString()
    @IsNotEmpty()
    createdBy: string;

    @IsString()
    @IsNotEmpty()
    type: string;
}

export class getWbDetailsDto {
    @IsString()
    @IsNotEmpty()
    whiteboardId: string;
}