import {IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class UpdatePasswordDto {
    @IsString()
    @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    @Matches(/^(?=.*\d.*\d)(?!.*[^a-zA-Z0-9]).*$/, { message: 'Le mot de passe doit contenir au moins deux chiffres et ne pas inclure de caractères spéciaux' })
    readonly password: string;
}
