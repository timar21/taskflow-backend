import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserMessagePatterns, CreateUserDto } from '@app/shared';
import { sendRpc } from './send-rpc';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class GatewayController {
  constructor(@Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy) { }

  @ApiOperation({ summary: 'List all users' })
  @Get()
  async findAll() {
    return sendRpc(this.userServiceClient, UserMessagePatterns.FIND_ALL_USERS, {});
  }

  // Must come before @Get(':id') — otherwise "me" would be captured as an :id value
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the currently authenticated user (from the access token)' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  @ApiOperation({ summary: 'Get a single user by id' })
  @ApiParam({ name: 'id', type: Number })
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return sendRpc(this.userServiceClient, UserMessagePatterns.FIND_USER_BY_ID, { id: Number(id) });
  }

  @ApiOperation({ summary: 'Register a new user — no authentication required' })
  @Post()
  async create(@Body() body: CreateUserDto) {
    return sendRpc(this.userServiceClient, UserMessagePatterns.CREATE_USER, body);
  }

  @ApiOperation({ summary: "Update a user's name or email" })
  @ApiParam({ name: 'id', type: Number })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string; email?: string }) {
    return sendRpc(this.userServiceClient, UserMessagePatterns.UPDATE_USER, { id: Number(id), ...body });
  }

  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: Number })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return sendRpc(this.userServiceClient, UserMessagePatterns.DELETE_USER, { id: Number(id) });
  }
}