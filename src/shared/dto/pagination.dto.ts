// src/dto/pagination.dto.ts
import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @Type(() => String)
  @IsString()
  sort: string = 'asc';

  @IsOptional()
  @Type(() => String)
  @IsString()
  sortBy: string = 'id';
}
