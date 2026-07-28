import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

// Each @MessagePattern here is the RabbitMQ equivalent of an HTTP route —
// the gateway sends a message with this exact string tag, this method
// runs, and whatever it returns (or throws) travels back as the reply.
@Controller()
export class UserServiceController {
  constructor(private readonly usersService: UsersService) { }

  @MessagePattern('find_all_users')
  findAll() {
    return this.usersService.findAll();
  }

  @MessagePattern('find_user_by_id')
  findOne(@Payload() data: { id: number }) {
    return this.usersService.findOne(data.id);
  }

  @MessagePattern('create_user')
  create(@Payload() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @MessagePattern('update_user')
  update(@Payload() data: { id: number; name?: string; email?: string }) {
    const { id, ...rest } = data;
    return this.usersService.update(id, rest);
  }

  @MessagePattern('delete_user')
  remove(@Payload() data: { id: number }) {
    return this.usersService.remove(data.id);
  }
}