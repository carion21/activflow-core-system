import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class DeliverReportDto {

    @IsNotEmpty()
    @IsString()
    readonly filename: string;

    @IsNotEmpty()
    @IsString()
    readonly filelink: string;
}
