import { Type } from "class-transformer";
import { IsArray, IsNotEmpty } from "class-validator";

export class AuthorizeActivityDto {

    @IsArray()
    @Type(() => Number)
    readonly activityIds: number[];
}
