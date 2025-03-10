import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsIn, IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateUserDto {
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
