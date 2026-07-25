import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsProcessor } from './notifications.processor';

describe('NotificationsProcessor', () => {
    let processor: NotificationsProcessor;

    const mockJob = {
        id: '1',
        name: 'send-task-assigned-email',
        attemptsMade: 1,
        data: {
            userId: 1,
            userEmail: 'user@test.com',
            userName: 'Timar',
            taskId: 5,
            taskTitle: 'Setup database',
        },
    } as any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [NotificationsProcessor],
        }).compile();

        processor = module.get<NotificationsProcessor>(NotificationsProcessor);
    });

    it('should be defined', () => {
        expect(processor).toBeDefined();
    });

    it('should process the job and return a sentAt timestamp', async () => {
        const result = await processor.handleTaskAssignedEmail(mockJob);
        expect(result.sentAt).toBeDefined();
        expect(new Date(result.sentAt).toString()).not.toBe('Invalid Date');
    });

    it('should not throw when handling a completed job event', () => {
        expect(() => processor.onCompleted(mockJob, { sentAt: new Date().toISOString() })).not.toThrow();
    });

    it('should not throw when handling a failed job event', () => {
        expect(() => processor.onFailed(mockJob, new Error('SMTP timeout'))).not.toThrow();
    });
});