import { IsNotEmpty, IsString, IsIn, IsNumber } from "class-validator";
import { Consts } from "src/common/constants";


export class CreateKpiDto {

    @IsNotEmpty()
    @IsNumber()
    readonly activityId: number;

    @IsNotEmpty()
    @IsString()
    readonly name: string;

    @IsNotEmpty()
    @IsString()
    @IsIn(Consts.KPI_TYPES)
    readonly type: string;

    @IsString()
    readonly description: string;

}
