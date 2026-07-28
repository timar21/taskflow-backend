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
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

type RequestUser = { id: number; role: string };

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class GatewayProjectsController {
    constructor(@Inject('TASK_SERVICE') private readonly taskServiceClient: ClientProxy) { }

    @Get()
    async findAll(@CurrentUser() currentUser: RequestUser) {
        return sendRpc(this.taskServiceClient, 'find_all_projects', { currentUser });
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() currentUser: RequestUser) {
        return sendRpc(this.taskServiceClient, 'find_project_by_id', { id: Number(id), currentUser });
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('admin')
    async create(
        @Body() body: { name: string; description?: string; ownerId?: number },
        @CurrentUser() currentUser: RequestUser,
    ) {
        return sendRpc(this.taskServiceClient, 'create_project', { ...body, currentUser });
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string },
        @CurrentUser() currentUser: RequestUser,
    ) {
        return sendRpc(this.taskServiceClient, 'update_project', {
            id: Number(id),
            ...body,
            currentUser,
        });
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async remove(@Param('id') id: string, @CurrentUser() currentUser: RequestUser) {
        return sendRpc(this.taskServiceClient, 'delete_project', { id: Number(id), currentUser });
    }
}