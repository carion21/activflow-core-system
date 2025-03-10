import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SaveInStoreDto } from './dto/save-in-store.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { controlData, generateUuid, translate } from 'src/common/functions';
import { Consts } from 'src/common/constants';
import { ShowDataForAdminDto } from './dto/show-data-for-admin.dto';

@Injectable()
export class StoreService {
  constructor(private readonly prismaService: PrismaService) {}

  async save(saveInStoreDto: SaveInStoreDto, userAuthenticated: any) {
    const { formUuid, data } = saveInStoreDto;

    // check if the form exists
    const form = await this.prismaService.form.findFirst({
      where: {
        uuid: formUuid,
      },
      include: {
        activities: true,
        fields: {
          include: {
            type: true,
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire introuvable'));

    // check if the user has the right to save data in the form
    const formPermission = await this.prismaService.formPermission.findFirst({
      where: {
        formId: form.id,
        profileId: userAuthenticated['profile']['id'],
      },
    });
    if (!formPermission || !formPermission.isActive)
      throw new ForbiddenException(
        translate(
          "Vous n'avez pas le droit de sauvegarder des données via ce formulaire| Profil non autorisé",
        ),
      );

    // check if the user has the right to save data in the activity
    const formActivity = form.activities[0];
    const activityTeams = await this.prismaService.activityTeam.findMany({
      where: {
        activityId: formActivity.id,
      },
      select: {
        team: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });
    const activityTeamIds = activityTeams
      .filter((activityTeam) => activityTeam.team.isActive)
      .map((activityTeam) => activityTeam.team.id);

    const userTeams = await this.prismaService.teamUser.findMany({
      where: {
        userId: userAuthenticated['id'],
      },
      select: {
        teamId: true,
      },
    });
    const userTeamIds = userTeams.map((userTeam) => userTeam.teamId);
    // console.log('userTeamIds', userTeamIds);

    const commonTeamIds = activityTeamIds.filter((teamId) =>
      userTeamIds.includes(teamId),
    );
    // console.log('commonTeamIds', commonTeamIds);

    if (commonTeamIds.length === 0)
      throw new ForbiddenException(
        translate(
          "Vous n'avez pas le droit de sauvegarder des données via ce formulaire| Équipe non autorisée",
        ),
      );

    const fields = form.fields;

    let mapFieldTypes = {};
    fields.forEach((field) => {
      let k = field.slug;
      let v = field.type.value;
      mapFieldTypes[k] = v;
    });

    const allFields = fields.map((field) => field.slug);
    const requiredFields = fields
      .filter((field) => !field.optional)
      .map((field) => field.slug);

    const mapSelectValues = {};
    fields.forEach((field) => {
      if (field.type.value === 'select' || field.type.value === 'checkbox') {
        // selectValues is string split by comma -> convert to array
        mapSelectValues[field.slug] = field.selectValues.split(';');
      }
    });

    let inputs = {
      data: data,
      mapFieldTypes: mapFieldTypes,
      allFields: allFields,
      requiredFields: requiredFields,
      mapSelectValues: mapSelectValues,
    };
    console.log('inputs', inputs);
    
    const bcontrol = controlData(inputs);
    if (!bcontrol.success)
      throw new BadRequestException(translate(bcontrol.message));

    // Save the data in the store
    const sessionUuid = generateUuid();
    const dataRows = await this.prismaService.dataRow.createMany({
      data: fields.map((field) => ({
        sessionUuid: sessionUuid,
        userId: userAuthenticated['id'],
        fieldId: field.id,
        value: data[field.slug].toString(),
      })),
    });

    // Return the response
    return {
      message: translate('Données sauvegardées avec succès'),
    };
  }

  async show(formUuid: string, userAuthenticated: any, sessionUuid?: string) {
    // Récupérer le formulaire avec ses champs et vérifier son existence
    const form = await this.prismaService.form.findFirst({
      where: {
        uuid: formUuid,
        isDeleted: false,
      },
      include: {
        fields: {
          include: {
            type: true,
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire introuvable'));
    if (!form.isActive)
      throw new ForbiddenException(translate('Formulaire désactivé'));

    // Vérifier les permissions de l'utilisateur
    const isAdminOrViewer = [
      Consts.ADMIN_PROFILE,
      Consts.VIEWER_PROFILE,
    ].includes(userAuthenticated['profile']['value']);

    if (!isAdminOrViewer) {
      const formPermission = await this.prismaService.formPermission.findFirst({
        where: {
          formId: form.id,
          profileId: userAuthenticated['profile']['id'],
          isActive: true,
        },
      });
      if (!formPermission) {
        throw new ForbiddenException(
          translate(
            "Vous n'avez pas le droit de consulter les données de ce formulaire",
          ),
        );
      }
    }

    // Récupérer les données en fonction des permissions et filtrer si sessionUuid est présent
    const dataRows = await this.prismaService.dataRow.findMany({
      where: {
        fieldId: { in: form.fields.map((field) => field.id) },
        ...(isAdminOrViewer ? {} : { userId: userAuthenticated['id'] }),
        ...(sessionUuid ? { sessionUuid } : {}),
      },
      select: {
        sessionUuid: true,
        fieldId: true,
        value: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            isActive: true,
            profile: {
              select: {
                label: true,
                value: true,
              },
            },
          },
        },
      },
    });

    // Organiser les données par sessionUuid
    const data = dataRows.reduce((acc, row) => {
      const field = form.fields.find((f) => f.id === row.fieldId);
      if (field) {
        if (!acc[row.sessionUuid]) acc[row.sessionUuid] = {};
        acc[row.sessionUuid][field.label] = row.value;
        acc[row.sessionUuid]['slug_' + field.slug] = row.value;
        acc[row.sessionUuid]['createdAt'] = row.createdAt;
        acc[row.sessionUuid]['user'] = row.user;
      }
      return acc;
    }, {});

    // Préparer les données pour la réponse
    const dataWithoutSessionUuid = Object.values(data);

    return {
      message: translate('Données récupérées avec succès'),
      data: dataWithoutSessionUuid,
    };
  }

  async listSession(formUuid: string, userAuthenticated: any) {
    // Vérifier l'existence du formulaire et récupérer les champs associés
    const form = await this.prismaService.form.findFirst({
      where: { uuid: formUuid, isDeleted: false },
      include: { fields: { select: { id: true } } },
    });
    if (!form) throw new NotFoundException(translate('Formulaire introuvable'));

    // Vérifier les permissions de l'utilisateur
    const isAdminOrViewer = [
      Consts.ADMIN_PROFILE,
      Consts.VIEWER_PROFILE,
    ].includes(userAuthenticated['profile']['value']);

    if (!isAdminOrViewer) {
      const formPermission = await this.prismaService.formPermission.findFirst({
        where: {
          formId: form.id,
          profileId: userAuthenticated['profile']['id'],
          isActive: true,
        },
      });
      if (!formPermission) {
        throw new ForbiddenException(
          translate(
            "Vous n'avez pas le droit de consulter les données de ce formulaire",
          ),
        );
      }
    }

    // Récupérer les sessions avec UUID et date de création en fonction des permissions
    const dataRows = await this.prismaService.dataRow.findMany({
      where: {
        fieldId: { in: form.fields.map((field) => field.id) },
        ...(isAdminOrViewer ? {} : { userId: userAuthenticated['id'] }),
      },
      select: {
        sessionUuid: true,
        createdAt: true,
      },
      distinct: ['sessionUuid'],
    });

    // Ajouter formUuid à chaque session pour la réponse et ordonner par date de création desc
    const sessions = dataRows
      .map(({ sessionUuid, createdAt }) => ({
        formUuid,
        sessionUuid,
        createdAt,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Retourner la réponse
    return {
      message: translate('Sessions récupérées avec succès'),
      data: sessions,
    };
  }

  async showSession(
    formUuid: string,
    sessionUuid: string,
    userAuthenticated: any,
  ) {
    return await this.show(formUuid, userAuthenticated, sessionUuid);
  }

  async showForAdmin(
    showDataForAdminDto: ShowDataForAdminDto,
    userAuthenticated: any,
  ) {
    const { formUuid, teamIds, startDate, endDate } = showDataForAdminDto;

    // Récupérer le formulaire avec ses champs et vérifier son existence
    const form = await this.prismaService.form.findFirst({
      where: {
        uuid: formUuid,
        isDeleted: false,
      },
      include: {
        activities: {
          select: {
            id: true,
            teams: {
              select: {
                teamId: true,
                team: {
                  select: {
                    id: true,
                    users: {
                      select: {
                        userId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        fields: {
          include: {
            type: true,
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire introuvable'));
    if (!form.isActive)
      throw new ForbiddenException(translate('Formulaire désactivé'));

    // Récupérer l'activité du formulaire
    const activity = form.activities[0];
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    // Récupérer les équipes de l'activité
    const teams = activity.teams.map((team) => team.team);

    // Vérifier si les équipes passées en paramètre sont bien celles de l'activité
    if (teamIds.length > 0) {
      let activityTeamIds = teams.map((team) => team.id);

      const commonTeamIds = teamIds.filter((teamId) =>
        activityTeamIds.includes(teamId),
      );
      if (commonTeamIds.length !== teamIds.length)
        throw new ForbiddenException(
          translate(
            "Il semble que certaines équipes ne sont pas associées à l'activité",
          ),
        );
    }

    // Récupérer les utilisateurs des équipes liées aux équipes passées en paramètre
    let targetTeams =
      teamIds.length === 0
        ? teams
        : teams.filter((team) => teamIds.includes(team.id));
    const teamUserIds = targetTeams
      .map((team) => team.users.map((user) => user.userId))
      .flat();

    // Vérifier les permissions de l'utilisateur
    const isAdminOrViewer = [
      Consts.ADMIN_PROFILE,
      Consts.VIEWER_PROFILE,
    ].includes(userAuthenticated['profile']['value']);

    if (!isAdminOrViewer) {
      const formPermission = await this.prismaService.formPermission.findFirst({
        where: {
          formId: form.id,
          profileId: userAuthenticated['profile']['id'],
          isActive: true,
        },
      });
      if (!formPermission) {
        throw new ForbiddenException(
          translate(
            "Vous n'avez pas le droit de consulter les données de ce formulaire",
          ),
        );
      }
    }

    // Récupérer les données en fonction des permissions et filtrer si sessionUuid est présent
    const dataRows = await this.prismaService.dataRow.findMany({
      where: {
        fieldId: { in: form.fields.map((field) => field.id) },
        userId: { in: teamUserIds },
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        sessionUuid: true,
        fieldId: true,
        value: true,
        createdAt: true,
        field: {
          select: {
            label: true,
            type: {
              select: {
                value: true,
              },
            },
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            isActive: true,
            profile: {
              select: {
                label: true,
                value: true,
              },
            },
          },
        },
      },
    });

    let sessionUniques = Array.from(
      new Set(dataRows.map((row) => row.sessionUuid)),
    );
    let data = sessionUniques.map((sessionUuid) => {
      let rows = dataRows.filter((row) => row.sessionUuid === sessionUuid);
      let obj = {
        sessionUuid: sessionUuid,
        createdAt: rows[0].createdAt,
        user: rows[0].user,
        fields: [],
      };
      rows.forEach((row) => {
        obj.fields.push({
          label: row.field.label,
          type: row.field.type.value,
          slug: row.field.slug,
          value: row.value,
        });
      });
      return obj;
    });

    // // regrouper les données par sessionUuid
    // const data = pdata.reduce((acc, row) => {
    //   if (!acc[row.sessionUuid]) acc[row.sessionUuid] = [];
    //   acc[row.sessionUuid].push({
    //     field: row.field,
    //     value: row.value,
    //     createdAt: row.createdAt,
    //     user: row.user,
    //   });
    //   return acc;
    // }, {});

    // return the response
    return {
      message: translate('Données récupérées avec succès'),
      data: data,
    };
  }
}
