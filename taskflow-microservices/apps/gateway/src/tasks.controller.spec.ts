import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { GatewayTasksController } from './tasks.controller';

describe('GatewayTasksController', () => {
    let controller: GatewayTasksController;

    const mockTask = { id: 1, title: 'Setup database', assignedUserId: 5 };
    const mockUser = { id: 5, name: 'Selome', email: 'user@test.com', role: 'user' };

    const mockTaskServiceClient = {
        send: jest.fn(),
    };
    const mockUserServiceClient = {
        send: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const app: TestingModule = await Test.createTestingModule({
            controllers: [GatewayTasksController],
            providers: [
                { provide: 'TASK_SERVICE', useValue: mockTaskServiceClient },
                { provide: 'USER_SERVICE', useValue: mockUserServiceClient },
            ],
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

    it('findOne should aggregate the task with the assigned user from user-service', async () => {
        mockTaskServiceClient.send.mockReturnValue(of(mockTask));
        mockUserServiceClient.send.mockReturnValue(of(mockUser));

        const result = await controller.findOne('1');

        expect(mockTaskServiceClient.send).toHaveBeenCalledWith('find_task_by_id', { id: 1 });
        expect(mockUserServiceClient.send).toHaveBeenCalledWith('find_user_by_id', { id: 5 });
        expect(result).toEqual({ id: 1, title: 'Setup database', assignedUser: mockUser });
        expect(result).not.toHaveProperty('assignedUserId');
    });

    it('findOne should return the task as-is when it has no assigned user', async () => {
        const unassignedTask = { id: 2, title: 'Unassigned' };
        mockTaskServiceClient.send.mockReturnValue(of(unassignedTask));

        const result = await controller.findOne('2');

        expect(mockUserServiceClient.send).not.toHaveBeenCalled();
        expect(result).toEqual(unassignedTask);
    });

    it('findMine should aggregate every task in the list', async () => {
        mockTaskServiceClient.send.mockReturnValue(of([mockTask]));
        mockUserServiceClient.send.mockReturnValue(of(mockUser));

        const result = await controller.findMine({ id: 5 });

        expect(mockTaskServiceClient.send).toHaveBeenCalledWith('get_tasks', { userId: 5 });
        expect(result).toEqual([{ id: 1, title: 'Setup database', assignedUser: mockUser }]);
    });
});