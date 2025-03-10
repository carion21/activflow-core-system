import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { genTeamCode, translate } from 'src/common/functions';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SharedService } from 'src/shared/shared.service';
import { SearchTeamDto } from './dto/search-team.dto';

@Injectable()
export class TeamService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sharedService: SharedService,
  ) {}

  async create(createTeamDto: CreateTeamDto, userAuthenticated: any) {
    const { name, members } = createTeamDto;

    let users = [];
    if (members.length > 0) {
      users = await this.prismaService.user.findMany({
        where: {
          id: {
            in: members,
          },
          isActive: true,
          isDeleted: false,
        },
      });
      if (users.length !== members.length)
        throw new NotFoundException(
          translate("Un ou plusieurs membres n'existent pas"),
        );
    }

    const team = await this.prismaService.team.create({
      data: {
        code: genTeamCode(),
        name,
      },
    });
    if (!team)
      throw new InternalServerErrorException(
        translate("Erreur lors de la création de l'équipe"),
      );

    if (users.length > 0) {
      await this.prismaService.teamUser.createMany({
        data: users.map((user) => ({
          userId: user.id,
          teamId: team.id,
        })),
      });
    }

    // Return the response
    return {
      message: translate('Équipe créée avec succès'),
      data: team,
    };
  }

  async search(searchTeamDto: SearchTeamDto, userAuthenticated: object) {
    const { search } = searchTeamDto;

    const teams = await this.prismaService.team.findMany({
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
        users: {
          include: {
            user: {
              select: {
                id: true,
                code: true,
                email: true,
                lastname: true,
                firstname: true,
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
      orderBy: {
        id: 'desc',
      },
    });

    teams.forEach((team) => {
      let members = [];
      team.users.forEach((teamUser) => {
        members.push(teamUser.user);
      });
      Reflect.deleteProperty(team, 'users');
      team['members'] = members;
    });

    // Return the response
    return {
      message: translate('Liste des équipes'),
      data: teams,
    };
  }

  async findAll(paginationDto: PaginationDto) {
    const options = {
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                code: true,
                email: true,
                lastname: true,
                firstname: true,
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
      where: {
        isDeleted: false,
      },
    };

    const paginatedTeams = await this.sharedService.paginate(
      this.prismaService.team,
      paginationDto,
      options,
    );

    paginatedTeams.data.forEach((team) => {
      let members = [];
      team.users.forEach((teamUser) => {
        members.push(teamUser.user);
      });
      Reflect.deleteProperty(team, 'users');
      team['members'] = members;
    });

    // Return the response
    return {
      message: translate('Liste des équipes'),
      data: paginatedTeams,
    };
  }

  async findOne(id: number) {
    const team = await this.prismaService.team.findFirst({
      include: {
        activities: {
          select: {
            activity: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                code: true,
                email: true,
                lastname: true,
                firstname: true,
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
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!team) throw new NotFoundException(translate('Équipe non trouvée'));

    let activities = [];
    team.activities.forEach((teamActivity) => {
      activities.push(teamActivity.activity);
    });
    Reflect.deleteProperty(team, 'activities');
    team['activities'] = activities;

    let members = [];
    team.users.forEach((teamUser) => {
      members.push(teamUser.user);
    });
    Reflect.deleteProperty(team, 'users');
    team['members'] = members;

    // Return the response
    return {
      message: translate('Équipe trouvée'),
      data: team,
    };
  }

  async update(
    id: number,
    updateTeamDto: UpdateTeamDto,
    userAuthenticated: any,
  ) {
    const { name, members } = updateTeamDto;

    const team = await this.prismaService.team.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!team) throw new NotFoundException(translate('Équipe non trouvée'));

    let users = [];
    if (members.length > 0) {
      users = await this.prismaService.user.findMany({
        where: {
          id: {
            in: members,
          },
          isActive: true,
          isDeleted: false,
        },
      });
      if (users.length !== members.length)
        throw new NotFoundException(
          translate("Un ou plusieurs membres n'existent pas"),
        );

      await this.prismaService.teamUser.deleteMany({
        where: {
          teamId: team.id,
        },
      });

      await this.prismaService.teamUser.createMany({
        data: users.map((user) => ({
          userId: user.id,
          teamId: team.id,
        })),
      });
    }

    const updatedTeam = await this.prismaService.team.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });
    if (!updatedTeam)
      throw new InternalServerErrorException(
        translate("Erreur lors de la mise à jour de l'équipe"),
      );

    // Return the response
    return {
      message: translate('Équipe mise à jour'),
      data: updatedTeam,
    };
  }

  async changeStatus(id: number, userAuthenticated: any) {
    const team = await this.prismaService.team.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!team) throw new NotFoundException(translate('Équipe non trouvée'));

    const updatedTeam = await this.prismaService.team.update({
      where: {
        id,
      },
      data: {
        isActive: !team.isActive,
      },
    });
    if (!updatedTeam)
      throw new InternalServerErrorException(
        translate("Erreur lors de la mise à jour de l'équipe"),
      );

    // Return the response
    return {
      message: translate('Équipe mise à jour'),
      data: updatedTeam,
    };
  }

  async remove(id: number, userAuthenticated: any) {
    const team = await this.prismaService.team.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!team) throw new NotFoundException(translate('Équipe non trouvée'));

    // Remove all team users
    await this.prismaService.teamUser.deleteMany({
      where: {
        teamId: team.id,
      },
    });

    // Update the team
    const updatedTeam = await this.prismaService.team.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
    if (!updatedTeam)
      throw new InternalServerErrorException(
        translate("Erreur lors de la suppression de l'équipe"),
      );

    // Return the response
    return {
      message: translate('Équipe supprimée'),
    };
  }
}
