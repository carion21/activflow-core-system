import { IsNotEmpty, IsString } from "class-validator";


export class ChangePasswordDto {

    @IsString()
    @IsNotEmpty()
    readonly oldPassword: string;

    @IsString()
    @IsNotEmpty()
    readonly newPassword: string;

}