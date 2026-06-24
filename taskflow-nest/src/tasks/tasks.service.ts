import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly tasksRepository: Repository<Task>,
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    async findAll(): Promise<Task[]> {
        return this.tasksRepository.find({ relations: ['project', 'assignedUser'] });
    }

    async findOne(id: number): Promise<Task> {
        const task = await this.tasksRepository.findOne({
            where: { id },
            relations: ['project', 'assignedUser'],
        });
        if (!task) {
            throw new NotFoundException(`Task with id ${id} not found`);
        }
        return task;
    }

    async create(data: {
        title: string;
        projectId: number;
        assignedUserId?: number;
        completed?: boolean;
    }): Promise<Task> {
        const project = await this.projectsRepository.findOne({
            where: { id: data.projectId },
        });
        if (!project) {
            throw new NotFoundException(`Project with id ${data.projectId} not found`);
        }

        let assignedUser: User | null = null;
        if (data.assignedUserId) {
            assignedUser = await this.usersRepository.findOne({
                where: { id: data.assignedUserId },
            });
            if (!assignedUser) {
                throw new NotFoundException(`User with id ${data.assignedUserId} not found`);
            }
        }

        const newTask = this.tasksRepository.create({
            title: data.title,
            completed: data.completed ?? false,
            project,
            assignedUser: assignedUser ?? undefined,
        });

        return this.tasksRepository.save(newTask);
    }

    async update(
        id: number,
        data: { title?: string; completed?: boolean; assignedUserId?: number },
    ): Promise<Task> {
        const task = await this.findOne(id);

        if (data.title) task.title = data.title;
        if (data.completed !== undefined) task.completed = data.completed;

        if (data.assignedUserId) {
            const assignedUser = await this.usersRepository.findOne({
                where: { id: data.assignedUserId },
            });
            if (!assignedUser) {
                throw new NotFoundException(`User with id ${data.assignedUserId} not found`);
            }
            task.assignedUser = assignedUser;
        }

        return this.tasksRepository.save(task);
    }

    async remove(id: number): Promise<{ message: string }> {
        const task = await this.findOne(id);
        await this.tasksRepository.remove(task);
        return { message: `Task with id ${id} deleted successfully` };
    }
}