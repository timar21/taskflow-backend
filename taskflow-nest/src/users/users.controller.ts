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

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@CurrentUser() user: any) {
        return user;
    }

    @Get()
    async findAll(@Query('name') name?: string) {
        const users = await this.usersService.findAll();
        if (name) {
            return users.filter((u) =>
                u.name.toLowerCase().includes(name.toLowerCase()),
            );
        }
        return users;
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(Number(id));
    }

    @Post()
    async create(@Body() body: CreateUserDto) {
        return this.usersService.create(body);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
        return this.usersService.update(Number(id), body);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.usersService.remove(Number(id));
    }
}