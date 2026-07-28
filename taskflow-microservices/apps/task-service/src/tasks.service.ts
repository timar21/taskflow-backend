import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Project } from './entities/project.entity';

// Notification-on-assignment (Week 10's Bull queue) is intentionally left
// out of this first pass — it depended on looking up the assigned user's
// email, which now lives in a different service's database. Reintroducing
// it means task-service asking user-service (via RabbitMQ) for that user's
// details before queuing the email. Good next slice once this is stable.
@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly tasksRepository: Repository<Task>,
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
    ) { }

    async findAll(): Promise<Task[]> {
        return this.tasksRepository.find({ relations: { project: true } });
    }

    async findOne(id: number): Promise<Task> {
        const task = await this.tasksRepository.findOne({
            where: { id },
            relations: { project: true },
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
        const project = await this.projectsRepository.findOne({ where: { id: data.projectId } });
        if (!project) {
            throw new NotFoundException(`Project with id ${data.projectId} not found`);
        }

        const newTask = this.tasksRepository.create({
            title: data.title,
            completed: data.completed ?? false,
            project,
            assignedUserId: data.assignedUserId,
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
        if (data.assignedUserId !== undefined) task.assignedUserId = data.assignedUserId;
        return this.tasksRepository.save(task);
    }

    async remove(id: number): Promise<{ message: string }> {
        const task = await this.findOne(id);
        await this.tasksRepository.remove(task);
        return { message: `Task with id ${id} deleted successfully` };
    }
}