import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  controlData,
  genActivityCode,
  generateDatesBetween,
  sumListKpiValues,
  translate,
} from 'src/common/functions';
import { Consts } from 'src/common/constants';
import { SearchActivityDto } from './dto/search-activity.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SharedService } from 'src/shared/shared.service';
import { ActivityDashboardDto } from './dto/activity-dashboard.dto';
import moment, { isDate } from 'moment';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sharedService: SharedService,
  ) {}

  async create(
    createActivityDto: CreateActivityDto,
    userAuthenticated: object,
  ) {
    const { name, description, formId, teamIds } = createActivityDto;

    // Create a new activity
    const activity = await this.prismaService.activity.create({
      data: {
        code: genActivityCode(),
        name,
        description,
      },
    });
    if (!activity)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création du Activité'),
      );

    if (formId) {
      // Retrieve the form
      const form = await this.prismaService.form.findUnique({
        where: {
          id: formId,
        },
      });
      if (!form)
        throw new NotFoundException(translate('Formulaire introuvable'));

      // Attach the activity to the form
      await this.prismaService.activity.update({
        where: {
          id: activity.id,
        },
        data: {
          formId,
        },
      });
    }

    // Add teams to the activity
    if (teamIds.length > 0) {
      const teams = await this.prismaService.team.findMany({
        where: {
          id: {
            in: teamIds,
          },
          isActive: true,
          isDeleted: false,
        },
      });
      if (teams.length !== teamIds.length)
        throw new NotFoundException(
          translate("Il semble que certaines équipes n'existent pas"),
        );

      // Add teams to the activity
      await this.prismaService.activityTeam.createMany({
        data: teams.map((team) => ({
          activityId: activity.id,
          teamId: team.id,
        })),
      });
    }

    // Return the response
    return {
      message: translate('Activité créée avec succès'),
      data: activity,
    };
  }

  async search(searchActivityDto: SearchActivityDto, userAuthenticated: any) {
    const { search } = searchActivityDto;

    const activities = await this.prismaService.activity.findMany({
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
        form: {
          include: {
            fields: {
              select: {
                id: true,
                code: true,
                label: true,
                slug: true,
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
              },
            },
          },
        },
        teams: {
          include: {
            team: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    activities.forEach((activity) => {
      let teams = [];
      activity.teams.forEach((activityTeam) => {
        teams.push(activityTeam.team);
      });
      activity['teams'] = teams;
    });

    // Return the response
    return {
      message: translate('Liste des activités'),
      data: activities,
    };
  }

  async findAll(paginationDto: PaginationDto) {
    // Retrieve all activities
    const options = {
      include: {
        form: {
          include: {
            fields: {
              select: {
                id: true,
                code: true,
                label: true,
                slug: true,
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
              },
            },
          },
        },
        teams: {
          include: {
            team: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
      },
      where: {
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    };

    const paginatedActivities = await this.sharedService.paginate(
      this.prismaService.activity,
      paginationDto,
      options,
    );

    paginatedActivities.data.forEach((activity) => {
      let teams = [];
      activity.teams.forEach((activityTeam) => {
        teams.push(activityTeam.team);
      });
      activity['teams'] = teams;
    });

    // Return the response
    return {
      message: translate('Liste des activités'),
      data: paginatedActivities,
    };
  }

  async findOne(id: number) {
    // Récupérer l'Activité avec ses entités associées
    const activity = await this.prismaService.activity.findUnique({
      include: {
        form: {
          select: {
            id: true,
            code: true,
            name: true,
            uuid: true,
            isActive: true,
            description: true,
          },
        },
        teams: {
          include: {
            team: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                isDeleted: true,
                users: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        firstname: true,
                        lastname: true,
                        phone: true,
                        profile: {
                          select: {
                            label: true,
                            value: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        kpis: {
          select: {
            id: true,
            code: true,
            name: true,
            slug: true,
            type: true,
            value: true,
            isActive: true,
            description: true,
            thresholds: true,
          },
        },
      },
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    let teams = [];
    activity.teams.forEach((activityTeam) => {
      if (activityTeam.team.isDeleted) return;
      activityTeam.team['members'] = activityTeam.team.users.map(
        (tu) => tu.user,
      );
      Reflect.deleteProperty(activityTeam.team, 'users');
      teams.push(activityTeam.team);
    });
    activity['teams'] = teams;

    // Récupérer les KPIs de l'activité
    const kpiResults = activity.kpis.filter(
      (kpi) => kpi.type === Consts.KPI_TYPE_RESULT,
    );
    const kpiResultsIds = kpiResults.map((kpi) => kpi.id);

    // Traiter les équipes de manière parallèle avec Promise.all
    await Promise.all(
      teams.map(async (team) => {
        // Récupérer le nombre de lignes de données pour chaque équipe

        const userIds = team['members'].map((m) => m.id);
        const dataRows = await this.prismaService.dataRow.findMany({
          where: {
            userId: {
              in: userIds,
            },
          },
          distinct: ['sessionUuid'], // distinct sur sessionUuid
          select: {
            sessionUuid: true,
          },
        });
        const countDataRows = dataRows.length;
        team['dataRowsCount'] = countDataRows;

        // Récupérer les KPI par équipe
        const teamResultKpis = await this.prismaService.teamResultKpi.findMany({
          where: {
            teamId: team.id,
            kpiId: {
              in: kpiResultsIds,
            },
          },
          include: {
            kpi: true,
          },
        });

        // Ajouter les valeurs des KPI pour l'équipe
        let kpiValues = {};
        kpiResults.forEach((kpi) => {
          kpiValues[kpi.slug] = 0;
          const teamResultKpi = teamResultKpis.find(
            (tk) => tk.kpiId === kpi.id,
          );
          if (teamResultKpi) kpiValues[kpi.slug] = teamResultKpi.value;
        });

        team['kpiValues'] = kpiValues;

        // Supprimer les propriétés inutiles
        Reflect.deleteProperty(team, 'isDeleted');
        Reflect.deleteProperty(team, 'TeamUser');
      }),
    );

    activity['dataRowsCount'] = teams.reduce(
      (acc, team) => acc + team['dataRowsCount'],
      0,
    );

    activity['kpiValues'] = sumListKpiValues(
      teams.map((team) => team['kpiValues']),
    );

    // Retourner la réponse
    return {
      message: translate('Activité trouvé'),
      data: activity,
    };
  }

  async duplicate(id: number, userAuthenticated: any) {
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    // Duplicate the activity
    const duplicatedActivity = await this.prismaService.activity.create({
      data: {
        code: genActivityCode(),
        name: activity.name + ' (Copie)',
        description: activity.description,
        duplicatedFrom: activity.id,
      },
    });
    if (!duplicatedActivity)
      throw new InternalServerErrorException(
        translate("Erreur lors de la duplication de l'activité"),
      );

    // Return the response
    return {
      message: translate('Activité dupliquée avec succès'),
      data: duplicatedActivity,
    };
  }

  async update(id: number, updateActivityDto: UpdateActivityDto) {
    const { name, description, formId, teamIds } = updateActivityDto;

    // Retrieve the activity
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    // Update the activity
    let updatedActivity = await this.prismaService.activity.update({
      where: {
        id,
      },
      data: {
        name,
        description,
      },
    });
    if (!updatedActivity)
      throw new InternalServerErrorException(
        translate('Erreur lors de la mise à jour du Activité'),
      );

    if (formId) {
      // Retrieve the form
      const form = await this.prismaService.form.findUnique({
        where: {
          id: formId,
        },
      });
      if (!form)
        throw new NotFoundException(translate('Formulaire introuvable'));

      // Attach the activity to the form
      updatedActivity = await this.prismaService.activity.update({
        where: {
          id: id,
        },
        data: {
          formId,
        },
      });
    }

    // Add teams to the activity
    if (teamIds && teamIds.length > 0) {
      const teams = await this.prismaService.team.findMany({
        where: {
          id: {
            in: teamIds,
          },
          isActive: true,
          isDeleted: false,
        },
      });
      if (teams.length !== teamIds.length)
        throw new NotFoundException(
          translate("Il semble que certaines équipes n'existent pas"),
        );

      // Remove all teams from the activity
      await this.prismaService.activityTeam.deleteMany({
        where: {
          activityId: id,
        },
      });

      // Add teams to the activity
      await this.prismaService.activityTeam.createMany({
        data: teams.map((team) => ({
          activityId: id,
          teamId: team.id,
        })),
      });
    }

    // Return the response
    return {
      message: translate('Activité mis à jour avec succès'),
      data: updatedActivity,
    };
  }

  async changeStatus(id: number, userAuthenticated: any) {
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    // Update the activity
    const updatedProject = await this.prismaService.activity.update({
      where: {
        id,
      },
      data: {
        isActive: !activity.isActive,
      },
    });
    if (!updatedProject)
      throw new InternalServerErrorException(
        translate('Erreur lors du changement de statut du projet'),
      );

    // Return the response
    return {
      message: translate('Statut de l’activité modifié avec succès'),
      data: updatedProject,
    };
  }

  async remove(id: number) {
    // Retrieve the activity
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    // Delete the activity
    const deletedProject = await this.prismaService.activity.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    if (!deletedProject)
      throw new InternalServerErrorException(
        translate('Erreur lors de la suppression du projet'),
      );

    // Return the response
    return {
      message: translate('Projet supprimé avec succès'),
    };
  }

  async getKpiObjectiveDashboard(
    id: number,
    activityDashboardDto: ActivityDashboardDto,
  ) {
    const { startDate, endDate, teamIds } = activityDashboardDto;

    // Retrieve the activity
    const activity = await this.prismaService.activity.findUnique({
      include: {
        teams: {
          include: {
            team: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                isDeleted: true,
              },
            },
          },
        },
      },
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    let teams = [];
    activity.teams.forEach((activityTeam) => {
      if (activityTeam.team.isDeleted) return;
      teams.push(activityTeam.team);
    });

    // Vérifier si les équipes sont associées à l'activité
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

    const targetTeams =
      teamIds.length == 0
        ? teams
        : teams.filter((team) => teamIds.includes(team.id));

    // Retrieve the KPIs
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        activityId: id,
        type: Consts.KPI_TYPE_OBJECTIVE,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        code: true,
      },
    });
    const kpiIds = kpis.map((kpi) => kpi.id);

    // get data of kpi objective
    const teamObjectiveKpis =
      await this.prismaService.teamObjectiveKpi.findMany({
        where: {
          kpiId: {
            in: kpiIds,
          },
          // if teamIds is empty, get all teamObjectiveKpis
          teamId: {
            in: targetTeams.map((team) => team.id),
          },
        },
        select: {
          teamId: true,
          kpiId: true,
          value: true,
          createdAt: true,
        },
      });

    let totalByTeam: Record<string, Record<string, number>> = {};
    let totalByKpi: Record<string, number> = {};

    // 1️⃣  Initialiser toutes les équipes avec tous les KPI et toutes les dates à 0
    teams.forEach((team) => {
      totalByTeam[team.code] = {};
      kpis.forEach((kpi) => {
        totalByTeam[team.code][kpi.code] = 0;
      });
    });

    // 2️⃣ Initialiser le total par KPI à 0
    kpis.forEach((kpi) => {
      totalByKpi[kpi.code] = 0;
    });

    // Remplir avec les données existantes
    teamObjectiveKpis.forEach((teamObjectiveKpi) => {
      let team = teams.find((t) => t.id === teamObjectiveKpi.teamId);
      if (!team) return;

      let kpi = kpis.find((k) => k.id === teamObjectiveKpi.kpiId);
      if (!kpi) return;

      totalByTeam[team.code][kpi.code] += teamObjectiveKpi.value;
      totalByKpi[kpi.code] += teamObjectiveKpi.value;
    });

    // return the response
    return {
      message: translate('Tableau de bord des objectifs KPI'),
      data: {
        totalByTeam,
        totalByKpi,
      },
    };
  }

  async getKpiResultDashboard(
    id: number,
    activityDashboardDto: ActivityDashboardDto,
  ) {
    const { startDate, endDate, teamIds } = activityDashboardDto;

    // check the dates
    if (!isDate(new Date(startDate)))
      throw new BadRequestException(translate('Date de début invalide'));
    if (!isDate(new Date(endDate)))
      throw new BadRequestException(translate('Date de fin invalide'));
    if (new Date(startDate) > new Date(endDate))
      throw new BadRequestException(
        translate('La date de début doit être inférieure à la date de fin'),
      );

    // Retrieve the activity
    const activity = await this.prismaService.activity.findUnique({
      include: {
        teams: {
          include: {
            team: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                isDeleted: true,
              },
            },
          },
        },
      },
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    let teams = [];
    activity.teams.forEach((activityTeam) => {
      if (activityTeam.team.isDeleted) return;
      teams.push(activityTeam.team);
    });

    // Vérifier si les équipes sont associées à l'activité
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

    const targetTeams =
      teamIds.length == 0
        ? teams
        : teams.filter((team) => teamIds.includes(team.id));

    // Retrieve the KPIs
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        activityId: id,
        type: Consts.KPI_TYPE_RESULT,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        code: true,
      },
    });
    const kpiIds = kpis.map((kpi) => kpi.id);

    // get data of kpi result
    const teamResultKpis = await this.prismaService.teamResultKpi.findMany({
      where: {
        kpiId: {
          in: kpiIds,
        },
        // if teamIds is empty, get all teamResultKpis
        teamId: {
          in: targetTeams.map((team) => team.id),
        },
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        teamId: true,
        kpiId: true,
        value: true,
        createdAt: true,
      },
    });

    const dates = generateDatesBetween(startDate, endDate);

    let totalByTeam: Record<
      string,
      Record<string, Record<string, number>>
    > = {};
    let totalByKpi: Record<string, Record<string, number>> = {};

    // 1️⃣ Initialiser toutes les équipes avec tous les KPI et toutes les dates à 0
    teams.forEach((team) => {
      totalByTeam[team.code] = {};
      kpis.forEach((kpi) => {
        totalByTeam[team.code][kpi.code] = {};
        dates.forEach((date) => {
          totalByTeam[team.code][kpi.code][date] = 0;
        });
      });
    });

    // 2️⃣ Initialiser le total par KPI avec toutes les dates à 0
    kpis.forEach((kpi) => {
      totalByKpi[kpi.code] = {};
      dates.forEach((date) => {
        totalByKpi[kpi.code][date] = 0;
      });
    });

    // 3️⃣ Remplir avec les données existantes
    teamResultKpis.forEach((teamResultKpi) => {
      let team = teams.find((t) => t.id === teamResultKpi.teamId);
      if (!team) return;

      let kpi = kpis.find((k) => k.id === teamResultKpi.kpiId);
      if (!kpi) return;

      const dateKey = teamResultKpi.createdAt.toISOString().split('T')[0]; // Format YYYY-MM-DD
      totalByTeam[team.code][kpi.code][dateKey] += teamResultKpi.value;
      totalByKpi[kpi.code][dateKey] += teamResultKpi.value;
    });

    // 4️⃣ Trier les dates (optionnel mais propre)
    for (const teamCode in totalByTeam) {
      for (const kpiCode in totalByTeam[teamCode]) {
        totalByTeam[teamCode][kpiCode] = Object.fromEntries(
          Object.entries(totalByTeam[teamCode][kpiCode]).sort(
            ([dateA], [dateB]) => dateA.localeCompare(dateB),
          ),
        );
      }
    }

    let totals = {};
    for (const kpiCode in totalByKpi) {
      totalByKpi[kpiCode] = Object.fromEntries(
        Object.entries(totalByKpi[kpiCode]).sort(([dateA], [dateB]) =>
          dateA.localeCompare(dateB),
        ),
      );
      totals[kpiCode] = Object.values(totalByKpi[kpiCode]).reduce(
        (acc, value) => acc + value,
        0,
      );
    }

    // console.log('Totaux par équipe :', totalByTeam);
    // console.log('Totaux par KPI :', totalByKpi);

    // return the response
    return {
      message: translate('Tableau de bord des résultats KPI'),
      data: {
        totalByTeam,
        totalByKpi,
        totals,
      },
    };
  }

  async getReportTeamDashboard(
    id: number,
    activityDashboardDto: ActivityDashboardDto,
  ) {
    const { startDate, endDate, teamIds } = activityDashboardDto;

    // Vérifier les dates
    if (!isDate(new Date(startDate)))
      throw new BadRequestException(translate('Date de début invalide'));
    if (!isDate(new Date(endDate)))
      throw new BadRequestException(translate('Date de fin invalide'));
    if (new Date(startDate) > new Date(endDate))
      throw new BadRequestException(
        translate('La date de début doit être inférieure à la date de fin'),
      );

    // Récupérer l'activité
    const activity = await this.prismaService.activity.findUnique({
      include: {
        form: {
          include: {
            fields: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        },
        teams: {
          include: {
            team: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                isDeleted: true,
                users: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        firstname: true,
                        lastname: true,
                        phone: true,
                        profile: {
                          select: {
                            label: true,
                            value: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    let teams = [];
    activity.teams.forEach((activityTeam) => {
      if (activityTeam.team.isDeleted) return;
      activityTeam.team['members'] = activityTeam.team.users.map(
        (tu) => tu.user,
      );
      Reflect.deleteProperty(activityTeam.team, 'users');
      teams.push(activityTeam.team);
    });

    // Vérifier si les équipes sont associées à l'activité
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

    const targetTeams =
      teamIds.length == 0
        ? teams
        : teams.filter((team) => teamIds.includes(team.id));

    await Promise.all(
      targetTeams.map(async (team) => {
        // Compter les lignes de données pour l'équipe
        const userIds = team['members'].map((m) => m.id);

        // Compter les sessions distinctes pour l'équipe
        const teamDataRows = await this.prismaService.dataRow.findMany({
          where: {
            userId: {
              in: userIds,
            },
            fieldId: {
              in: activity.form.fields.map((f) => f.id),
            },
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          },
          distinct: ['sessionUuid'], // Distinct sur sessionUuid
          select: {
            sessionUuid: true,
          },
        });
        const countTeamDataRows = teamDataRows.length;
        team['dataRowsCount'] = countTeamDataRows;

        // Compter les sessions distinctes pour chaque membre individuel
        team['members'] = await Promise.all(
          team['members'].map(async (member) => {
            const memberDataRows = await this.prismaService.dataRow.findMany({
              where: {
                userId: member.id,
                fieldId: {
                  in: activity.form.fields.map((f) => f.id),
                },
                createdAt: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
              },
              distinct: ['sessionUuid'], // Distinct sur sessionUuid
              select: {
                sessionUuid: true,
              },
            });
            const countMemberDataRows = memberDataRows.length;
            return {
              ...member,
              dataRowsCount: countMemberDataRows,
            };
          }),
        );

        // Supprimer les propriétés inutiles
        Reflect.deleteProperty(team, 'isDeleted');
        Reflect.deleteProperty(team, 'TeamUser');
      }),
    );

    // Retourner la réponse
    let data = Object.fromEntries(targetTeams.map((team) => [team.code, team]));
    return {
      message: translate('Tableau de bord des rapports d’équipe'),
      data: data,
    };
  }

  async getDashboard(id: number, activityDashboardDto: ActivityDashboardDto) {
    const { startDate, endDate, teamIds } = activityDashboardDto;

    // Vérifier les dates
    if (!isDate(new Date(startDate)))
      throw new BadRequestException(translate('Date de début invalide'));
    if (!isDate(new Date(endDate)))
      throw new BadRequestException(translate('Date de fin invalide'));
    if (new Date(startDate) > new Date(endDate))
      throw new BadRequestException(
        translate('La date de début doit être inférieure à la date de fin'),
      );

    // Récupérer l'activité
    const activity = await this.prismaService.activity.findUnique({
      include: {
        teams: {
          include: {
            team: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
                isDeleted: true,
                users: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        firstname: true,
                        lastname: true,
                        phone: true,
                        profile: {
                          select: {
                            label: true,
                            value: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    let teams = [];
    activity.teams.forEach((activityTeam) => {
      if (activityTeam.team.isDeleted) return;
      activityTeam.team['members'] = activityTeam.team.users.map(
        (tu) => tu.user,
      );
      Reflect.deleteProperty(activityTeam.team, 'users');
      teams.push(activityTeam.team);
    });

    // Vérifier si les équipes sont associées à l'activité
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

    const targetTeams =
      teamIds.length == 0
        ? teams
        : teams.filter((team) => teamIds.includes(team.id));

    // lister les KPIs de l'activité
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        activityId: id,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        type: true,
      },
    });
    const allObjectiveKpis = kpis.filter(
      (kpi) => kpi.type === Consts.KPI_TYPE_OBJECTIVE,
    );
    const allResultKpis = kpis.filter(
      (kpi) => kpi.type === Consts.KPI_TYPE_RESULT,
    );

    // recuperer les liaisons objectif KPI et resultat KPI
    const links = await this.prismaService.objectiveResultLink.findMany({
      where: {
        objectiveId: {
          in: allObjectiveKpis.map((kpi) => kpi.id),
        },
        resultId: {
          in: allResultKpis.map((kpi) => kpi.id),
        },
      },
      select: {
        objectiveId: true,
        objective: {
          select: {
            id: true,
            code: true,
            name: true,
            value: true,
          },
        },
        resultId: true,
        result: {
          select: {
            id: true,
            code: true,
            name: true,
            value: true,
          },
        },
      },
    });

    let data = [];

    // Initialiser les taux à 0
    let rates = {};
    for (const l of links) {
      let lcode = l.objective.code + '_o_' + l.result.code;
      rates[lcode] = 0;

      let rate = 0;
      let total_objective = 0;
      let total_result = 0;

      let teamResults = await this.prismaService.teamResultKpi.findMany({
        where: {
          kpiId: l.resultId,
          teamId: {
            in: targetTeams.map((team) => team.id),
          },
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        select: {
          value: true,
        },
      });
      total_result = teamResults.reduce((acc, tr) => acc + tr.value, 0);

      if (teams.length == targetTeams.length) {
        total_objective = l.objective.value;
      } else {
        let teamObjectives = await this.prismaService.teamObjectiveKpi.findMany(
          {
            where: {
              kpiId: l.objectiveId,
              teamId: {
                in: targetTeams.map((team) => team.id),
              },
            },
            select: {
              value: true,
            },
          },
        );
        total_objective = teamObjectives.reduce((acc, to) => acc + to.value, 0);
      }

      if (total_objective != 0) {
        rate = (total_result / total_objective) * 100;
      }
      rates[lcode] = rate;

      data.push({
        objective: l.objective,
        result: l.result,
        code: lcode,
        total_objective: total_objective,
        total_result: total_result,
        rate: rate,
      });
    }

    // return the response
    return {
      message: translate('Tableau de bord des taux de réalisation'),
      data: data,
      // rates: rates,
    };
  }
}
