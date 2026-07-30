import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserMessagePatterns, CreateUserDto } from '@app/shared';
import { UsersService } from './users.service';

@Controller()
export class UserServiceController {
  constructor(private readonly usersService: UsersService) { }

  @MessagePattern(UserMessagePatterns.FIND_ALL_USERS)
  findAll() {
    return this.usersService.findAll();
  }

  @MessagePattern(UserMessagePatterns.FIND_USER_BY_ID)
  findOne(@Payload() data: { id: number }) {
    return this.usersService.findOne(data.id);
  }

  @MessagePattern(UserMessagePatterns.CREATE_USER)
  create(@Payload() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @MessagePattern(UserMessagePatterns.UPDATE_USER)
  update(@Payload() data: { id: number; name?: string; email?: string }) {
    const { id, ...rest } = data;
    return this.usersService.update(id, rest);
  }

  @MessagePattern(UserMessagePatterns.DELETE_USER)
  remove(@Payload() data: { id: number }) {
    return this.usersService.remove(data.id);
  }
}