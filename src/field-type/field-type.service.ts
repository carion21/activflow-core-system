import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFieldTypeDto } from './dto/create-field-type.dto';
import { UpdateFieldTypeDto } from './dto/update-field-type.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { translate } from 'src/common/functions';

@Injectable()
export class FieldTypeService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    const fieldTypes = await this.prismaService.fieldType.findMany({
      where: { status: true },
    });

    // Return the response
    return {
      message: translate('Liste des types de champs'),
      data: fieldTypes,
    };
  }

  findOne(id: number) {
    // retrieve the field type
    const fieldType = this.prismaService.fieldType.findFirst({
      where: { id, status: true },
    });
    if (!fieldType)
      throw new NotFoundException(translate("Le type de champ n'existe pas"));

    // Return the response
    return {
      message: translate('Type de champ trouvé'),
      data: fieldType,
    };
  }
}
