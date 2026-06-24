import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';

describe('TasksService', () => {
  let service: TasksService;

  const mockTask = { id: 1, title: 'Setup database', completed: false };
  const mockProject = { id: 1, name: 'Taskflow API' };
  const mockUser = { id: 1, name: 'Timar' };

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

  const mockUserRepository = {
    findOne: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
        { provide: getRepositoryToken(Project), useValue: mockProjectRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all tasks', async () => {
    const tasks = await service.findAll();
    expect(tasks).toHaveLength(1);
  });

  it('should return one task by id', async () => {
    const task = await service.findOne(1);
    expect(task).toBeDefined();
  });
});