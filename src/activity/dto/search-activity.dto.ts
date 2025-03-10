import { IsNotEmpty, IsString } from "class-validator";

export class SearchActivityDto {

    @IsString()
    @IsNotEmpty()
    readonly search: string;

}
