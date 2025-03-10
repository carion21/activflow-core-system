import { IsNotEmpty, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Sous-DTO pour représenter chaque élément de la liste
export class TeamAreaDto {
    @IsNotEmpty()
    @IsNumber()
    teamId: number;

    @IsNotEmpty()
    @IsArray()
    @Type(() => Number) // Assure que chaque élément du tableau est converti en number
    areaIds: number[];
}

// DTO principal
export class AttributeAreasDto {
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true }) // Valide chaque élément du tableau
    @Type(() => TeamAreaDto) // Assure que chaque élément est une instance de TeamAreaDto
    teamAreas: TeamAreaDto[];
}