import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // GET /users/me - protected by JWT
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@CurrentUser() user: any) {
        return user;
    }

    @Get()
    findAll(@Query('name') name?: string) {
        const users = this.usersService.findAll();
        if (name) {
            return users.filter(u =>
                u.name.toLowerCase().includes(name.toLowerCase())
            );
        }
        return users;
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(Number(id));
    }

    @Post()
    create(@Body() body: CreateUserDto) {
        return this.usersService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: UpdateUserDto) {
        return this.usersService.update(Number(id), body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(Number(id));
    }
}