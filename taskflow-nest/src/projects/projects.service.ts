import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project } from './entities/project.entity';
import { Task } from '../tasks/entities/task.entity';

export type RequestUser = { id: number; role: string };

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        private readonly dataSource: DataSource,
    ) { }

    // Admins see every project; regular users only see projects they own
    async findAll(currentUser: RequestUser): Promise<Project[]> {
        if (currentUser.role === 'admin') {
            return this.projectsRepository.find({ relations: ['owner', 'tasks'] });
        }
        return this.projectsRepository.find({
            where: { owner: { id: currentUser.id } },
            relations: ['owner', 'tasks'],
        });
    }

    async findOne(id: number, currentUser?: RequestUser): Promise<Project> {
        const project = await this.projectsRepository.findOne({
            where: { id },
            relations: ['owner', 'tasks'],
        });
        if (!project) {
            throw new NotFoundException(`Project with id ${id} not found`);
        }
        if (currentUser) {
            this.assertCanAccess(project, currentUser);
        }
        return project;
    }

    // Only admins may create projects; ownership defaults to the creating admin unless ownerId is given
    async create(
        data: { name: string; description?: string; ownerId?: number },
        currentUser: RequestUser,
    ): Promise<Project> {
        const { ownerId, ...rest } = data;
        const newProject = this.projectsRepository.create({
            ...rest,
            owner: { id: ownerId ?? currentUser.id } as any,
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

    // Regular users may only touch projects they own; admins can touch any project
    private assertCanAccess(project: Project, currentUser: RequestUser): void {
        if (currentUser.role === 'admin') {
            return;
        }
        if (!project.owner || project.owner.id !== currentUser.id) {
            throw new ForbiddenException('You do not have access to this project');
        }
    }

    async remove(id: number): Promise<{ message: string }> {
        const project = await this.findOne(id);

        // Delete related tasks first to avoid foreign key constraint violation
        if (project.tasks && project.tasks.length > 0) {
            await this.projectsRepository.manager.delete('tasks', { project: { id } });
        }

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