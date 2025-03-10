import { IsNotEmpty, IsNumber } from "class-validator";

export class LinkKpiDto {

    @IsNumber()
    @IsNotEmpty()
    readonly objectiveId: number;

    @IsNumber()
    @IsNotEmpty()
    readonly resultId: number;

}
