import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  controlData,
  genKpiCode,
  getSlug,
  translate,
} from 'src/common/functions';
import { Consts } from 'src/common/constants';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SharedService } from 'src/shared/shared.service';
import { SearchKpiDto } from './dto/search-kpi.dto';
import { FillKpiDto } from './dto/fill-kpi.dto';
import { LinkKpiDto } from './dto/link-kpi.dto';

@Injectable()
export class KpiService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sharedService: SharedService,
  ) {}

  async create(createKpiDto: CreateKpiDto) {
    const { activityId, name, type, description } = createKpiDto;

    // check if activity exists
    const activity = await this.prismaService.activity.findFirst({
      where: {
        id: activityId,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate("L'activité n'existe pas"));

    const slug = getSlug(name);
    // check if kpi already exists
    const kpiExists = await this.prismaService.kpi.findFirst({
      where: {
        activityId,
        slug,
      },
    });
    if (kpiExists) throw new ConflictException(translate('Ce KPI existe déjà'));

    const kpi = await this.prismaService.kpi.create({
      data: {
        code: genKpiCode(),
        name,
        type,
        slug,
        description,
        activityId,
      },
    });
    if (!kpi)
      throw new InternalServerErrorException(
        translate('Une erreur est survenue lors de la création du KPI'),
      );

    if (type === Consts.KPI_TYPE_OBJECTIVE) {
      // create the thresholds
      let thresholds = [];
      Consts.KPI_THRESHOLD_SCOPES.forEach((scope) => {
        Consts.KPI_THRESHOLD_TARGET_TYPES.forEach((targetType) => {
          thresholds.push({
            kpiId: kpi.id,
            scope,
            targetType,
            value: 0,
          });
        });
      });
      const kpiThresholds = await this.prismaService.kpiThreshold.createMany({
        data: thresholds,
      });
      if (!kpiThresholds)
        throw new InternalServerErrorException(
          translate(
            'Une erreur est survenue lors de la création des seuils du KPI',
          ),
        );
    }

    // Return the response
    return {
      message: translate('KPI créé avec succès'),
      data: kpi,
    };
  }

  async search(searchKpiDto: SearchKpiDto, userAuthenticated: any) {
    const { search } = searchKpiDto;

    const kpis = await this.prismaService.kpi.findMany({
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
      },
      include: {
        activity: true,
      },
      orderBy: {
        id: 'desc',
      },
    });

    // Return the response
    return {
      message: translate('Liste des KPIs'),
      data: kpis,
    };
  }

  async findAll(paginationDto: PaginationDto) {
    const options = {
      include: {
        activity: true,
      },
    };

    const paginatedKpis = await this.sharedService.paginate(
      this.prismaService.kpi,
      paginationDto,
      options,
    );

    // Return the response
    return {
      message: translate('Liste des KPIs'),
      data: paginatedKpis,
    };
  }

  async findAllByActivity(id: number, kpiType: string) {
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        activityId: id,
        type: kpiType,
        isActive: true,
        isDeleted: false,
      },
      select: {
        id: true,
        code: true,
        name: true,
        slug: true,
        type: true,
        value: true,
        activity: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    // Return the response
    return {
      message: translate('Liste des KPIs'),
      data: kpis,
    };
  }

  async findOne(id: number) {
    const kpi = await this.prismaService.kpi.findUnique({
      where: {
        id,
      },
      include: {
        activity: true,
        objectiveTeams: {
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
        resultTeams: {
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
        objectiveLinks: {
          include: {
            result: true,
          },
        },
        resultLinks: {
          include: {
            objective: true,
          },
        },
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
        thresholds: true,
      },
    });
    if (!kpi) throw new NotFoundException();
    translate("Ce KPI n'existe pas");

    // Return the response
    return {
      message: translate('KPI trouvé avec succès'),
      data: kpi,
    };
  }

  async update(id: number, updateKpiDto: UpdateKpiDto) {
    const { name, type, description } = updateKpiDto;

    const kpi = await this.prismaService.kpi.findUnique({
      where: {
        id,
      },
    });
    if (!kpi) throw new NotFoundException(translate("Ce KPI n'existe pas"));

    const slug = getSlug(name);
    // check if kpi already exists
    const kpiExists = await this.prismaService.kpi.findFirst({
      where: {
        activityId: kpi.activityId,
        slug,
        id: {
          not: id,
        },
      },
    });
    if (kpiExists) throw new ConflictException(translate('Ce KPI existe déjà'));

    const updatedKpi = await this.prismaService.kpi.update({
      where: {
        id,
      },
      data: {
        name,
        slug,
        description,
      },
    });

    // Return the response
    return {
      message: translate('KPI mis à jour avec succès'),
      data: updatedKpi,
    };
  }

  async fillObjectiveActivity(
    activityId: number,
    fillKpiDto: FillKpiDto,
    userAuthenticated: object,
  ) {
    const { datas } = fillKpiDto;

    // Retrieve the activity
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id: activityId,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    // control the datas
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        activityId,
        type: Consts.KPI_TYPE_OBJECTIVE,
        isActive: true,
        isDeleted: false,
      },
    });

    let mapFieldTypes = {};
    kpis.forEach((kpi) => {
      let k = kpi.slug;
      let v = Consts.DEFAULT_KPI_VALUE_TYPE;
      mapFieldTypes[k] = v;
    });

    const allFields = kpis.map((kpi) => kpi.slug);
    const requiredFields = kpis.map((kpi) => kpi.slug);
    const mapSelectValues = {};

    let inputs = {
      data: datas,
      mapFieldTypes: mapFieldTypes,
      allFields: allFields,
      requiredFields: requiredFields,
      mapSelectValues: mapSelectValues,
    };
    const bcontrol = controlData(inputs);
    if (!bcontrol.success)
      throw new BadRequestException(translate(bcontrol.message));

    // update the kpis
    kpis.forEach(async (kpi) => {
      const value = datas[kpi.slug];
      const updatedKpi = await this.prismaService.kpi.update({
        where: {
          id: kpi.id,
        },
        data: {
          value,
        },
      });
      if (!updatedKpi)
        throw new InternalServerErrorException(
          translate('Une erreur est survenue lors de la mise à jour du KPI'),
        );
    });

    // Return the response
    return {
      message: translate('KPIs remplis avec succès'),
    };
  }

  async fillObjectiveTeam(
    activityId: number,
    fillKpiDto: FillKpiDto,
    userAuthenticated: object,
  ) {
    const { datas } = fillKpiDto;

    // Retrieve the activity
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id: activityId,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    // Get activity team
    const ateams = await this.prismaService.activityTeam.findMany({
      where: {
        activityId,
      },
      select: {
        activityId: true,
        teamId: true,
        team: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });
    const teams = ateams.map((ateam) => ateam.team);
    const teamCodes = teams.map((team) => team.code);

    const kpis = await this.prismaService.kpi.findMany({
      where: {
        activityId,
        type: Consts.KPI_TYPE_OBJECTIVE,
        isActive: true,
        isDeleted: false,
      },
    });

    let mapFieldTypes = {};
    kpis.forEach((kpi) => {
      let k = kpi.slug;
      let v = Consts.DEFAULT_KPI_VALUE_TYPE;
      mapFieldTypes[k] = v;
    });

    const allFields = kpis.map((kpi) => kpi.slug);
    const requiredFields = kpis.map((kpi) => kpi.slug);
    const mapSelectValues = {};

    // control the datas for each team
    for (const teamCode of teamCodes) {
      let teamCodeDatas = datas[teamCode];

      let inputs = {
        data: teamCodeDatas,
        mapFieldTypes: mapFieldTypes,
        allFields: allFields,
        requiredFields: requiredFields,
        mapSelectValues: mapSelectValues,
      };
      const bcontrol = controlData(inputs);
      if (!bcontrol.success) {
        let message = `${teamCode}: ${translate(bcontrol.message)}`;
        throw new BadRequestException(translate(message));
      }
    }

    // check if all sum of KPIs is equal to the activity KPIs
    let sumKpis = {};
    for (const teamCode of teamCodes) {
      let teamCodeDatas = datas[teamCode];
      for (const kpi of kpis) {
        let k = kpi.slug;
        let v = teamCodeDatas[k];
        sumKpis[k] = sumKpis[k] ? sumKpis[k] + v : v;
      }
    }
    for (const kpi of kpis) {
      let k = kpi.slug;
      let v = sumKpis[k];
      if (v > kpi.value)
        throw new BadRequestException(
          translate(
            `La somme des KPIs <${kpi.name}> de chaque équipe doit être égale au KPI de l'activité qui est de ${kpi.value}`,
          ),
        );
    }

    // update the kpis
    for (const team of teams) {
      let teamId = team.id;
      let teamCode = team.code;
      let teamCodeDatas = datas[teamCode];

      // Remove all KPI values to the team
      await this.prismaService.teamObjectiveKpi.deleteMany({
        where: {
          teamId,
        },
      });

      // create the KPI value
      await this.prismaService.teamObjectiveKpi.createMany({
        data: kpis.map((kpi) => {
          return {
            teamId,
            kpiId: kpi.id,
            value: teamCodeDatas[kpi.slug],
          };
        }),
      });
    }

    // Return the response
    return {
      message: translate('KPIs remplis avec succès'),
    };
  }

  async fillResult(
    activityId: number,
    fillKpiDto: FillKpiDto,
    userAuthenticated: any,
  ) {
    const { datas } = fillKpiDto;

    // Retrieve the activity
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id: activityId,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    // control the datas
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        activityId,
        type: Consts.KPI_TYPE_RESULT,
        isActive: true,
        isDeleted: false,
      },
    });

    let mapFieldTypes = {};
    kpis.forEach((kpi) => {
      let k = kpi.slug;
      let v = Consts.DEFAULT_KPI_VALUE_TYPE;
      mapFieldTypes[k] = v;
    });

    const allFields = kpis.map((kpi) => kpi.slug);
    const requiredFields = kpis.map((kpi) => kpi.slug);
    const mapSelectValues = {};

    let inputs = {
      data: datas,
      mapFieldTypes: mapFieldTypes,
      allFields: allFields,
      requiredFields: requiredFields,
      mapSelectValues: mapSelectValues,
    };
    const bcontrol = controlData(inputs);
    if (!bcontrol.success)
      throw new BadRequestException(translate(bcontrol.message));

    // Get team of the user
    const uteams = await this.prismaService.teamUser.findMany({
      where: {
        userId: userAuthenticated['id'],
      },
      select: {
        teamId: true,
      },
    });
    const teamIds = uteams.map((uteam) => uteam.teamId);
    const ateam = await this.prismaService.activityTeam.findFirst({
      where: {
        activityId,
        teamId: {
          in: teamIds,
        },
      },
    });
    if (!ateam)
      throw new NotFoundException(
        translate(
          'Vous ne pouvez pas remplir ces KPIs| Equipe introuvable ou non autorisée',
        ),
      );

    // create all KPI values to the activity
    await this.prismaService.teamResultKpi.createMany({
      data: kpis.map((kpi) => {
        return {
          teamId: ateam.teamId,
          kpiId: kpi.id,
          value: datas[kpi.slug],
        };
      }),
    });

    // Return the response
    return {
      message: translate('KPIs remplis avec succès'),
    };
  }

  async findObjectiveOfTeams(activityId: number) {
    // Retrieve the activity
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id: activityId,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));

    // Get the teams
    const ateams = await this.prismaService.activityTeam.findMany({
      where: {
        activityId,
      },
      select: {
        activityId: true,
        team: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });
    const teams = ateams.map((ateam) => ateam.team);
    const teamIds = teams.map((team) => team.id);

    // Get the KPIs
    const kpis = await this.prismaService.kpi.findMany({
      where: {
        activityId,
        type: Consts.KPI_TYPE_OBJECTIVE,
        isActive: true,
        isDeleted: false,
      },
    });

    // get team objective kpis
    const teamObjectiveKpis =
      await this.prismaService.teamObjectiveKpi.findMany({
        where: {
          teamId: {
            in: teamIds,
          },
        },
        select: {
          teamId: true,
          kpiId: true,
          value: true,
        },
      });

    // Regroup by team by kpi
    let data = [];
    teams.forEach((team) => {
      let teamId = team.id;
      let teamData = {
        teamId,
        code: team.code,
        name: team.name,
        kpis: [],
      };
      kpis.forEach((kpi) => {
        let kpiId = kpi.id;
        let okpi = teamObjectiveKpis.find(
          (k) => k.teamId === teamId && k.kpiId === kpiId,
        );
        let kpiData = {
          kpiId,
          name: kpi.name,
          slug: kpi.slug,
          value: okpi ? okpi.value : 0,
        };
        teamData.kpis.push(kpiData);
      });
      data.push(teamData);
    });

    // Return the response
    return {
      message: translate('Liste des KPIs objectifs des équipes'),
      data: data,
    };
  }

  async link(linkKpiDto: LinkKpiDto, userAuthenticated: any) {
    const { objectiveId, resultId } = linkKpiDto;

    // Retrieve the KPIs
    const objective = await this.prismaService.kpi.findUnique({
      where: {
        id: objectiveId,
        type: Consts.KPI_TYPE_OBJECTIVE,
      },
    });
    if (!objective)
      throw new NotFoundException(translate('KPI objectif introuvable'));

    const result = await this.prismaService.kpi.findUnique({
      where: {
        id: resultId,
        type: Consts.KPI_TYPE_RESULT,
      },
    });
    if (!result)
      throw new NotFoundException(translate('KPI résultat introuvable'));

    // Remove all links with this result
    await this.prismaService.objectiveResultLink.deleteMany({
      where: {
        resultId,
      },
    });

    // Link the KPIs
    const link = await this.prismaService.objectiveResultLink.create({
      data: {
        objectiveId,
        resultId,
      },
    });
    if (!link)
      throw new InternalServerErrorException(
        translate('Une erreur est survenue lors du lien des KPIs'),
      );

    // Return the response
    return {
      message: translate('KPIs liés avec succès'),
      data: link,
    };
  }
}
