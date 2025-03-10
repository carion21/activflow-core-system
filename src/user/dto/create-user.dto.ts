import { IsEmail, IsIn, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class CreateUserDto {

    @IsString()
    @IsNotEmpty()
    @IsIn(['admin', 'supervisor', 'sampler', 'viewer'], { message: 'Le profil doit être admin, supervisor, sampler ou viewer' })
    readonly role: string;

    @IsString()
    @IsNotEmpty()
    readonly lastname: string;

    @IsString()
    @IsNotEmpty()
    readonly firstname: string;

    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @IsString()
    @Matches(/^[0-9]{10}$/, { message: 'Le numéro de téléphone doit être composé de 10 chiffres' })
    readonly phone: string;
}
