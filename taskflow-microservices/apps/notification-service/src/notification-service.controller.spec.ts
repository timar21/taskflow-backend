import { Test, TestingModule } from '@nestjs/testing';
import { NotificationServiceController } from './notification-service.controller';

describe('NotificationServiceController', () => {
  let controller: NotificationServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationServiceController],
    }).compile();
    controller = app.get<NotificationServiceController>(NotificationServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should not throw when handling a task_created event with an assigned user', () => {
    expect(() =>
      controller.handleTaskCreated({
        taskId: 1,
        title: 'Write onboarding doc',
        projectId: 1,
        assignedUserId: 5,
      }),
    ).not.toThrow();
  });

  it('should not throw when handling a task_created event with no assigned user', () => {
    expect(() =>
      controller.handleTaskCreated({ taskId: 2, title: 'Unassigned task', projectId: 1 }),
    ).not.toThrow();
  });
});