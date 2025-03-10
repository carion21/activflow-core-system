import { IsNotEmpty, IsString } from "class-validator";

export class SearchTeamDto {

    @IsString()
    @IsNotEmpty()
    readonly search: string;

}
