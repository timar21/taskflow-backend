import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Get()
    async findAll() {
        return this.tasksService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.tasksService.findOne(Number(id));
    }

    @Post()
    async create(@Body() body: CreateTaskDto) {
        return this.tasksService.create(body);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: UpdateTaskDto) {
        return this.tasksService.update(Number(id), body);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.tasksService.remove(Number(id));
    }
}