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
import { ProjectMessagePatterns, CreateProjectDto } from '@app/shared';
import type { RequestUser } from '@app/shared';
import { sendRpc } from './send-rpc';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class GatewayProjectsController {
    constructor(@Inject('TASK_SERVICE') private readonly taskServiceClient: ClientProxy) { }

    @ApiOperation({ summary: "List projects — admins see all, regular users see only their own" })
    @Get()
    async findAll(@CurrentUser() currentUser: RequestUser) {
        return sendRpc(this.taskServiceClient, ProjectMessagePatterns.FIND_ALL_PROJECTS, { currentUser });
    }

    @ApiOperation({ summary: 'Get a single project — must be the owner or an admin' })
    @ApiParam({ name: 'id', type: Number })
    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() currentUser: RequestUser) {
        return sendRpc(this.taskServiceClient, ProjectMessagePatterns.FIND_PROJECT_BY_ID, {
            id: Number(id),
            currentUser,
        });
    }

    @ApiOperation({ summary: 'Create a project — admin only' })
    @Post()
    @UseGuards(RolesGuard)
    @Roles('admin')
    async create(@Body() body: CreateProjectDto, @CurrentUser() currentUser: RequestUser) {
        return sendRpc(this.taskServiceClient, ProjectMessagePatterns.CREATE_PROJECT, {
            ...body,
            currentUser,
        });
    }

    @ApiOperation({ summary: 'Update a project — must be the owner or an admin' })
    @ApiParam({ name: 'id', type: Number })
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

    @ApiOperation({ summary: 'Delete a project — admin only' })
    @ApiParam({ name: 'id', type: Number })
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