import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationEventPatterns } from '@app/shared';

interface TaskCreatedEvent {
  taskId: number;
  title: string;
  projectId: number;
  assignedUserId?: number;
}

// This is a separate, standalone microservice — it never talks to a
// database or another service. It only listens for events on its own
// queue and reacts. @EventPattern (not @MessagePattern) means it's a
// pure fire-and-forget consumer: no reply is ever sent back to task-service.
@Controller()
export class NotificationServiceController {
  private readonly logger = new Logger(NotificationServiceController.name);

  @EventPattern(NotificationEventPatterns.TASK_CREATED)
  handleTaskCreated(@Payload() data: TaskCreatedEvent) {
    if (data.assignedUserId) {
      this.logger.log(
        `Notification: task #${data.taskId} "${data.title}" was created and assigned to user ${data.assignedUserId}`,
      );
    } else {
      this.logger.log(
        `Notification: task #${data.taskId} "${data.title}" was created (unassigned)`,
      );
    }
  }
}