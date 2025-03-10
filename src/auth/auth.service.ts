import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignInDto } from './dto/sign-in.dto';

import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import {
  generatePassword,
  getUiAvatar,
  isValidPassword,
  listmonkSendEmail,
  translate,
} from 'src/common/functions';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const user = await this.prismaService.user.findFirst({
      where: {
        email,
      },
      include: {
        profile: true,
      },
    });
    // Verify if the user exists in the database
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    // Verify if the password is correct
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      throw new UnauthorizedException(translate('Mot de passe incorrect'));
    // generate ui avatar if profile picture is not available
    if (!user.profilePicture) user.profilePicture = getUiAvatar(user);
    // Generate the JWT
    Reflect.deleteProperty(user, 'password');
    Reflect.deleteProperty(user, 'createdAt');
    Reflect.deleteProperty(user, 'updatedAt');
    Reflect.deleteProperty(user, 'createdBy');
    Reflect.deleteProperty(user, 'profileId');

    const payload = {
      sub: user.id,
      code: user.code,
      lastname: user.lastname,
      firstname: user.firstname,
      email: user.email,
      phone: user.phone,
    };
    // generate ui avatar if profile picture is not available
    if (!user.profilePicture) payload['profilePicture'] = getUiAvatar(user);
    const jwt = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRATION_TIME'),
    });

    // Return the user and the token
    return {
      message: translate('Connexion réussie'),
      data: {
        user,
        jwt,
      },
    };
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    userAuthenticated: object,
  ) {
    const { oldPassword, newPassword } = changePasswordDto;
    // password must be different from the old password and must be at least 8 characters
    // if (newPassword.length < 8)
    if (!isValidPassword(newPassword))
      throw new BadRequestException(
        translate(
          'Le mot de passe doit contenir au moins 8 caractères, au moins deux chiffres, aucun caractère spécial et aucune espace',
        ),
      );

    // retrieve the user
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userAuthenticated['id'],
      },
      include: {
        profile: true,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    // Verify if the old password is correct
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match)
      throw new UnauthorizedException(translate('Mot de passe incorrect'));

    if (oldPassword === newPassword)
      throw new BadRequestException(
        translate("Le nouveau mot de passe doit être différent de l'ancien"),
      );

    // hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // compare the new password with the old password
    // const match = await bcrypt.compare(password, user.password);
    // if (match) throw new BadRequestException('Password must be different');
    // update the user with the new password
    const updatedUser = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        isNeedChangePass: false,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors de la mise à jour de l'utilisateur"),
      );

    // send email
    const emailTemplateId = 5;
    const emailData = {
      login_url: this.configService.get('BUILDER_BASE_URL') + '/security/login',
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      include: {
        profile: true,
      },
    });

    // retrieve the user
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    const password = generatePassword();

    // hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    // update the user with the new password
    const updatedUser = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors de la mise à jour de l'utilisateur"),
      );

    // Return the response
    return {
      message: translate('Mot de passe réinitialisé avec succès'),
    };
  }
}
