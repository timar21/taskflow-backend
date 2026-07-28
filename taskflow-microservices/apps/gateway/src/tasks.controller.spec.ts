import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { GatewayTasksController } from './tasks.controller';

describe('GatewayTasksController', () => {
    let controller: GatewayTasksController;

    const mockTask = { id: 1, title: 'Setup database' };

    const mockTaskServiceClient = {
        send: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const app: TestingModule = await Test.createTestingModule({
            controllers: [GatewayTasksController],
            providers: [{ provide: 'TASK_SERVICE', useValue: mockTaskServiceClient }],
        }).compile();
        controller = app.get<GatewayTasksController>(GatewayTasksController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('create should send the request body as-is', async () => {
        mockTaskServiceClient.send.mockReturnValue(of(mockTask));
        const body = { title: 'New Task', projectId: 1 };
        await controller.create(body);
        expect(mockTaskServiceClient.send).toHaveBeenCalledWith('create_task', body);
    });

    it('update should merge id with the request body', async () => {
        mockTaskServiceClient.send.mockReturnValue(of(mockTask));
        await controller.update('1', { title: 'Renamed' });
        expect(mockTaskServiceClient.send).toHaveBeenCalledWith('update_task', {
            id: 1,
            title: 'Renamed',
        });
    });
});