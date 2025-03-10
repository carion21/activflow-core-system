import { IsNotEmpty, IsObject } from 'class-validator';

export class FillKpiDto {

    @IsObject()
    @IsNotEmpty()
    readonly datas: object;
}
