import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task)
        private readonly tasksRepository: Repository<Task>,
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly notificationsService: NotificationsService,
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

        const savedTask = await this.tasksRepository.save(newTask);

        if (assignedUser) {
            await this.notifyTaskAssigned(savedTask, assignedUser);
        }

        return savedTask;
    }

    async update(
        id: number,
        data: { title?: string; completed?: boolean; assignedUserId?: number },
    ): Promise<Task> {
        const task = await this.findOne(id);

        if (data.title) task.title = data.title;
        if (data.completed !== undefined) task.completed = data.completed;

        let newlyAssignedUser: User | null = null;

        if (data.assignedUserId) {
            // Only notify when the assignment actually changes — re-saving the
            // same assignee on every unrelated update would spam the queue.
            const isReassignment = task.assignedUser?.id !== data.assignedUserId;

            const assignedUser = await this.usersRepository.findOne({
                where: { id: data.assignedUserId },
            });
            if (!assignedUser) {
                throw new NotFoundException(`User with id ${data.assignedUserId} not found`);
            }
            task.assignedUser = assignedUser;

            if (isReassignment) {
                newlyAssignedUser = assignedUser;
            }
        }

        const savedTask = await this.tasksRepository.save(task);

        if (newlyAssignedUser) {
            await this.notifyTaskAssigned(savedTask, newlyAssignedUser);
        }

        return savedTask;
    }

    // Queues a background email job rather than sending inline — a slow or
    // failing email provider should never block or fail the task request itself.
    private async notifyTaskAssigned(task: Task, user: User): Promise<void> {
        await this.notificationsService.queueTaskAssignedEmail({
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            taskId: task.id,
            taskTitle: task.title,
        });
    }

    async remove(id: number): Promise<{ message: string }> {
        const task = await this.findOne(id);
        await this.tasksRepository.remove(task);
        return { message: `Task with id ${id} deleted successfully` };
    }
}