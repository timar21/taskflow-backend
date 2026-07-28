import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

export type RequestUser = { id: number; role: string };

// Core CRUD + ownership logic, migrated from the monolith's ProjectsService.
// Left out for this first pass: Redis caching, pagination, sorting, and
// filtering from Week 9 — those can be layered back on top of this once
// the split itself is proven solid, the same way user-service got its CRUD
// working before auth was added on top of it.
@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
    ) { }

    async findAll(currentUser: RequestUser): Promise<Project[]> {
        if (currentUser.role === 'admin') {
            return this.projectsRepository.find({ relations: { tasks: true } });
        }
        return this.projectsRepository.find({
            where: { ownerId: currentUser.id },
            relations: { tasks: true },
        });
    }

    async findOne(id: number, currentUser?: RequestUser): Promise<Project> {
        const project = await this.projectsRepository.findOne({
            where: { id },
            relations: { tasks: true },
        });
        if (!project) {
            throw new NotFoundException(`Project with id ${id} not found`);
        }
        if (currentUser) {
            this.assertCanAccess(project, currentUser);
        }
        return project;
    }

    async create(
        data: { name: string; description?: string; ownerId?: number },
        currentUser: RequestUser,
    ): Promise<Project> {
        const newProject = this.projectsRepository.create({
            name: data.name,
            description: data.description,
            ownerId: data.ownerId ?? currentUser.id,
        });
        return this.projectsRepository.save(newProject);
    }

    async update(
        id: number,
        data: Partial<{ name: string; description: string }>,
        currentUser: RequestUser,
    ): Promise<Project> {
        const project = await this.findOne(id);
        this.assertCanAccess(project, currentUser);
        Object.assign(project, data);
        return this.projectsRepository.save(project);
    }

    async remove(id: number, currentUser: RequestUser): Promise<{ message: string }> {
        const project = await this.findOne(id);
        this.assertCanAccess(project, currentUser);
        await this.projectsRepository.remove(project);
        return { message: `Project with id ${id} deleted successfully` };
    }

    private assertCanAccess(project: Project, currentUser: RequestUser): void {
        if (currentUser.role === 'admin') {
            return;
        }
        if (project.ownerId !== currentUser.id) {
            throw new ForbiddenException('You do not have access to this project');
        }
    }
}