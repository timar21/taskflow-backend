import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

export interface TaskAssignedJobData {
    userId: number;
    userEmail: string;
    userName: string;
    taskId: number;
    taskTitle: string;
}

@Injectable()
export class NotificationsService {
    constructor(
        @InjectQueue('notifications')
        private readonly notificationsQueue: Queue<TaskAssignedJobData>,
    ) { }

    // Queues a background job instead of sending the email inline, so a slow
    // or failing email provider never blocks or fails the task create/update request.
    async queueTaskAssignedEmail(data: TaskAssignedJobData): Promise<void> {
        await this.notificationsQueue.add('send-task-assigned-email', data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });
    }
}