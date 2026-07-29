import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller()
export class TasksMessageController {
    constructor(private readonly tasksService: TasksService) { }

    @MessagePattern('find_all_tasks')
    findAll() {
        return this.tasksService.findAll();
    }

    @MessagePattern('find_task_by_id')
    findOne(@Payload() data: { id: number }) {
        return this.tasksService.findOne(data.id);
    }

    @MessagePattern('get_tasks')
    getTasksForUser(@Payload() data: { userId: number }) {
        return this.tasksService.findAllForUser(data.userId);
    }

    @MessagePattern('create_task')
    create(@Payload() data: CreateTaskDto) {
        return this.tasksService.create(data);
    }

    @MessagePattern('update_task')
    update(
        @Payload() data: { id: number; title?: string; completed?: boolean; assignedUserId?: number },
    ) {
        const { id, ...rest } = data;
        return this.tasksService.update(id, rest);
    }

    @MessagePattern('delete_task')
    remove(@Payload() data: { id: number }) {
        return this.tasksService.remove(data.id);
    }
}