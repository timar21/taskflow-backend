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
    ParseIntPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get()
    async findAll(@Query('name') name?: string) {
        const projects = await this.projectsService.findAll();
        if (name) {
            return projects.filter((p) =>
                p.name.toLowerCase().includes(name.toLowerCase()),
            );
        }
        return projects;
    }

    @Get('with-tasks/query-builder')
    async findAllWithTasksQueryBuilder() {
        return this.projectsService.findAllWithTasksQueryBuilder();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.projectsService.findOne(id);
    }

    @Post()
    async create(@Body() body: CreateProjectDto) {
        return this.projectsService.create(body);
    }

    @Post('with-first-task')
    async createWithFirstTask(
        @Body() body: { name: string; description?: string; firstTaskTitle: string },
    ) {
        return this.projectsService.createWithFirstTask(body);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateProjectDto,
    ) {
        return this.projectsService.update(id, body);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.projectsService.remove(id);
    }
}