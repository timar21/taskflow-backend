import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get()
    findAll() {
        return this.projectsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        const project = this.projectsService.findOne(Number(id));
        if (!project) {
            throw new NotFoundException(`Project with id ${id} not found`);
        }
        return project;
    }
}