import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationEventPatterns } from '@app/shared';
import { Task } from './entities/task.entity';
import { Project } from './entities/project.entity';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly tasksRepository: Repository<Task>,
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        @Inject('NOTIFICATION_SERVICE')
        private readonly notificationServiceClient: ClientProxy,
    ) { }

    async findAll(): Promise<Task[]> {
        return this.tasksRepository.find({ relations: { project: true } });
    }

    // Returns tasks assigned to a specific user — used by GET /tasks/mine
    // in the gateway, so a user can see just their own work.
    async findAllForUser(userId: number): Promise<Task[]> {
        return this.tasksRepository.find({
            where: { assignedUserId: userId },
            relations: { project: true },
        });
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
        const savedTask = await this.tasksRepository.save(newTask);

        // Fire-and-forget — the caller doesn't wait for this and a failure
        // here should never fail the task creation itself. emit() (not
        // send()) is the event pattern: no reply is expected, unlike the
        // request/response send() calls used for CRUD.
        this.notificationServiceClient.emit(NotificationEventPatterns.TASK_CREATED, {
            taskId: savedTask.id,
            title: savedTask.title,
            projectId: project.id,
            assignedUserId: savedTask.assignedUserId,
        });

        return savedTask;
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