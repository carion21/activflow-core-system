import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class ShowDataForRunnerDto {

    @IsNotEmpty()
    @IsNumber()
    readonly activityId: number;

    @IsString()
    @IsNotEmpty()
    readonly startDate: string;

    @IsString()
    @IsNotEmpty()
    readonly endDate: string;
}
