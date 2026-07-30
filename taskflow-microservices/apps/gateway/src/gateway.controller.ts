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
import { UserMessagePatterns } from '@app/shared';
import { sendRpc } from './send-rpc';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('users')
export class GatewayController {
  constructor(@Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy) { }

  @Get()
  async findAll() {
    return sendRpc(this.userServiceClient, UserMessagePatterns.FIND_ALL_USERS, {});
  }

  // Must come before @Get(':id') — otherwise "me" would be captured as an :id value
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return sendRpc(this.userServiceClient, UserMessagePatterns.FIND_USER_BY_ID, { id: Number(id) });
  }

  @Post()
  async create(@Body() body: { name: string; email: string; password: string }) {
    return sendRpc(this.userServiceClient, UserMessagePatterns.CREATE_USER, body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string; email?: string }) {
    return sendRpc(this.userServiceClient, UserMessagePatterns.UPDATE_USER, { id: Number(id), ...body });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return sendRpc(this.userServiceClient, UserMessagePatterns.DELETE_USER, { id: Number(id) });
  }
}