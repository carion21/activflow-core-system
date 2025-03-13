import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TeamModule } from './team/team.module';
import { SharedModule } from './shared/shared.module';
import { FormModule } from './form/form.module';
import { ActivityModule } from './activity/activity.module';
import { KpiModule } from './kpi/kpi.module';
import { FieldTypeModule } from './field-type/field-type.module';
import { MinioModule } from './minio/minio.module';
import { StoreModule } from './store/store.module';
import { AreaModule } from './area/area.module';
import { SettingModule } from './setting/setting.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MinioModule,
    SharedModule,
    AuthModule,
    UserModule,
    TeamModule,
    FieldTypeModule,
    FormModule,
    ActivityModule,
    KpiModule,
    StoreModule,
    AreaModule,
    SettingModule,
    DashboardModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
