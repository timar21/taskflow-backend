import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
    let service: NotificationsService;

    const mockQueue = {
        add: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                { provide: getQueueToken('notifications'), useValue: mockQueue },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should add a send-task-assigned-email job with the given data', async () => {
        const data = {
            userId: 1,
            userEmail: 'user@test.com',
            userName: 'Timar',
            taskId: 5,
            taskTitle: 'Setup database',
        };

        await service.queueTaskAssignedEmail(data);

        expect(mockQueue.add).toHaveBeenCalledWith(
            'send-task-assigned-email',
            data,
            expect.objectContaining({
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
            }),
        );
    });
});