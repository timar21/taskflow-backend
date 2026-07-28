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
import { sendRpc } from './send-rpc';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('users')
export class GatewayController {
  constructor(@Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy) { }

  @Get()
  async findAll() {
    return sendRpc(this.userServiceClient, 'find_all_users', {});
  }

  // Must come before @Get(':id') — otherwise "me" would be captured as an :id value
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return user;
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return sendRpc(this.userServiceClient, 'find_user_by_id', { id: Number(id) });
  }

  @Post()
  async create(@Body() body: { name: string; email: string; password: string }) {
    return sendRpc(this.userServiceClient, 'create_user', body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string; email?: string }) {
    return sendRpc(this.userServiceClient, 'update_user', { id: Number(id), ...body });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return sendRpc(this.userServiceClient, 'delete_user', { id: Number(id) });
  }
}