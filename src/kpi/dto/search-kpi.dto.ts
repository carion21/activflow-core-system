import { IsNotEmpty, IsString } from "class-validator";

export class SearchKpiDto {

    @IsString()
    @IsNotEmpty()
    readonly search: string;

}
