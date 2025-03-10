import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from "class-validator";


export class CreateTeamDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsArray()
    @Type(() => Number)
    readonly members: number[];
}
