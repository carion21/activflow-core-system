import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AreaService } from './area.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { applyRbac } from 'src/common/functions';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SearchAreaDto } from './dto/search-kpi.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AttributeAreasDto } from './dto/attribute-areas.dto';

@ApiTags('Gestion des zones')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('area')
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Post('attribute/:activityId')
  attributeAreas(
    @Param('activityId') activityId: string,
    @Body() attributeAreasDto: AttributeAreasDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'area_attribute');

    return this.areaService.attributeAreas(+activityId, attributeAreasDto);
  }

  @Post('search')
  search(@Body() searchAreaDto: SearchAreaDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'area_search');

    return this.areaService.search(searchAreaDto, userAuthenticated);
  }

  @Post()
  create(@Body() createAreaDto: CreateAreaDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'area_create');

    return this.areaService.create(createAreaDto, userAuthenticated);
  }

  @Get('activity-team/:activityId')
  getActivityTeamAreas(
    @Param('activityId') activityId: string,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'area_get_activity_team_areas');

    return this.areaService.getActivityTeamAreas(+activityId);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'area_find_all');

    return this.areaService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'area_find_one');

    return this.areaService.findOne(+id);
  }

  @Patch('change-status/:id')
  changeStatus(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'area_change_status');

    return this.areaService.changeStatus(+id, userAuthenticated);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAreaDto: UpdateAreaDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'area_update');

    return this.areaService.update(+id, updateAreaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'area_remove');

    return this.areaService.remove(+id);
  }
}
