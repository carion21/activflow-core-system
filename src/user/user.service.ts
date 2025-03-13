import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  generatePassword,
  genUserCode,
  getUiAvatar,
  listmonkSendEmail,
  translate,
} from 'src/common/functions';

import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { ConfigService } from '@nestjs/config';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SharedService } from 'src/shared/shared.service';
import { SearchUserDto } from './dto/search-user.dto';
import { Consts } from 'src/common/constants';
import { AuthorizeActivityDto } from './dto/authorize-activity.dto';
import { profile } from 'console';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly sharedService: SharedService,
  ) {}

  async create(createUserDto: CreateUserDto, userAuthenticated: object) {
    const { role, lastname, firstname, email, phone } = createUserDto;

    const tempPassword = generatePassword();
    // const tempPassword = 'password123';
    const emailExists = await this.prismaService.user.findFirst({
      where: {
        email,
      },
    });
    if (emailExists)
      throw new ConflictException(translate('Email déjà utilisé'));

    const profile = await this.prismaService.profile.findFirst({
      where: {
        value: role,
      },
    });
    if (!profile) throw new NotFoundException(translate('Profil non trouvé'));

    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const user = await this.prismaService.user.create({
      data: {
        code: genUserCode(),
        profileId: profile.id,
        lastname: lastname.toUpperCase(),
        firstname: firstname.toUpperCase(),
        email,
        phone,
        password: hashedPassword,
        isNeedChangePass: true,
        // isNeedChangePass: false,
      },
    });
    if (!user)
      throw new InternalServerErrorException(
        translate("Erreur lors de la création de l'utilisateur"),
      );

    const setting = await this.prismaService.setting.findFirst();
    if (!setting)
      throw new NotFoundException(translate('Paramètres introuvables'));

    const isAnAdminOrViewer = [Consts.ADMIN_PROFILE, Consts.VIEWER_PROFILE].includes(
      profile.value,
    );

    let baseUrl = this.configService.get('BUILDER_BASE_URL');
    if (isAnAdminOrViewer) {
      baseUrl = this.configService.get('ADMINER_BASE_URL');
    }

    // send email
    const emailTemplateId = 4;
    const emailData = {
      email: user.email,
      profile: profile.label.toUpperCase(),
      temp_password: tempPassword,
      login_url: baseUrl + '/security/login',
      support_email: setting.companyEmail,
      company_name: setting.companyName,
    };
    const listmonkEmail = await listmonkSendEmail(
      user,
      emailTemplateId,
      emailData,
    );
    console.log('listmonkEmail', listmonkEmail);

    Reflect.deleteProperty(user, 'password');
    // Return the response
    return {
      message: translate('Utilisateur créé avec succès'),
      data: user,
    };
  }

  async search(searchUserDto: SearchUserDto, userAuthenticated: object) {
    const { search } = searchUserDto;

    const users = await this.prismaService.user.findMany({
      where: {
        OR: [
          {
            code: {
              contains: search,
            },
          },
          {
            lastname: {
              contains: search,
            },
          },
          {
            firstname: {
              contains: search,
            },
          },
          {
            email: {
              contains: search,
            },
          },
          {
            phone: {
              contains: search,
            },
          },
        ],
        isDeleted: false,
      },
      include: {
        profile: {
          select: {
            label: true,
            value: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    // generate ui avatar if profile picture is not available
    users.forEach((user) => {
      if (!user.profilePicture) user.profilePicture = getUiAvatar(user);
      Reflect.deleteProperty(user, 'password');
    });

    // Return the response
    return {
      message: translate('Liste des utilisateurs'),
      data: users,
    };
  }

  async findAll(userAuthenticated: object, paginationDto: PaginationDto) {
    const options = {
      include: {
        profile: {
          select: {
            label: true,
            value: true,
          },
        },
      },
      where: {
        id: {
          not: userAuthenticated['id'],
        },
        profile: {
          value: {
            notIn: [Consts.RUNNER_PROFILE],
          },
        },
        isDeleted: false,
      },
    };
    const paginatedUsers = await this.sharedService.paginate(
      this.prismaService.user,
      paginationDto,
      options,
    );

    // generate ui avatar if profile picture is not available
    paginatedUsers.data.forEach((user) => {
      if (!user.profilePicture) user.profilePicture = getUiAvatar(user);
      Reflect.deleteProperty(user, 'password');
    });

    // Return the response
    return {
      message: translate('Liste des utilisateurs'),
      data: paginatedUsers,
    };
  }

  async findOne(id: number) {
    const user = await this.prismaService.user.findFirst({
      where: { id, isDeleted: false },
      include: {
        profile: { select: { label: true, value: true } },
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
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    if (!user.profilePicture) user.profilePicture = getUiAvatar(user);

    Reflect.deleteProperty(user, 'password');

    let data = {};
    if (user.profile.value !== Consts.VIEWER_PROFILE) {
      // Récupération des équipes et activités associées
      const teamsData = await this.prismaService.teamUser.findMany({
        where: { userId: id },
        select: {
          team: {
            select: {
              id: true,
              code: true,
              name: true,
              activities: {
                select: {
                  activity: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      formId: true,
                      form: {
                        select: {
                          id: true,
                          uuid: true,
                          fields: {
                            where: { isDeleted: false },
                            select: { id: true },
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
      });

      // Extraction des activités et équipes uniques
      const activitiesMap = new Map();
      const teams = teamsData.map(({ team }) => {
        team.activities.forEach(({ activity }) => {
          if (!activitiesMap.has(activity.id)) {
            activitiesMap.set(activity.id, {
              id: activity.id,
              code: activity.code,
              name: activity.name,
              formId: activity.form?.id ?? null,
              formUuid: activity.form?.uuid ?? null,
              dataRowCount: 0,
              fieldIds: activity.form?.fields.map((f) => f.id) ?? [],
            });
          }
        });
        return { id: team.id, code: team.code, name: team.name };
      });

      // Calcul du nombre de sessions uniques pour chaque activité
      for (const activity of activitiesMap.values()) {
        if (activity.fieldIds.length) {
          const distinctSessions = await this.prismaService.dataRow.findMany({
            where: { fieldId: { in: activity.fieldIds }, userId: user.id },
            distinct: ['sessionUuid'],
            select: { sessionUuid: true },
          });
          activity.dataRowCount = distinctSessions.length;
        }
        delete activity.fieldIds; // Nettoyage des données temporaires
      }

      data = { ...user, activities: Array.from(activitiesMap.values()), teams };
    } else {
      let activities = user.activities.map((au) => au.activity);
      data = { ...user, activities };
    }

    return {
      message: translate('Utilisateur trouvé'),
      data: data,
    };
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    userAuthenticated: object,
  ) {
    const { lastname, firstname, email, phone } = updateUserDto;

    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));
    if (user.email !== email) {
      const emailExists = await this.prismaService.user.findFirst({
        where: {
          email,
        },
      });
      if (emailExists)
        throw new ConflictException(translate('Email déjà utilisé'));
    }

    const updatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        lastname: lastname.toUpperCase(),
        firstname: firstname.toUpperCase(),
        email,
        phone,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors de la mise à jour de l'utilisateur"),
      );

    Reflect.deleteProperty(updatedUser, 'password');
    // Return the response
    return {
      message: translate('Utilisateur mis à jour'),
      data: updatedUser,
    };
  }

  async updatePassword(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
    userAuthenticated: object,
  ) {
    const { password } = updatePasswordDto;

    // check if the user exists
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate(
          "Erreur lors de la mise à jour du mot de passe de l'utilisateur",
        ),
      );

    // Return the response
    return {
      message: translate('Mot de passe mis à jour'),
    };
  }

  async changeStatus(id: number, userAuthenticated: object) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    const updatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        isActive: !user.isActive,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors du changement de statut de l'utilisateur"),
      );

    // Return the response
    return {
      message: translate("Statut de l'utilisateur modifié"),
      data: updatedUser,
    };
  }

  async remove(id: number, userAuthenticated: object) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    const deletedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: moment().format(),
      },
    });
    if (!deletedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors de la suppression de l'utilisateur"),
      );

    // Return the response
    return {
      message: translate('Utilisateur supprimé'),
    };
  }

  async authorizeActivity(
    id: number,
    authorizeActivityDto: AuthorizeActivityDto,
    userAuthenticated: any,
  ) {
    const { activityIds } = authorizeActivityDto;

    // check if the user exists
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        profile: {
          value: Consts.VIEWER_PROFILE,
        },
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    // check if the activities exist
    let activities = [];
    if (activityIds.length) {
      activities = await this.prismaService.activity.findMany({
        where: {
          id: {
            in: activityIds,
          },
          isDeleted: false,
        },
      });
      if (activities.length !== activityIds.length)
        throw new NotFoundException(translate('Activités non trouvées'));
    }

    // remove old authorizations
    await this.prismaService.activityUser.deleteMany({
      where: {
        userId: id,
      },
    });

    // authorize the activities
    if (activities.length) {
      const activityUserDatas = activities.map((activity) => {
        return {
          userId: id,
          activityId: activity.id,
        };
      });
      await this.prismaService.activityUser.createMany({
        data: activityUserDatas,
      });
    }

    // Return the response
    return {
      message: translate('Activités autorisées avec succès'),
    };
  }

  async resetPassword(id: number, userAuthenticated: any) {
    // retrieve the user
    const user = await this.prismaService.user.findUnique({
      where: {
        id: id,
      },
      include: {
        profile: {
          select: {
            value: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    // generate a new password
    const tempPassword = generatePassword();
    // hash the new password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // update the user with the new password
    const updatedUser = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        isNeedChangePass: true,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors de la mise à jour de l'utilisateur"),
      );

    const setting = await this.prismaService.setting.findFirst();
    if (!setting)
      throw new NotFoundException(translate('Paramètres introuvables'));

    const isAnAdminOrViewer = [Consts.ADMIN_PROFILE, Consts.VIEWER_PROFILE].includes(
      user.profile.value,
    );

    let baseUrl = this.configService.get('BUILDER_BASE_URL');
    if (isAnAdminOrViewer) {
      baseUrl = this.configService.get('ADMINER_BASE_URL');
    }

    // send email
    const emailTemplateId = 6;
    const emailData = {
      email: user.email,
      temp_password: tempPassword,
      login_url: baseUrl + '/security/login',
      support_email: setting.companyEmail,
      company_name: setting.companyName,
    };
    const listmonkEmail = await listmonkSendEmail(
      user,
      emailTemplateId,
      emailData,
    );
    console.log('listmonkEmail', listmonkEmail);

    // Return the response
    return {
      message: translate('Mot de passe modifié avec succès'),
    };
  }
}
