import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { DeliverReportDto } from './dto/deliver-report.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SharedService } from 'src/shared/shared.service';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import * as moment from 'moment';
import {
  genReportCode,
  listmonkSendEmail,
  translate,
} from 'src/common/functions';
import { ConfigService } from '@nestjs/config';
import { SearchReportDto } from './dto/search-report.dto';

@Injectable()
export class ReportService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly sharedService: SharedService,
  ) {}

  async create(createReportDto: CreateReportDto, userAuthenticated: object) {
    const { activityId, startDate, endDate } = createReportDto;

    // Vérifier les dates
    if (!moment.isDate(new Date(startDate)))
      throw new BadRequestException(translate('Date de début invalide'));
    if (!moment.isDate(new Date(endDate)))
      throw new BadRequestException(translate('Date de fin invalide'));
    if (new Date(startDate) > new Date(endDate))
      throw new BadRequestException(
        translate('La date de début doit être inférieure à la date de fin'),
      );

    const isAnViewer = userAuthenticated['profile']['value'] === 'viewer';
    let activityIds = [];
    if (isAnViewer) {
      const userActivites = await this.prismaService.activityUser.findMany({
        where: {
          userId: userAuthenticated['id'],
        },
        select: {
          activityId: true,
        },
      });
      activityIds = userActivites.map((activity) => activity.activityId);
    }

    // Vérifier l'activité
    const activity = await this.prismaService.activity.findUnique({
      where: {
        id: activityId,
        isDeleted: false,
      },
    });
    if (!activity)
      throw new NotFoundException(translate('Activité introuvable'));
    if (isAnViewer && !activityIds.includes(activityId))
      throw new ForbiddenException(
        translate(
          "Vous n'êtes pas autorisé à créer un rapport pour cette activité",
        ),
      );

    // Créer le rapport
    const report = await this.prismaService.report.create({
      data: {
        code: genReportCode(),
        activityId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        creatorId: userAuthenticated['id'],
      },
    });
    if (!report)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création'),
      );

    const setting = await this.prismaService.setting.findFirst();
    if (!setting)
      throw new NotFoundException(translate('Paramètres introuvables'));

    const user = await this.prismaService.user.findUnique({
      where: {
        id: userAuthenticated['id'],
      },
    });
    if (!user)
      throw new NotFoundException(translate('Utilisateur introuvable'));

    // send email
    const emailTemplateId = 7;
    const emailData = {
      report_code: report.code,
      report_date: moment(report.createdAt).format('DD/MM/YYYY à HH:mm'),
      support_email: setting.companyEmail,
      company_name: setting.companyName,
    };
    const listmonkEmail = await listmonkSendEmail(
      user,
      emailTemplateId,
      emailData,
    );
    console.log('listmonkEmail', listmonkEmail);

    // return the response
    return {
      message: translate('Rapport créé avec succès'),
      data: report,
    };
  }

  async search(searchReportDto: SearchReportDto, userAuthenticated: any) {
    const { search } = searchReportDto;

    const isAnViewer = userAuthenticated['profile']['value'] === 'viewer';

    let activityIds = [];
    if (isAnViewer) {
      const userActivites = await this.prismaService.activityUser.findMany({
        where: {
          userId: userAuthenticated['id'],
        },
        select: {
          activityId: true,
        },
      });
      activityIds = userActivites.map((activity) => activity.activityId);
    }

    const reports = await this.prismaService.report.findMany({
      where: {
        OR: [
          {
            code: {
              contains: search,
            },
          },
        ],
        creatorId: userAuthenticated['id'],
        // ...(isAnViewer &&
        //   activityIds.length > 0 && {
        //     activityId: { in: activityIds },
        //   }),
      },
      include: {
        activity: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    // Return the response
    return {
      message: translate('Liste des rapports'),
      data: reports,
    };
  }

  async findAll(paginationDto: PaginationDto, userAuthenticated: object) {
    const isAnViewer = userAuthenticated['profile']['value'] === 'viewer';

    let activityIds = [];
    if (isAnViewer) {
      const userActivites = await this.prismaService.activityUser.findMany({
        where: {
          userId: userAuthenticated['id'],
        },
        select: {
          activityId: true,
        },
      });
      activityIds = userActivites.map((activity) => activity.activityId);
    }

    const options = {
      where: {
        ...(isAnViewer &&
          activityIds.length > 0 && {
            activityId: { in: activityIds },
          }),
      },
      include: {
        activity: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    };

    const paginatedReports = await this.sharedService.paginate(
      this.prismaService.report,
      paginationDto,
      options,
    );

    // return the response
    return {
      message: translate('Liste des rapports'),
      data: paginatedReports,
    };
  }

  async findAllNotDelivered(userAuthenticated: any) {
    const isAnViewer = userAuthenticated['profile']['value'] === 'viewer';

    let activityIds = [];
    if (isAnViewer) {
      const userActivites = await this.prismaService.activityUser.findMany({
        where: {
          userId: userAuthenticated['id'],
        },
        select: {
          activityId: true,
        },
      });
      activityIds = userActivites.map((activity) => activity.activityId);
    }

    const reports = await this.prismaService.report.findMany({
      where: {
        ...(isAnViewer &&
          activityIds.length > 0 && {
            activityId: { in: activityIds },
          }),
        delivered: false,
      },
    });

    // return the response
    return {
      message: translate('Liste des rapports non livrés'),
      data: reports,
    };
  }

  async findOne(id: number, userAuthenticated: object) {
    const isAnViewer = userAuthenticated['profile']['value'] === 'viewer';

    let activityIds = [];
    if (isAnViewer) {
      const userActivites = await this.prismaService.activityUser.findMany({
        where: {
          userId: userAuthenticated['id'],
        },
        select: {
          activityId: true,
        },
      });
      activityIds = userActivites.map((activity) => activity.activityId);
    }

    const report = await this.prismaService.report.findUnique({
      where: {
        id,
        ...(isAnViewer &&
          activityIds.length > 0 && {
            activityId: { in: activityIds },
          }),
      },
      include: {
        activity: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });
    if (!report) throw new NotFoundException(translate('Rapport introuvable'));

    // return the response
    return {
      message: translate('Détails du rapport'),
      data: report,
    };
  }

  async deliver(
    id: number,
    deliverReportDto: DeliverReportDto,
    userAuthenticated: any,
  ) {
    const { filename, filelink } = deliverReportDto;
    // Vérifier le rapport
    const report = await this.prismaService.report.findUnique({
      where: {
        id,
        delivered: false,
      },
    });
    if (!report) throw new NotFoundException(translate('Rapport introuvable'));

    // Mettre à jour le rapport
    const updatedReport = await this.prismaService.report.update({
      where: {
        id,
      },
      data: {
        filename,
        delivered: true,
        deliveredAt: new Date(),
      },
    });
    if (!updatedReport)
      throw new InternalServerErrorException(
        translate('Erreur lors de la livraison'),
      );

    const setting = await this.prismaService.setting.findFirst();
    if (!setting)
      throw new NotFoundException(translate('Paramètres introuvables'));

    const user = await this.prismaService.user.findUnique({
      where: {
        id: report.creatorId,
      },
    });
    if (!user)
      throw new NotFoundException(translate('Utilisateur introuvable'));

    // send email
    const emailTemplateId = 8;
    const emailData = {
      report_code: report.code,
      report_date: moment(report.createdAt).format('DD/MM/YYYY à HH:mm'),
      report_download_url: filelink,
      support_email: setting.companyEmail,
      company_name: setting.companyName,
    };
    const listmonkEmail = await listmonkSendEmail(
      user,
      emailTemplateId,
      emailData,
    );
    console.log('listmonkEmail', listmonkEmail);

    // return the response
    return {
      message: translate('Rapport livré avec succès'),
      data: updatedReport,
    };
  }
}
