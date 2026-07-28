import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { GatewayProjectsController } from './projects.controller';

describe('GatewayProjectsController', () => {
    let controller: GatewayProjectsController;

    const adminUser = { id: 99, role: 'admin' };
    const mockProject = { id: 1, name: 'Taskflow API', ownerId: 1 };

    const mockTaskServiceClient = {
        send: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const app: TestingModule = await Test.createTestingModule({
            controllers: [GatewayProjectsController],
            providers: [{ provide: 'TASK_SERVICE', useValue: mockTaskServiceClient }],
        }).compile();
        controller = app.get<GatewayProjectsController>(GatewayProjectsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll should send currentUser along with the message', async () => {
        mockTaskServiceClient.send.mockReturnValue(of([mockProject]));
        await controller.findAll(adminUser);
        expect(mockTaskServiceClient.send).toHaveBeenCalledWith('find_all_projects', {
            currentUser: adminUser,
        });
    });

    it('create should send the body merged with currentUser', async () => {
        mockTaskServiceClient.send.mockReturnValue(of(mockProject));
        await controller.create({ name: 'New Project' }, adminUser);
        expect(mockTaskServiceClient.send).toHaveBeenCalledWith('create_project', {
            name: 'New Project',
            currentUser: adminUser,
        });
    });

    it('remove should send id and currentUser', async () => {
        mockTaskServiceClient.send.mockReturnValue(of({ message: 'deleted' }));
        await controller.remove('1', adminUser);
        expect(mockTaskServiceClient.send).toHaveBeenCalledWith('delete_project', {
            id: 1,
            currentUser: adminUser,
        });
    });
});