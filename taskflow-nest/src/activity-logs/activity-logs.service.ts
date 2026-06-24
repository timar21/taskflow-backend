import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityLog } from './schemas/activity-log.schema';

@Injectable()
export class ActivityLogsService {
    constructor(
        @InjectModel(ActivityLog.name)
        private readonly activityLogModel: Model<ActivityLog>,
    ) { }

    async create(data: { action: string; details?: string; userId?: number }) {
        const log = new this.activityLogModel(data);
        return log.save();
    }

    async findAll() {
        return this.activityLogModel.find().sort({ createdAt: -1 }).exec();
    }
}