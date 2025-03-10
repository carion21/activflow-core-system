import { IsNotEmpty, IsString } from "class-validator";

export class UpdateSettingDto {

    @IsNotEmpty()
    @IsString()
    readonly primaryColor: string;

    @IsNotEmpty()
    @IsString()
    readonly companyName: string;

    @IsString()
    readonly companyLogo: string;
}