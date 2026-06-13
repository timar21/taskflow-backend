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
import { CurrentUser } from '../decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get()
    findAll(@Query('name') name?: string) {
        const projects = this.projectsService.findAll();
        if (name) {
            return projects.filter(p =>
                p.name.toLowerCase().includes(name.toLowerCase())
            );
        }
        return projects;
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.projectsService.findOne(Number(id));
    }

    @Post()
    create(@Body() body: CreateProjectDto, @CurrentUser() user: any) {
        console.log('Created by:', user);
        return this.projectsService.create(body);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: UpdateProjectDto) {
        return this.projectsService.update(Number(id), body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.projectsService.remove(Number(id));
    }
}