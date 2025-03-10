import { IsNotEmpty, IsString } from "class-validator";

export class SearchFormDto {

    @IsString()
    @IsNotEmpty()
    readonly search: string;

}
