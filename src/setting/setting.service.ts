import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { translate } from 'src/common/functions';

@Injectable()
export class SettingService {
  constructor(private readonly prismaService: PrismaService) {}

  async find() {
    // retrieve the setting
    const setting = await this.prismaService.setting.findFirst();
    if (!setting)
      throw new NotFoundException(translate('Paramètres introuvables'));

    // return the response
    return {
      message: translate('Paramètres récupérés avec succès'),
      data: setting,
    };
  }

  async update(updateSettingDto: UpdateSettingDto) {
    const { primaryColor, companyName, companyEmail, companyLogo } =
      updateSettingDto;

    const setting = await this.prismaService.setting.findFirst();
    if (!setting)
      throw new NotFoundException(translate('Paramètres introuvables'));

    // update the setting
    const updatedSetting = await this.prismaService.setting.update({
      where: { id: setting.id },
      data: { primaryColor, companyName, companyEmail, companyLogo },
    });

    // return the response
    return {
      message: translate('Paramètres mis à jour avec succès'),
      data: updatedSetting,
    };
  }
}
