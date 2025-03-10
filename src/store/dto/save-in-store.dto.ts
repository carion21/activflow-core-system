import { Type } from "class-transformer";
import { IsNotEmpty, IsObject, IsUUID } from "class-validator";

export class SaveInStoreDto {

    @IsUUID()
    readonly formUuid: string;


    @IsObject()
    @IsNotEmpty()
    readonly data: object;
}
