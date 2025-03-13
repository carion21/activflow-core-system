import { IsNotEmpty, IsString } from "class-validator";

export class UpdateSettingDto {

    @IsNotEmpty()
    @IsString()
    readonly primaryColor: string;

    @IsNotEmpty()
    @IsString()
    readonly companyName: string;

    @IsNotEmpty()
    @IsString()
    readonly companyEmail: string;

    @IsString()
    readonly companyLogo: string;
}