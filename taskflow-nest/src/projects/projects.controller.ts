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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

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
    async findOne(@Param('id') id: string) {
        return this.projectsService.findOne(Number(id));
    }

    @Post()
    async create(@Body() body: CreateProjectDto) {
        return this.projectsService.create(body);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: UpdateProjectDto) {
        return this.projectsService.update(Number(id), body);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.projectsService.remove(Number(id));
    }
    @Post('with-first-task')
    async createWithFirstTask(
        @Body() body: { name: string; description?: string; firstTaskTitle: string },
    ) {
        return this.projectsService.createWithFirstTask(body);
    }

}