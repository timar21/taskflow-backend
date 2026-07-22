import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Project } from './entities/project.entity';
import { Task } from '../tasks/entities/task.entity';
import { FindProjectsDto } from './dto/find-projects.dto';

export type RequestUser = { id: number; role: string };

export interface PaginatedProjects {
    data: Project[];
    total: number;
    skip: number;
    take: number;
}

const PROJECTS_CACHE_TTL_MS = 60000;
const PROJECTS_CACHE_PREFIX = 'projects:findAll';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        private readonly dataSource: DataSource,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) { }

    // Admins see every project; regular users only see projects they own.
    // Uses a single query with LEFT JOINs (owner + tasks) to avoid N+1,
    // supports pagination, sorting, and filtering, and caches the result
    // per-user/per-query-shape for 60 seconds.
    async findAll(
        currentUser: RequestUser,
        options: FindProjectsDto = {},
    ): Promise<PaginatedProjects> {
        const skip = options.skip ?? 0;
        const take = options.take ?? 20;

        const cacheKey = this.buildCacheKey(currentUser, options, skip, take);
        const cached = await this.cacheManager.get<PaginatedProjects>(cacheKey);
        if (cached) {
            return cached;
        }

        const qb = this.projectsRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.owner', 'owner')
            .leftJoinAndSelect('project.tasks', 'task');

        if (currentUser.role !== 'admin') {
            qb.andWhere('owner.id = :ownerId', { ownerId: currentUser.id });
        }

        if (options.name) {
            qb.andWhere('project.name ILIKE :name', { name: `%${options.name}%` });
        }

        if (options.status) {
            qb.andWhere('project.status = :status', { status: options.status });
        }

        const sortColumn = options.sortBy === 'date' ? 'project.createdAt' : 'project.name';
        qb.orderBy(sortColumn, options.order ?? 'ASC');

        qb.skip(skip).take(take);

        const [data, total] = await qb.getManyAndCount();
        const result: PaginatedProjects = { data, total, skip, take };

        await this.cacheManager.set(cacheKey, result, PROJECTS_CACHE_TTL_MS);
        return result;
    }

    // Cache key includes the user's id and role (results differ per user) plus
    // every query param that changes the result shape — otherwise two different
    // requests (e.g. page 1 vs page 2, or two different users) could collide
    // on the same cached entry and leak or misreport data.
    private buildCacheKey(
        currentUser: RequestUser,
        options: FindProjectsDto,
        skip: number,
        take: number,
    ): string {
        const parts = [
            PROJECTS_CACHE_PREFIX,
            `user:${currentUser.id}`,
            `role:${currentUser.role}`,
            `name:${options.name ?? ''}`,
            `status:${options.status ?? ''}`,
            `sortBy:${options.sortBy ?? 'name'}`,
            `order:${options.order ?? 'ASC'}`,
            `skip:${skip}`,
            `take:${take}`,
        ];
        return parts.join('|');
    }

    // Mutations invalidate the whole findAll cache rather than trying to patch
    // individual entries — simplest correct approach at this scale. A larger
    // app would track and delete only the affected keys.
    private async invalidateProjectsCache(): Promise<void> {
        await this.cacheManager.clear();
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
        const saved = await this.projectsRepository.save(newProject);
        await this.invalidateProjectsCache();
        return saved;
    }

    async update(
        id: number,
        data: Partial<{ name: string; description: string }>,
        currentUser: RequestUser,
    ): Promise<Project> {
        const project = await this.findOne(id);
        this.assertCanAccess(project, currentUser);
        Object.assign(project, data);
        const saved = await this.projectsRepository.save(project);
        await this.invalidateProjectsCache();
        return saved;
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
        await this.invalidateProjectsCache();
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
            await this.invalidateProjectsCache();
            return savedProject;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}