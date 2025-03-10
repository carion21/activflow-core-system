import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, IsUUID } from "class-validator";

export class ShowDataForAdminDto {

    @IsUUID()
    readonly formUuid: string;

    @IsArray()
    @IsNotEmpty()
    @Type(() => Number)
    readonly teamIds: number[];

    @IsString()
    @IsNotEmpty()
    readonly startDate: string;

    @IsString()
    @IsNotEmpty()
    readonly endDate: string;
}
