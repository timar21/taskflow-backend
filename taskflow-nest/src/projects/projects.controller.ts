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
import { CurrentUser } from '../decorators/current-user.decorator';
import { FindProjectsDto } from './dto/find-projects.dto';
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    // Admins see all projects; regular users only see the ones they own
    @Get()
    async findAll(
        @CurrentUser() user: { id: number; role: string },
        @Query() query: FindProjectsDto,
    ) {
        return this.projectsService.findAll(user, query);
    }

    @Get('with-tasks/query-builder')
    async findAllWithTasksQueryBuilder() {
        return this.projectsService.findAllWithTasksQueryBuilder();
    }

    // Regular users get a 403 if they try to view a project they don't own
    @Get(':id')
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { id: number; role: string },
    ) {
        return this.projectsService.findOne(id, user);
    }

    // Only admins may create projects
    @Post()
    @UseGuards(RolesGuard)
    @Roles('admin')
    async create(
        @Body() body: CreateProjectDto,
        @CurrentUser() user: { id: number; role: string },
    ) {
        return this.projectsService.create(body, user);
    }

    @Post('with-first-task')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async createWithFirstTask(
        @Body() body: { name: string; description?: string; firstTaskTitle: string },
    ) {
        return this.projectsService.createWithFirstTask(body);
    }

    // Regular users get a 403 if they try to update a project they don't own
    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateProjectDto,
        @CurrentUser() user: { id: number; role: string },
    ) {
        return this.projectsService.update(id, body, user);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.projectsService.remove(id);
    }
}