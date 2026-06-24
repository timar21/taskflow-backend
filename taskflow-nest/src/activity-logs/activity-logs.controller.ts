import { Controller, Get, Post, Body } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';

@Controller('activity-logs')
export class ActivityLogsController {
    constructor(private readonly activityLogsService: ActivityLogsService) { }

    @Post()
    async create(@Body() body: { action: string; details?: string; userId?: number }) {
        return this.activityLogsService.create(body);
    }

    @Get()
    async findAll() {
        return this.activityLogsService.findAll();
    }
}