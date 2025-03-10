import { IsBoolean, IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";

export class AddFieldDto {

    @IsNumber()
    @IsNotEmpty()
    readonly fieldTypeId: number;

    // @IsUUID()
    @IsString()
    @IsNotEmpty()
    readonly uuid: string;

    @IsString()
    @IsNotEmpty()
    readonly label: string;

    @IsString()
    readonly description: string;

    @IsBoolean()
    // default value is false
    readonly optional: boolean = false;

    @IsString()
    readonly defaultValue: string;

    @IsString()
    readonly exampleValue: string;

    @IsString()
    readonly selectValues: string;
}