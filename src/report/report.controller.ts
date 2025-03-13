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
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { DeliverReportDto } from './dto/deliver-report.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { applyRbac } from 'src/common/functions';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SearchReportDto } from './dto/search-report.dto';

@ApiTags('Gestion des rapports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('search')
  search(@Body() searchReportDto: SearchReportDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'report_search');

    return this.reportService.search(searchReportDto, userAuthenticated);
  }

  @Post()
  create(@Body() createReportDto: CreateReportDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'report_create');

    return this.reportService.create(createReportDto, userAuthenticated);
  }

  @Get('not-delivered')
  findAllNotDelivered(@Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'report_find_all');

    return this.reportService.findAllNotDelivered(userAuthenticated);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'report_find_all');

    return this.reportService.findAll(paginationDto, userAuthenticated);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'report_find_one');

    return this.reportService.findOne(+id, userAuthenticated);
  }

  @Patch(':id')
  deliver(
    @Param('id') id: string,
    @Body() deliverReportDto: DeliverReportDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'report_deliver');

    return this.reportService.deliver(+id, deliverReportDto, userAuthenticated);
  }
}
