import { Logger } from '@nestjs/common';
import {
    Process,
    Processor,
    OnQueueCompleted,
    OnQueueFailed,
} from '@nestjs/bull';
import type { Job } from 'bull';
import type { TaskAssignedJobData } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor {
    private readonly logger = new Logger(NotificationsProcessor.name);

    // Stands in for a real email provider (SendGrid, SES, etc.) — logs to
    // console for now, same shape a real send call would have.
    @Process('send-task-assigned-email')
    async handleTaskAssignedEmail(job: Job<TaskAssignedJobData>): Promise<{ sentAt: string }> {
        const { userEmail, userName, taskId, taskTitle } = job.data;

        this.logger.log(
            `Sending email to ${userEmail}: Hi ${userName}, you've been assigned task #${taskId} "${taskTitle}"`,
        );

        return { sentAt: new Date().toISOString() };
    }

    @OnQueueCompleted()
    onCompleted(job: Job<TaskAssignedJobData>, result: { sentAt: string }) {
        this.logger.log(
            `Job ${job.id} (${job.name}) completed — email to ${job.data.userEmail} sent at ${result.sentAt}`,
        );
    }

    @OnQueueFailed()
    onFailed(job: Job<TaskAssignedJobData>, error: Error) {
        this.logger.error(
            `Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempt(s): ${error.message}`,
        );
    }
}