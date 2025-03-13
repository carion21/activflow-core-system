import { Injectable, NotFoundException } from '@nestjs/common';
import { Consts } from 'src/common/constants';
import { translate } from 'src/common/functions';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAdminDashboard(userAuthenticated: object) {
    const activityCount = await this.prismaService.activity.count({
      where: {
        isDeleted: false,
      },
    });

    const areaCount = await this.prismaService.area.count({
      where: {
        isDeleted: false,
      },
    });

    const kpiCount = await this.prismaService.kpi.count({
      where: {
        isDeleted: false,
      },
    });

    const formCount = await this.prismaService.form.count({
      where: {
        isDeleted: false,
      },
    });

    const teamCount = await this.prismaService.team.count({
      where: {
        isDeleted: false,
      },
    });

    const userCount = await this.prismaService.user.count({
      where: {
        isDeleted: false,
        profile: {
          value: {
            notIn: [Consts.VIEWER_PROFILE],
          },
        },
      },
    });

    const reportCount = await this.prismaService.report.count();

    // return response
    return {
      message: translate('Données du tableau de bord récupérées avec succès'),
      data: {
        activityCount,
        areaCount,
        kpiCount,
        formCount,
        teamCount,
        userCount,
        reportCount,
      },
    };
  }

  async getViewerDashboard(userAuthenticated: object) {
    // retrieve viewer
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userAuthenticated['id'],
      },
    });
    if (!user)
      throw new NotFoundException(translate('Utilisateur introuvable'));

    let userActivities = await this.prismaService.activityUser.findMany({
      where: {
        userId: user.id,
      },
      select: {
        activityId: true,
      },
    });
    const activityIds = userActivities.map((activity) => activity.activityId);

    const activityCount = await this.prismaService.activity.count({
      where: {
        id: {
          in: activityIds,
        },
        isDeleted: false,
      },
    });

    const kpiCount = await this.prismaService.kpi.count({
      where: {
        activityId: {
          in: activityIds,
        },
        isDeleted: false,
      },
    });

    const reportCount = await this.prismaService.report.count({
      where: {
        creatorId: user.id,
      },
    });

    // return response
    return {
      message: translate('Données du tableau de bord récupérées avec succès'),
      data: {
        activityCount,
        kpiCount,
        reportCount,
      },
    };
  }
}
