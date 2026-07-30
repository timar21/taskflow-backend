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
import { ProjectMessagePatterns } from '@app/shared';
import type { RequestUser } from '@app/shared';
import { sendRpc } from './send-rpc';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class GatewayProjectsController {
    constructor(@Inject('TASK_SERVICE') private readonly taskServiceClient: ClientProxy) { }

    @Get()
    async findAll(@CurrentUser() currentUser: RequestUser) {
        return sendRpc(this.taskServiceClient, ProjectMessagePatterns.FIND_ALL_PROJECTS, { currentUser });
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() currentUser: RequestUser) {
        return sendRpc(this.taskServiceClient, ProjectMessagePatterns.FIND_PROJECT_BY_ID, {
            id: Number(id),
            currentUser,
        });
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('admin')
    async create(
        @Body() body: { name: string; description?: string; ownerId?: number },
        @CurrentUser() currentUser: RequestUser,
    ) {
        return sendRpc(this.taskServiceClient, ProjectMessagePatterns.CREATE_PROJECT, {
            ...body,
            currentUser,
        });
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string },
        @CurrentUser() currentUser: RequestUser,
    ) {
        return sendRpc(this.taskServiceClient, ProjectMessagePatterns.UPDATE_PROJECT, {
            id: Number(id),
            ...body,
            currentUser,
        });
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async remove(@Param('id') id: string, @CurrentUser() currentUser: RequestUser) {
        return sendRpc(this.taskServiceClient, ProjectMessagePatterns.DELETE_PROJECT, {
            id: Number(id),
            currentUser,
        });
    }
}