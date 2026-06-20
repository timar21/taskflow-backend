import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project } from './entities/project.entity';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        private readonly dataSource: DataSource,
    ) { }

    async findAll(): Promise<Project[]> {
        return this.projectsRepository.find({ relations: ['owner', 'tasks'] });
    }

    async findOne(id: number): Promise<Project> {
        const project = await this.projectsRepository.findOne({
            where: { id },
            relations: ['owner', 'tasks'],
        });
        if (!project) {
            throw new NotFoundException(`Project with id ${id} not found`);
        }
        return project;
    }

    async create(data: { name: string; description?: string }): Promise<Project> {
        const newProject = this.projectsRepository.create(data);
        return this.projectsRepository.save(newProject);
    }

    async update(
        id: number,
        data: Partial<{ name: string; description: string }>,
    ): Promise<Project> {
        const project = await this.findOne(id);
        Object.assign(project, data);
        return this.projectsRepository.save(project);
    }

    async remove(id: number): Promise<{ message: string }> {
        const project = await this.findOne(id);
        await this.projectsRepository.remove(project);
        return { message: `Project with id ${id} deleted successfully` };
    }

    async findAllWithTasksQueryBuilder(): Promise<Project[]> {
        return this.projectsRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.tasks', 'task')
            .leftJoinAndSelect('project.owner', 'owner')
            .getMany();
    }

    async createWithFirstTask(data: {
        name: string;
        description?: string;
        firstTaskTitle: string;
    }): Promise<Project> {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const project = queryRunner.manager.create(Project, {
                name: data.name,
                description: data.description,
            });
            const savedProject = await queryRunner.manager.save(project);

            const task = queryRunner.manager.create(Task, {
                title: data.firstTaskTitle,
                completed: false,
                project: savedProject,
            });
            await queryRunner.manager.save(task);

            await queryRunner.commitTransaction();
            return savedProject;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}