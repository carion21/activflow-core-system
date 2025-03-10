import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";

export class FieldDto {

    @IsNumber()
    @IsNotEmpty()
    readonly fieldTypeId: number;

    @IsUUID()  // Décommenté si un UUID est attendu pour cette valeur
    @IsString()
    @IsNotEmpty()
    readonly uuid: string;

    @IsString()
    @IsNotEmpty()
    readonly label: string;

    @IsString()
    readonly description: string;

    @IsBoolean()
    readonly optional: boolean = false; // Correction du nom (optionnal -> optional)

    @IsString()
    readonly defaultValue: string;

    @IsString()
    readonly exampleValue: string;

    // Si ce champ représente plusieurs valeurs de sélection
    @IsString()  // Vérification pour chaque élément du tableau
    readonly selectValues: string;
}

export class UpdateFieldsDto {

    @IsArray()
    @IsNotEmpty()
    readonly fields: FieldDto[];

}
