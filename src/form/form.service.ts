import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  generateUuid,
  genFieldCode,
  genFormCode,
  getSlug,
  translate,
} from 'src/common/functions';
import { AddFieldDto } from './dto/add-field.dto';
import { isUUID } from 'class-validator';
import { UpdateFieldsDto } from './dto/update-fields.dto';
import { Consts } from 'src/common/constants';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SharedService } from 'src/shared/shared.service';
import { SearchFormDto } from './dto/search-form.dto';

@Injectable()
export class FormService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sharedService: SharedService,
  ) {}

  async create(createFormDto: CreateFormDto, userAuthenticated: any) {
    const { name, description } = createFormDto;

    const form = await this.prismaService.form.create({
      data: {
        code: genFormCode(),
        uuid: generateUuid(),
        name,
        description,
      },
    });
    if (!form)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création du formulaire'),
      );

    // Give the permission to supervisor and sampler to manage the form
    const profileValues = [Consts.SUPERVISOR_PROFILE, Consts.SAMPLER_PROFILE];
    const profiles = await this.prismaService.profile.findMany({
      where: {
        value: {
          in: profileValues,
        },
      },
    });
    await this.prismaService.formPermission.createMany({
      data: profiles.map((profile) => ({
        formId: form.id,
        profileId: profile.id,
      })),
    });

    // Return the response
    return {
      message: translate('Formulaire créé avec succès'),
      data: form,
    };
  }

  async search(searchFormDto: SearchFormDto, userAuthenticated: object) {
    const { search } = searchFormDto;

    const forms = await this.prismaService.form.findMany({
      where: {
        OR: [
          {
            code: {
              contains: search,
            },
          },
          {
            name: {
              contains: search,
            },
          },
        ],
        isDeleted: false,
      },
      include: {
        activities: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        fields: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            code: true,
            label: true,
            slug: true,
            uuid: true,
            description: true,
            optional: true,
            defaultValue: true,
            exampleValue: true,
            selectValues: true,
            type: {
              select: {
                id: true,
                label: true,
                value: true,
              },
            },
            ranks: {
              select: {
                rank: true,
              },
              orderBy: {
                rank: 'asc',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    // order fields by rank
    forms.forEach((form) => {
      form.fields = form.fields.sort(
        (a, b) => a.ranks[0].rank - b.ranks[0].rank,
      );
    });

    // Return the response
    return {
      message: translate('Liste des formulaires'),
      data: forms,
    };
  }

  async findAll(paginationDto: PaginationDto) {
    const options = {
      include: {
        activities: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        fields: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            code: true,
            label: true,
            slug: true,
            uuid: true,
            description: true,
            optional: true,
            defaultValue: true,
            exampleValue: true,
            selectValues: true,
            type: {
              select: {
                id: true,
                label: true,
                value: true,
              },
            },
            ranks: {
              select: {
                rank: true,
              },
              orderBy: {
                rank: 'asc',
              },
              take: 1,
            },
          },
        },
      },
      where: {
        isDeleted: false,
      },
    };

    const paginatedForms = await this.sharedService.paginate(
      this.prismaService.form,
      paginationDto,
      options,
    );

    // order fields by rank
    paginatedForms.data.forEach((form) => {
      form.fields = form.fields.sort(
        (a, b) => a.ranks[0].rank - b.ranks[0].rank,
      );
    });

    // Return the response
    return {
      message: translate('Liste des formulaires'),
      data: paginatedForms,
    };
  }

  async findAllAvailable() {
    // Get all forms where activiies.length === 0
    const forms = await this.prismaService.form.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        activities: {
          none: {},
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
      },
    });

    // Return the response
    return {
      message: translate('Liste des formulaires disponibles'),
      data: forms,
    };
  }

  async findOne(id: number) {
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        activities: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        fields: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            code: true,
            label: true,
            slug: true,
            uuid: true,
            description: true,
            optional: true,
            defaultValue: true,
            exampleValue: true,
            selectValues: true,
            type: {
              select: {
                id: true,
                label: true,
                value: true,
              },
            },
            ranks: {
              select: {
                rank: true,
              },
              orderBy: {
                rank: 'asc',
              },
              take: 1,
            },
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    // order fieldss by rank
    form.fields = form.fields.sort((a, b) => a.ranks[0].rank - b.ranks[0].rank);

    // Return the response
    return {
      message: translate('Détails du formulaire'),
      data: form,
    };
  }

  async findOneByUuid(uuid: string) {
    if (!isUUID(uuid))
      throw new BadRequestException(translate('UUID invalide'));

    const form = await this.prismaService.form.findFirst({
      where: {
        uuid,
        isDeleted: false,
      },
      include: {
        activities: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        fields: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            code: true,
            label: true,
            slug: true,
            uuid: true,
            description: true,
            optional: true,
            defaultValue: true,
            exampleValue: true,
            selectValues: true,
            type: {
              select: {
                id: true,
                label: true,
                value: true,
              },
            },
            ranks: {
              select: {
                rank: true,
              },
              orderBy: {
                rank: 'asc',
              },
              take: 1,
            },
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    // order fieldss by rank
    form.fields = form.fields.sort((a, b) => a.ranks[0].rank - b.ranks[0].rank);

    // Return the response
    return {
      message: translate('Détail du formulaire'),
      data: form,
    };
  }

  async duplicate(id: number, userAuthenticated: any) {
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    const formFields = await this.prismaService.field.findMany({
      where: {
        formId: id,
        isDeleted: false,
      },
      include: {
        ranks: {
          select: {
            rank: true,
          },
          orderBy: {
            rank: 'asc',
          },
          take: 1,
        },
      },
    });

    const newForm = await this.prismaService.form.create({
      data: {
        code: genFormCode(),
        uuid: generateUuid(),
        name: `${form.name} - Copie`,
        description: form.description,
        duplicatedFrom: form.id,
        fields: {
          createMany: {
            data: formFields.map((field) => ({
              code: genFieldCode(),
              fieldTypeId: field.fieldTypeId,
              label: field.label,
              slug: field.slug,
              uuid: field.uuid,
              description: field.description,
              optional: field.optional,
              defaultValue: field.defaultValue,
              exampleValue: field.exampleValue,
              selectValues: field.selectValues,
            })),
          },
        },
      },
    });
    if (!newForm)
      throw new InternalServerErrorException(
        translate('Erreur lors de la duplication du formulaire'),
      );

    // Give the permission to supervisor and sampler to manage the form
    const profileValues = [Consts.SUPERVISOR_PROFILE, Consts.SAMPLER_PROFILE];
    const profiles = await this.prismaService.profile.findMany({
      where: {
        value: {
          in: profileValues,
        },
      },
    });
    await this.prismaService.formPermission.createMany({
      data: profiles.map((profile) => ({
        formId: newForm.id,
        profileId: profile.id,
      })),
    });

    // create fields ranks
    const fieldRanks = await Promise.all(
      formFields.map(async (field) => {
        const fieldRank = await this.prismaService.fieldRank.create({
          data: {
            fieldId: field.id,
            rank: field.ranks[0].rank,
          },
        });
        if (!fieldRank)
          throw new InternalServerErrorException(
            translate('Erreur lors de la création du rang du champ'),
          );
        return fieldRank;
      }),
    );

    // Return the response
    return {
      message: translate('Formulaire dupliqué avec succès'),
      data: newForm,
    };
  }

  async update(
    id: number,
    updateFormDto: UpdateFormDto,
    userAuthenticated: any,
  ) {
    const { name, description } = updateFormDto;

    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    const updatedForm = await this.prismaService.form.update({
      where: {
        id,
      },
      data: {
        name,
        description,
      },
    });
    if (!updatedForm)
      throw new InternalServerErrorException(
        translate('Erreur lors de la mise à jour du formulaire'),
      );

    // Return the response
    return {
      message: translate('Formulaire mis à jour avec succès'),
      data: updatedForm,
    };
  }

  async addField(id: number, addFieldDto: AddFieldDto, userAuthenticated: any) {
    const {
      fieldTypeId,
      uuid,
      label,
      description,
      optional,
      defaultValue,
      exampleValue,
      selectValues,
    } = addFieldDto;

    // Check if the form exists
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        fields: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    // Check if the fields type exists
    const type = await this.prismaService.fieldType.findUnique({
      where: {
        id: fieldTypeId,
      },
    });
    if (!type)
      throw new NotFoundException(translate('Type de champ non trouvé'));

    if (type.value === 'select' && !selectValues)
      throw new ConflictException(
        translate(
          'Veuillez fournir les valeurs de sélection separées par des virgules',
        ),
      );

    const slug = getSlug(label);
    const slugExists = await this.prismaService.field.findFirst({
      where: {
        formId: id,
        slug,
        isDeleted: false,
      },
    });
    if (slugExists)
      throw new ConflictException(
        translate('Le champ existe déjà dans ce formulaire'),
      );

    // Create the fields
    const field = await this.prismaService.field.create({
      data: {
        code: genFieldCode(),
        formId: id,
        fieldTypeId: fieldTypeId,
        label,
        slug: getSlug(label),
        uuid,
        description,
        optional,
        defaultValue,
        exampleValue,
        selectValues,
      },
    });
    if (!field)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création du champ'),
      );

    // create fields rank
    const ranks = await this.prismaService.fieldRank.create({
      data: {
        fieldId: field.id,
        rank: form.fields.length + 1,
      },
    });
    if (!ranks)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création du rang du champ'),
      );

    // Return the response
    return {
      message: translate('Champ ajouté avec succès'),
      data: field,
    };
  }

  async updateFields(
    id: number,
    updateFieldsDto: UpdateFieldsDto,
    userAuthenticated: any,
  ) {
    const { fields } = updateFieldsDto;

    // Check if the form exists
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        fields: {
          where: {
            isDeleted: false,
          },
          include: {
            type: true,
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    // remove all fields ranks
    await this.prismaService.fieldRank.deleteMany({
      where: {
        fieldId: {
          in: form.fields.map((fields) => fields.id),
        },
      },
    });

    const mapRanks = fields.map((fields, index) => ({
      [fields.uuid]: index + 1,
    }));

    // get les fieldss a maintenir
    const fieldsToKeep = form.fields.filter((field) =>
      fields.map((field) => field.uuid).includes(field.uuid),
    );

    // get les fieldss a supprimer
    const fieldsToDelete = form.fields.filter(
      (field) => !fields.map((field) => field.uuid).includes(field.uuid),
    );

    // get les fieldss a ajouter
    const fieldsToAdd = fields.filter(
      (fields) =>
        !form.fields.map((fields) => fields.uuid).includes(fields.uuid),
    );

    // update les fieldss a maintenir
    const updatedfieldss = await Promise.all(
      fieldsToKeep.map(async (field) => {
        const fieldsToKeepData = fields.find((f) => f.uuid === field.uuid);
        const updatedfields = await this.prismaService.field.update({
          where: {
            id: field.id,
          },
          data: {
            description: fieldsToKeepData.description,
            label: fieldsToKeepData.label,
            optional: fieldsToKeepData.optional,
            defaultValue: fieldsToKeepData.defaultValue,
            exampleValue: fieldsToKeepData.exampleValue,
            selectValues: fieldsToKeepData.selectValues,
            // typeId: fieldsToKeepData.typeId,
          },
        });
        if (!updatedfields)
          throw new InternalServerErrorException(
            translate('Erreur lors de la mise à jour du champ'),
          );
        return updatedfields;
      }),
    );

    // delete les fieldss a supprimer
    await Promise.all(
      fieldsToDelete.map(async (fields) => {
        await this.prismaService.field.update({
          where: {
            id: fields.id,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      }),
    );

    // add les fields a ajouter
    const addedFields = await Promise.all(
      fieldsToAdd.map(async (field) => {
        const type = await this.prismaService.fieldType.findUnique({
          where: {
            id: field.fieldTypeId,
          },
        });
        if (!type)
          throw new NotFoundException(translate('Type de champ non trouvé'));

        if (type.value === 'select' && !field.selectValues)
          throw new ConflictException(
            translate(
              'Veuillez fournir les valeurs de sélection separées par des virgules',
            ),
          );

        const slug = getSlug(field.label);
        const slugExists = await this.prismaService.field.findFirst({
          where: {
            formId: id,
            slug,
            isDeleted: false,
          },
        });
        if (slugExists)
          throw new ConflictException(
            translate('Le champ existe déjà dans ce formulaire'),
          );

        const newFields = await this.prismaService.field.create({
          data: {
            code: genFieldCode(),
            formId: id,
            fieldTypeId: field.fieldTypeId,
            label: field.label,
            slug,
            uuid: field.uuid,
            description: field.description,
            optional: field.optional,
            defaultValue: field.defaultValue,
            exampleValue: field.exampleValue,
            selectValues: field.selectValues,
          },
        });
        if (!newFields)
          throw new InternalServerErrorException(
            translate('Erreur lors de la création du champ'),
          );

        return newFields;
      }),
    );

    const allFields = [...updatedfieldss, ...addedFields];

    // create fields ranks
    const fieldRanks = await Promise.all(
      allFields.map(async (field) => {
        const rank = mapRanks.find((mapRank) => mapRank[field.uuid]);
        const fieldRank = await this.prismaService.fieldRank.create({
          data: {
            fieldId: field.id,
            rank: rank[field.uuid],
          },
        });
        if (!fieldRank)
          throw new InternalServerErrorException(
            translate('Erreur lors de la création du rang du champ'),
          );
        return fieldRank;
      }),
    );

    // Return the response
    return {
      message: translate('Champs mis à jour avec succès'),
    };
  }

  async changeStatus(id: number, userAuthenticated: any) {
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    const updatedForm = await this.prismaService.form.update({
      where: {
        id,
      },
      data: {
        isActive: !form.isActive,
      },
    });
    if (!updatedForm)
      throw new InternalServerErrorException(
        translate('Erreur lors du changement de statut du formulaire'),
      );

    // Return the response
    return {
      message: translate('Statut du formulaire modifié avec succès'),
      data: updatedForm,
    };
  }

  async remove(id: number, userAuthenticated: any) {
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    const updatedForm = await this.prismaService.form.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });
    if (!updatedForm)
      throw new InternalServerErrorException(
        translate('Erreur lors de la suppression du formulaire'),
      );

    // Return the response
    return {
      message: translate('Formulaire supprimé avec succès'),
      data: updatedForm,
    };
  }
}
