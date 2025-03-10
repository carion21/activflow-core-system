import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

export class UpdateActivityDto {

    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsString()
    readonly description: string;

    @IsNumber()
    @IsNotEmpty()
    readonly formId: number;

    @IsArray()
    @IsNotEmpty()
    @Type(() => Number)
    readonly teamIds: number[];
}
