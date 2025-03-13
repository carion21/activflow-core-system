import { PrismaClient } from '@prisma/client';

import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { Consts } from 'src/common/constants';
import {
  genFieldTypeCode,
  genProfileCode,
  genUserCode,
} from 'src/common/functions';

const prisma = new PrismaClient();
const configService = new ConfigService();

async function main() {
  await prisma.setting.create({
    data: {
      primaryColor: Consts.DEFAULT_SETTING_PRIMARY_COLOR,
      companyName: Consts.DEFAULT_SETTING_COMPANY_NAME,
      companyEmail: Consts.DEFAULT_SETTING_COMPANY_EMAIL,
      companyLogo: Consts.DEFAULT_SETTING_COMPANY_LOGO,
    },
  });
  console.log('Setting created');

  const fieldTypeDatas = Consts.DEFAULT_FIELD_TYPES.map((ftype) => {
    return {
      code: genFieldTypeCode(),
      label: ftype['label'],
      value: ftype['value'],
      status: ftype['status'],
      description: `Il s'agit du type de champ ${ftype['label']}`,
    };
  });
  await prisma.fieldType.createMany({
    data: fieldTypeDatas,
  });
  console.log('Field types created');

  // patienter 1 secondes
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const profileDatas = Consts.PROFILES.map((profile) => {
    return {
      code: genProfileCode(),
      label: profile['label'],
      value: profile['value'],
      description: profile['description'],
    };
  });
  await prisma.profile.createMany({
    data: profileDatas,
  });
  console.log('Profiles created');

  const profiles = await prisma.profile.findMany({
    where: {
      value: {
        in: Consts.PROFILES.map((profile) => profile['value']),
      },
    },
  });
  console.log('Profiles found');

  const userDatas = Consts.DEFAULT_USERS.map((user) => {
    let profileId = profiles.find(
      (profile) => profile.value === user['role'],
    ).id;
    let password = '';
    if (user['role'] === 'admin') {
      password =
        configService.get<string>('DEFAULT_ADMIN_PASSWORD') || 'password123';
    }
    if (user['role'] === 'runner') {
      password =
        configService.get<string>('DEFAULT_RUNNER_PASSWORD') || 'password123';
    }
    const hash = bcrypt.hashSync(password, 10);
    return {
      code: genUserCode(),
      lastname: user['lastname'],
      firstname: user['firstname'],
      email: user['email'],
      phone: user['phone'],
      profileId: profileId,
      password: hash,
    };
  });
  await prisma.user.createMany({
    data: userDatas,
  });
  console.log('Users created');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
