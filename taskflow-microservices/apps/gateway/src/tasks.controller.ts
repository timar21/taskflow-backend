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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { TaskMessagePatterns, CreateTaskDto } from '@app/shared';
import { sendRpc } from './send-rpc';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { enrichTaskWithAssignedUser, enrichTasksWithAssignedUsers } from './aggregation/enrich-tasks';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class GatewayTasksController {
    constructor(
        @Inject('TASK_SERVICE') private readonly taskServiceClient: ClientProxy,
        @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
    ) { }

    @ApiOperation({ summary: "List all tasks (each enriched with the assigned user's details)" })
    @Get()
    async findAll() {
        const tasks = await sendRpc<any[]>(this.taskServiceClient, TaskMessagePatterns.FIND_ALL_TASKS, {});
        return enrichTasksWithAssignedUsers(tasks, this.userServiceClient);
    }

    // Must come before @Get(':id') — otherwise "mine" would be captured as an :id value
    @ApiOperation({ summary: 'List tasks assigned to the currently authenticated user' })
    @Get('mine')
    async findMine(@CurrentUser() currentUser: { id: number }) {
        const tasks = await sendRpc<any[]>(this.taskServiceClient, TaskMessagePatterns.GET_TASKS, {
            userId: currentUser.id,
        });
        return enrichTasksWithAssignedUsers(tasks, this.userServiceClient);
    }

    @ApiOperation({ summary: "Get a single task, enriched with the assigned user's details" })
    @ApiParam({ name: 'id', type: Number })
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const task = await sendRpc(this.taskServiceClient, TaskMessagePatterns.FIND_TASK_BY_ID, {
            id: Number(id),
        });
        return enrichTaskWithAssignedUser(task, this.userServiceClient);
    }

    @ApiOperation({ summary: 'Create a task (queues a task_created event for notification-service)' })
    @Post()
    async create(@Body() body: CreateTaskDto) {
        return sendRpc(this.taskServiceClient, TaskMessagePatterns.CREATE_TASK, body);
    }

    @ApiOperation({ summary: 'Update a task' })
    @ApiParam({ name: 'id', type: Number })
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() body: { title?: string; completed?: boolean; assignedUserId?: number },
    ) {
        return sendRpc(this.taskServiceClient, TaskMessagePatterns.UPDATE_TASK, { id: Number(id), ...body });
    }

    @ApiOperation({ summary: 'Delete a task' })
    @ApiParam({ name: 'id', type: Number })
    @Delete(':id')
    async remove(@Param('id') id: string) {
        return sendRpc(this.taskServiceClient, TaskMessagePatterns.DELETE_TASK, { id: Number(id) });
    }
}