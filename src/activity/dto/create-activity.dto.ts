import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateActivityDto {

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
