import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class ActivityDashboardDto {

    @IsString()
    @IsNotEmpty()
    readonly startDate: string;

    @IsString()
    @IsNotEmpty()
    readonly endDate: string;

    @IsArray()
    @Type(() => Number)
    readonly teamIds: number[];

}
