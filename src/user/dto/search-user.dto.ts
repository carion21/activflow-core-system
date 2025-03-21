import { IsNotEmpty, IsString } from "class-validator";

export class SearchUserDto {

    @IsString()
    @IsNotEmpty()
    readonly search: string;

}
