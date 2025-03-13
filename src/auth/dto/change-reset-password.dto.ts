import { IsEmail, IsNotEmpty, IsString } from "class-validator";


export class ChangeResetPasswordDto {

    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @IsString()
    @IsNotEmpty()
    readonly oldPassword: string;

    @IsString()
    @IsNotEmpty()
    readonly newPassword: string;

}