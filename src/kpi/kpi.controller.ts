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
  Query,
} from '@nestjs/common';
import { KpiService } from './kpi.service';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { applyRbac } from 'src/common/functions';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SearchKpiDto } from './dto/search-kpi.dto';
import { FillKpiDto } from './dto/fill-kpi.dto';
import { LinkKpiDto } from './dto/link-kpi.dto';

@ApiTags('Gestion des KPI')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Post('link')
  link(@Body() linkKpiDto: LinkKpiDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_link');

    return this.kpiService.link(linkKpiDto, userAuthenticated);
  }

  @Get('unlink/:id')
  unlink(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_unlink');

    return this.kpiService.unlink(+id, userAuthenticated);
  }

  @Post('search')
  search(@Body() searchKpiDto: SearchKpiDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_search');

    return this.kpiService.search(searchKpiDto, userAuthenticated);
  }

  @Post()
  create(@Body() createKpiDto: CreateKpiDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_create');

    return this.kpiService.create(createKpiDto);
  }

  @Get('objective-activity/:activityId')
  findObjectiveOfActivity(
    @Param('activityId') activityId: string,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_find_all_by_activity');

    return this.kpiService.findAllByActivity(+activityId, 'objective');
  }

  @Get('objective-team/:activityId')
  findObjectiveOfTeams(
    @Param('activityId') activityId: string,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_find_all_by_activity');

    return this.kpiService.findObjectiveOfTeams(+activityId);
  }

  @Get('result/:activityId')
  findResultOfActivity(
    @Param('activityId') activityId: string,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_find_all_by_activity');

    return this.kpiService.findAllByActivity(+activityId, 'result');
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_find_all');

    return this.kpiService.findAll(paginationDto, userAuthenticated);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_find_one');

    return this.kpiService.findOne(+id, userAuthenticated);
  }

  @Patch('fill-objective-activity/:activityId')
  fillObjectiveActivity(
    @Param('activityId') activityId: string,
    @Body() fillKpiDto: FillKpiDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_fill_objective');

    return this.kpiService.fillObjectiveActivity(
      +activityId,
      fillKpiDto,
      userAuthenticated,
    );
  }

  @Patch('fill-objective-team/:activityId')
  fillObjectiveTeam(
    @Param('activityId') activityId: string,
    @Body() fillKpiDto: FillKpiDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_fill_objective');

    return this.kpiService.fillObjectiveTeam(
      +activityId,
      fillKpiDto,
      userAuthenticated,
    );
  }

  @Patch('fill-result/:activityId')
  fillResult(
    @Param('activityId') activityId: string,
    @Body() fillKpiDto: FillKpiDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_fill_result');

    return this.kpiService.fillResult(
      +activityId,
      fillKpiDto,
      userAuthenticated,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateKpiDto: UpdateKpiDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_update');

    return this.kpiService.update(+id, updateKpiDto);
  }
}
