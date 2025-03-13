import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { applyRbac } from 'src/common/functions';
import { SaveInStoreDto } from './dto/save-in-store.dto';
import { ShowDataForAdminDto } from './dto/show-data-for-admin.dto';
import { ShowDataForRunnerDto } from './dto/show-data-for-runner.dto';

@ApiTags('Gestion du stockage des données')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post('for-admin')
  showForAdmin(
    @Body() showDataForAdminDto: ShowDataForAdminDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'store_show_for_admin');

    return this.storeService.showForAdmin(showDataForAdminDto, userAuthenticated);
  }

  @Post('for-runner')
  showForRunner(
    @Body() showDataForRunnerDto: ShowDataForRunnerDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'store_show_for_runner');

    return this.storeService.showForRunner(showDataForRunnerDto, userAuthenticated);
  }

  @Post()
  save(@Body() saveInStoreDto: SaveInStoreDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'store_save');

    return this.storeService.save(saveInStoreDto, userAuthenticated);
  }

  @Get(':formUuid')
  show(@Param('formUuid') formUuid: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'store_show');

    return this.storeService.show(formUuid, userAuthenticated);
  }

  @Get('list-session/:formUuid')
  listSession(@Param('formUuid') formUuid: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'store_list_session');

    return this.storeService.listSession(formUuid, userAuthenticated);
  }

  @Get('show-session/:formUuid/:sessionUuid')
  showSession(
    @Param('formUuid') formUuid: string,
    @Param('sessionUuid') sessionUuid: string,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'store_show_session');

    return this.storeService.showSession(
      formUuid,
      sessionUuid,
      userAuthenticated,
    );
  }
}
