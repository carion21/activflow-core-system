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
import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { applyRbac } from 'src/common/functions';
import { SearchActivityDto } from './dto/search-activity.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { ActivityDashboardDto } from './dto/activity-dashboard.dto';

@ApiTags('Gestion des activités')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post('dashboard/:id')
  getDashboard(
    @Param('id') id: string,
    @Body() activityDashboardDto: ActivityDashboardDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_dashboard');

    return this.activityService.getDashboard(+id, activityDashboardDto);
  }

  @Post('kpi-objective-dashboard/:id')
  getKpiObjectiveDashboard(
    @Param('id') id: string,
    @Body() activityDashboardDto: ActivityDashboardDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_kpi_objective_dashboard');

    return this.activityService.getKpiObjectiveDashboard(
      +id,
      activityDashboardDto,
    );
  }

  @Post('kpi-result-dashboard/:id')
  getKpiResultDashboard(
    @Param('id') id: string,
    @Body() activityDashboardDto: ActivityDashboardDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_kpi_result_dashboard');

    return this.activityService.getKpiResultDashboard(
      +id,
      activityDashboardDto,
    );
  }

  @Post('report-team-dashboard/:id')
  getReportTeamDashboard(
    @Param('id') id: string,
    @Body() activityDashboardDto: ActivityDashboardDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_report_team_dashboard');

    return this.activityService.getReportTeamDashboard(
      +id,
      activityDashboardDto,
    );
  }

  @Post('search')
  search(
    @Body() searchActivityDto: SearchActivityDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_search');

    return this.activityService.search(searchActivityDto, userAuthenticated);
  }

  @Post()
  create(
    @Body() createActivityDto: CreateActivityDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_create');

    return this.activityService.create(createActivityDto, userAuthenticated);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_find_all');

    return this.activityService.findAll(paginationDto, userAuthenticated);
  }

  @Get('duplicate/:id')
  duplicate(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_duplicate');

    return this.activityService.duplicate(+id, userAuthenticated);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_find_one');

    return this.activityService.findOne(+id, userAuthenticated);
  }

  @Patch('change-status/:id')
  changeStatus(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_change_status');

    return this.activityService.changeStatus(+id, userAuthenticated);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_update');

    return this.activityService.update(+id, updateActivityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'activity_delete');

    return this.activityService.remove(+id);
  }
}
