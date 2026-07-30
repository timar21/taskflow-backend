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
import { TaskMessagePatterns } from '@app/shared';
import { sendRpc } from './send-rpc';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { enrichTaskWithAssignedUser, enrichTasksWithAssignedUsers } from './aggregation/enrich-tasks';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class GatewayTasksController {
    constructor(
        @Inject('TASK_SERVICE') private readonly taskServiceClient: ClientProxy,
        @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
    ) { }

    @Get()
    async findAll() {
        const tasks = await sendRpc<any[]>(this.taskServiceClient, TaskMessagePatterns.FIND_ALL_TASKS, {});
        return enrichTasksWithAssignedUsers(tasks, this.userServiceClient);
    }

    // Must come before @Get(':id') — otherwise "mine" would be captured as an :id value
    @Get('mine')
    async findMine(@CurrentUser() currentUser: { id: number }) {
        const tasks = await sendRpc<any[]>(this.taskServiceClient, TaskMessagePatterns.GET_TASKS, {
            userId: currentUser.id,
        });
        return enrichTasksWithAssignedUsers(tasks, this.userServiceClient);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const task = await sendRpc(this.taskServiceClient, TaskMessagePatterns.FIND_TASK_BY_ID, {
            id: Number(id),
        });
        return enrichTaskWithAssignedUser(task, this.userServiceClient);
    }

    @Post()
    async create(
        @Body() body: { title: string; projectId: number; assignedUserId?: number; completed?: boolean },
    ) {
        return sendRpc(this.taskServiceClient, TaskMessagePatterns.CREATE_TASK, body);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() body: { title?: string; completed?: boolean; assignedUserId?: number },
    ) {
        return sendRpc(this.taskServiceClient, TaskMessagePatterns.UPDATE_TASK, { id: Number(id), ...body });
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return sendRpc(this.taskServiceClient, TaskMessagePatterns.DELETE_TASK, { id: Number(id) });
    }
}