import { Test, TestingModule } from '@nestjs/testing';
import { TasksMessageController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksMessageController', () => {
    let controller: TasksMessageController;

    const mockTask = { id: 1, title: 'Setup database', completed: false };

    const mockTasksService = {
        findAll: jest.fn().mockResolvedValue([mockTask]),
        findOne: jest.fn().mockResolvedValue(mockTask),
        create: jest.fn().mockResolvedValue(mockTask),
        update: jest.fn().mockResolvedValue(mockTask),
        remove: jest.fn().mockResolvedValue({ message: 'Task with id 1 deleted successfully' }),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const app: TestingModule = await Test.createTestingModule({
            controllers: [TasksMessageController],
            providers: [{ provide: TasksService, useValue: mockTasksService }],
        }).compile();
        controller = app.get<TasksMessageController>(TasksMessageController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('findAll should return all tasks', async () => {
        const result = await controller.findAll();
        expect(result).toEqual([mockTask]);
    });

    it('findOne should hand off the id', async () => {
        await controller.findOne({ id: 1 });
        expect(mockTasksService.findOne).toHaveBeenCalledWith(1);
    });

    it('create should hand off the full DTO', async () => {
        const dto = { title: 'New Task', projectId: 1 };
        await controller.create(dto);
        expect(mockTasksService.create).toHaveBeenCalledWith(dto);
    });

    it('update should split id from the rest of the payload', async () => {
        await controller.update({ id: 1, title: 'Renamed' });
        expect(mockTasksService.update).toHaveBeenCalledWith(1, { title: 'Renamed' });
    });

    it('remove should hand off the id', async () => {
        await controller.remove({ id: 1 });
        expect(mockTasksService.remove).toHaveBeenCalledWith(1);
    });
});