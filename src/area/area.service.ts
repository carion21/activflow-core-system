import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedService } from 'src/shared/shared.service';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { genAreaCode, getSlug, translate } from 'src/common/functions';
import { SearchAreaDto } from './dto/search-kpi.dto';
import { AttributeAreasDto } from './dto/attribute-areas.dto';

@Injectable()
export class AreaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sharedService: SharedService,
  ) {}

  async create(createAreaDto: CreateAreaDto, userAuthenticated: object) {
    const { name, description } = createAreaDto;

    const slug = getSlug(name);
    // check if kpi already exists
    const areaExists = await this.prismaService.area.findFirst({
      where: {
        value: slug,
      },
    });
    if (areaExists)
      throw new ConflictException(translate('Cette zone existe déjà'));

    const area = await this.prismaService.area.create({
      data: {
        code: genAreaCode(),
        name,
        description,
        value: slug,
      },
    });
    if (!area)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création de la zone'),
      );

    // return the response
    return {
      message: translate('Zone créée avec succès'),
      data: area,
    };
  }

  async search(searchAreaDto: SearchAreaDto, userAuthenticated: any) {
    const { search } = searchAreaDto;

    const areas = await this.prismaService.area.findMany({
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
      orderBy: {
        id: 'desc',
      },
    });

    // Return the response
    return {
      message: translate('Liste des zones'),
      data: areas,
    };
  }

  async findAll(paginationDto: PaginationDto) {
    const options = {
      where: {
        isDeleted: false,
      },
    };

    const paginatedAreas = await this.sharedService.paginate(
      this.prismaService.area,
      paginationDto,
      options,
    );

    // Return the response
    return {
      message: translate('Liste des zones'),
      data: paginatedAreas,
    };
  }

  async findOne(id: number) {
    // retrieve the area

    const area = await this.prismaService.area.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!area)
      throw new NotFoundException(translate("Cette zone n'existe pas"));

    const areaRelations = await this.prismaService.activityTeamArea.findMany({
      where: {
        areaId: id,
      },
    });

    // get the list of activity unique ids
    const activityIds = areaRelations
      .map((relation) => relation.activityId)
      .filter((value, index, self) => self.indexOf(value) === index);

    const activities = await this.prismaService.activity.findMany({
      where: {
        id: {
          in: activityIds,
        },
        isDeleted: false,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    // get the list of team unique ids
    const teamIds = areaRelations
      .map((relation) => relation.teamId)
      .filter((value, index, self) => self.indexOf(value) === index);

    const teams = await this.prismaService.team.findMany({
      where: {
        id: {
          in: teamIds,
        },
        isDeleted: false,
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    area['activities'] = activities;
    area['teams'] = teams;

    // return the response
    return {
      message: translate('Détails de la zone'),
      data: area,
    };
  }

  async update(id: number, updateAreaDto: UpdateAreaDto) {
    const { name, description } = updateAreaDto;

    // check if area already exists
    const areaExists = await this.prismaService.area.findFirst({
      where: {
        id: {
          not: id,
        },
        value: getSlug(name),
      },
    });
    if (areaExists)
      throw new ConflictException(translate('Cette zone existe déjà'));

    // update the area
    const updatedArea = await this.prismaService.area.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        value: getSlug(name),
      },
    });
    if (!updatedArea)
      throw new InternalServerErrorException(
        translate('Erreur lors de la mise à jour de la zone'),
      );

    // return the response
    return {
      message: translate('Zone mise à jour avec succès'),
      data: updatedArea,
    };
  }

  async changeStatus(id: number, userAuthenticated: any) {
    const area = await this.prismaService.area.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!area) throw new NotFoundException(translate('Zone non trouvée'));

    const updatedArea = await this.prismaService.area.update({
      where: {
        id,
      },
      data: {
        isActive: !area.isActive,
      },
    });
    if (!updatedArea)
      throw new InternalServerErrorException(
        translate('Erreur lors de la mise à jour de la zone'),
      );

    // Return the response
    return {
      message: translate('Zone mise à jour'),
      data: updatedArea,
    };
  }

  async remove(id: number) {
    // check if area exists
    const area = await this.prismaService.area.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!area)
      throw new NotFoundException(translate("Cette zone n'existe pas"));

    // remove the area
    const removedArea = await this.prismaService.area.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });
    if (!removedArea)
      throw new InternalServerErrorException(
        translate('Erreur lors de la suppression de la zone'),
      );

    // return the response
    return {
      message: translate('Zone supprimée avec succès'),
      data: removedArea,
    };
  }

  async getActivityTeamAreas(activityId: number) {
    // check if activity exists
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id: activityId,
        isDeleted: false,
      },
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
    });
    if (!activity)
      throw new NotFoundException(translate("Cette activité n'existe pas"));

    let teams = [];
    activity.teams.forEach((activityTeam) => {
      if (activityTeam.team.isDeleted) return;
      teams.push(activityTeam.team);
    });

    // get the list of relations
    const areaRelations = await this.prismaService.activityTeamArea.findMany({
      where: {
        activityId,
      },
      select: {
        teamId: true,
        team: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        areaId: true,
        area: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    // get the list of team unique ids
    const teamUniqueIds = areaRelations
      .map((relation) => relation.teamId)
      .filter((value, index, self) => self.indexOf(value) === index);

    // by teams by areas
    const areasByTeams = teams.map((team) => {
      const teamAreas = areaRelations.filter(
        (relation) => relation.teamId === team.id,
      );
      return {
        ...team,
        areas: teamAreas.map((teamArea) => teamArea.area),
      };
    });

    // return the response
    return {
      message: translate('Liste des zones par équipe'),
      data: areasByTeams,
    };
  }

  async attributeAreas(
    activityId: number,
    attributeAreasDto: AttributeAreasDto,
  ) {
    const { teamAreas } = attributeAreasDto;

    // check if activity exists
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id: activityId,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate("Cette activité n'existe pas"));

    const teamUniqueIds = teamAreas
      .map((teamArea) => teamArea.teamId)
      .filter((value, index, self) => self.indexOf(value) === index);

    // check if teams exist
    const teams = await this.prismaService.team.findMany({
      where: {
        id: {
          in: teamUniqueIds,
        },
        isDeleted: false,
      },
    });
    if (teams.length !== teamUniqueIds.length)
      throw new NotFoundException(
        translate("Une ou plusieurs équipes n'existent pas"),
      );

    // check if areas exist
    const areaUniqueIds = teamAreas
      .map((teamArea) => teamArea.areaIds)
      .flat()
      .filter((value, index, self) => self.indexOf(value) === index);

    const areas = await this.prismaService.area.findMany({
      where: {
        id: {
          in: areaUniqueIds,
        },
        isDeleted: false,
      },
    });
    if (areas.length !== areaUniqueIds.length)
      throw new NotFoundException(
        translate("Une ou plusieurs zones n'existent pas"),
      );

    // remove all previous relations
    await this.prismaService.activityTeamArea.deleteMany({
      where: {
        activityId,
      },
    });

    // create new relations
    const relations = teamAreas
      .map((teamArea) => {
        return teamArea.areaIds.map((areaId) => {
          return {
            teamId: teamArea.teamId,
            areaId,
            activityId,
          };
        });
      })
      .flat();
    await this.prismaService.activityTeamArea.createMany({
      data: relations,
    });

    // return the response
    return {
      message: translate('Zones attribuées avec succès'),
    };
  }
}
