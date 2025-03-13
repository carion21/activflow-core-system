import { IsNotEmpty, IsString } from "class-validator";

export class SearchReportDto {

    @IsString()
    @IsNotEmpty()
    readonly search: string;

}
