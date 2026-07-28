import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Inject,
    UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { sendRpc } from './send-rpc';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class GatewayTasksController {
    constructor(@Inject('TASK_SERVICE') private readonly taskServiceClient: ClientProxy) { }

    @Get()
    async findAll() {
        return sendRpc(this.taskServiceClient, 'find_all_tasks', {});
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return sendRpc(this.taskServiceClient, 'find_task_by_id', { id: Number(id) });
    }

    @Post()
    async create(
        @Body() body: { title: string; projectId: number; assignedUserId?: number; completed?: boolean },
    ) {
        return sendRpc(this.taskServiceClient, 'create_task', body);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() body: { title?: string; completed?: boolean; assignedUserId?: number },
    ) {
        return sendRpc(this.taskServiceClient, 'update_task', { id: Number(id), ...body });
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return sendRpc(this.taskServiceClient, 'delete_task', { id: Number(id) });
    }
}