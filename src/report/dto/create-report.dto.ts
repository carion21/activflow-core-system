import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateReportDto {

    @IsNotEmpty()
    @IsNumber()
    readonly activityId: number;

    @IsNotEmpty()
    @IsString()
    readonly startDate: string;

    @IsNotEmpty()
    @IsString()
    readonly endDate: string;
}
