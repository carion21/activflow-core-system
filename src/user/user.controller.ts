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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { applyRbac } from 'src/common/functions';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { AuthorizeActivityDto } from './dto/authorize-activity.dto';

@ApiTags('Gestion des utilisateurs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('authorize-activity/:id')
  authorizeActivity(
    @Param('id') id: string,
    @Body() authorizeActivityDto: AuthorizeActivityDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_authorize_activity');

    return this.userService.authorizeActivity(
      +id,
      authorizeActivityDto,
      userAuthenticated,
    );
  }

  @Post('search')
  search(@Body() searchUserDto: SearchUserDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_search');

    return this.userService.search(searchUserDto, userAuthenticated);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_create');

    return this.userService.create(createUserDto, userAuthenticated);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_find_all');

    return this.userService.findAll(userAuthenticated, paginationDto);
  }

  @Get('me')
  findMe(@Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_find_me');

    return this.userService.findOne(userAuthenticated.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_find_one');

    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_update');

    return this.userService.update(+id, updateUserDto, userAuthenticated);
  }

  @Patch('update-password/:id')
  updatePassword(
    @Param('id') id: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_update_password');

    return this.userService.updatePassword(
      +id,
      updatePasswordDto,
      userAuthenticated,
    );
  }

  @Patch('change-status/:id')
  changeStatus(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_change_status');

    return this.userService.changeStatus(+id, userAuthenticated);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_delete');

    return this.userService.remove(+id, userAuthenticated);
  }
}
