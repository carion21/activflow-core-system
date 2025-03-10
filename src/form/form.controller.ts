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
import { FormService } from './form.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { applyRbac } from 'src/common/functions';
import { AddFieldDto } from './dto/add-field.dto';
import { UpdateFieldsDto } from './dto/update-fields.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SearchFormDto } from './dto/search-form.dto';

@ApiTags('Gestion des formulaires')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('form')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post('search')
  search(@Body() searchFormDto: SearchFormDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'team_search');

    return this.formService.search(searchFormDto, userAuthenticated);
  }

  @Post()
  create(@Body() createFormDto: CreateFormDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_create');

    return this.formService.create(createFormDto, userAuthenticated);
  }

  @Get('available')
  findAllAvailable(@Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_find_all');

    return this.formService.findAllAvailable();
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_find_all');

    return this.formService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_find_one');

    return this.formService.findOne(+id);
  }

  @Get('by-uuid/:uuid')
  findOneByUuid(@Param('uuid') uuid: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_find_one');

    return this.formService.findOneByUuid(uuid);
  }

  @Get('duplicate/:id')
  duplicate(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_duplicate');

    return this.formService.duplicate(+id, userAuthenticated);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFormDto: UpdateFormDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_update');

    return this.formService.update(+id, updateFormDto, userAuthenticated);
  }

  @Patch('add-field/:id')
  addField(
    @Param('id') id: string,
    @Body() addFieldDto: AddFieldDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_add_field');

    return this.formService.addField(+id, addFieldDto, userAuthenticated);
  }

  @Patch('update-fields/:id')
  updateFields(
    @Param('id') id: string,
    @Body() updateFieldsDto: UpdateFieldsDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_update_fields');

    return this.formService.updateFields(
      +id,
      updateFieldsDto,
      userAuthenticated,
    );
  }

  @Patch('change-status/:id')
  changeStatus(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_change_status');

    return this.formService.changeStatus(+id, userAuthenticated);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'form_remove');
    return this.formService.remove(+id, userAuthenticated);
  }
}
