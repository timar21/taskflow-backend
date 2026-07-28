import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { Project } from './entities/project.entity';

describe('TasksService', () => {
    let service: TasksService;

    const mockTask = { id: 1, title: 'Setup database', completed: false };
    const mockProject = { id: 1, name: 'Taskflow API' };

    const mockTaskRepository = {
        find: jest.fn().mockResolvedValue([mockTask]),
        findOne: jest.fn().mockResolvedValue(mockTask),
        create: jest.fn().mockReturnValue(mockTask),
        save: jest.fn().mockResolvedValue(mockTask),
        remove: jest.fn().mockResolvedValue(mockTask),
    };

    const mockProjectRepository = {
        findOne: jest.fn().mockResolvedValue(mockProject),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockTaskRepository.findOne.mockResolvedValue(mockTask);
        mockTaskRepository.save.mockResolvedValue(mockTask);
        mockProjectRepository.findOne.mockResolvedValue(mockProject);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
                { provide: getRepositoryToken(Project), useValue: mockProjectRepository },
            ],
        }).compile();
        service = module.get<TasksService>(TasksService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findOne should throw NotFoundException for a missing task', async () => {
        mockTaskRepository.findOne.mockResolvedValueOnce(null);
        await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('create should throw NotFoundException for a missing project', async () => {
        mockProjectRepository.findOne.mockResolvedValueOnce(null);
        await expect(service.create({ title: 'New Task', projectId: 999 })).rejects.toThrow(
            NotFoundException,
        );
    });

    it('create should attach the found project to the new task', async () => {
        await service.create({ title: 'New Task', projectId: 1 });
        expect(mockTaskRepository.create).toHaveBeenCalledWith({
            title: 'New Task',
            completed: false,
            project: mockProject,
            assignedUserId: undefined,
        });
    });
});