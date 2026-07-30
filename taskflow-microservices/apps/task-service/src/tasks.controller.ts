import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskMessagePatterns, CreateTaskDto } from '@app/shared';
import { TasksService } from './tasks.service';

@Controller()
export class TasksMessageController {
    constructor(private readonly tasksService: TasksService) { }

    @MessagePattern(TaskMessagePatterns.FIND_ALL_TASKS)
    findAll() {
        return this.tasksService.findAll();
    }

    @MessagePattern(TaskMessagePatterns.FIND_TASK_BY_ID)
    findOne(@Payload() data: { id: number }) {
        return this.tasksService.findOne(data.id);
    }

    @MessagePattern(TaskMessagePatterns.GET_TASKS)
    getTasksForUser(@Payload() data: { userId: number }) {
        return this.tasksService.findAllForUser(data.userId);
    }

    @MessagePattern(TaskMessagePatterns.CREATE_TASK)
    create(@Payload() data: CreateTaskDto) {
        return this.tasksService.create(data);
    }

    @MessagePattern(TaskMessagePatterns.UPDATE_TASK)
    update(
        @Payload() data: { id: number; title?: string; completed?: boolean; assignedUserId?: number },
    ) {
        const { id, ...rest } = data;
        return this.tasksService.update(id, rest);
    }

    @MessagePattern(TaskMessagePatterns.DELETE_TASK)
    remove(@Payload() data: { id: number }) {
        return this.tasksService.remove(data.id);
    }
}