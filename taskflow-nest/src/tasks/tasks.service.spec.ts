import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('TasksService', () => {
  let service: TasksService;

  const mockTask = { id: 1, title: 'Setup database', completed: false };
  const mockProject = { id: 1, name: 'Taskflow API' };
  const mockUser = { id: 1, name: 'Timar', email: 'timar@test.com' };
  const otherUser = { id: 2, name: 'Selome', email: 'selome@test.com' };

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

  const mockNotificationsService = {
    queueTaskAssignedEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockTaskRepository.findOne.mockResolvedValue(mockTask);
    mockTaskRepository.save.mockResolvedValue(mockTask);
    mockUserRepository.findOne.mockResolvedValue(mockUser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
        { provide: getRepositoryToken(Project), useValue: mockProjectRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: NotificationsService, useValue: mockNotificationsService },
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

  describe('create', () => {
    it('should not queue a notification when no user is assigned', async () => {
      await service.create({ title: 'New task', projectId: 1 });
      expect(mockNotificationsService.queueTaskAssignedEmail).not.toHaveBeenCalled();
    });

    it('should queue a notification when a task is created with an assigned user', async () => {
      await service.create({ title: 'New task', projectId: 1, assignedUserId: 1 });
      expect(mockNotificationsService.queueTaskAssignedEmail).toHaveBeenCalledWith({
        userId: mockUser.id,
        userEmail: mockUser.email,
        userName: mockUser.name,
        taskId: mockTask.id,
        taskTitle: mockTask.title,
      });
    });
  });

  describe('update', () => {
    it('should not queue a notification when assignedUserId is not part of the update', async () => {
      await service.update(1, { title: 'Renamed' });
      expect(mockNotificationsService.queueTaskAssignedEmail).not.toHaveBeenCalled();
    });

    it('should queue a notification when a task is newly assigned to a user', async () => {
      mockTaskRepository.findOne.mockResolvedValueOnce({ ...mockTask, assignedUser: undefined });
      await service.update(1, { assignedUserId: 1 });
      expect(mockNotificationsService.queueTaskAssignedEmail).toHaveBeenCalledWith({
        userId: mockUser.id,
        userEmail: mockUser.email,
        userName: mockUser.name,
        taskId: mockTask.id,
        taskTitle: mockTask.title,
      });
    });

    it('should not re-queue a notification when the assignee is unchanged', async () => {
      mockTaskRepository.findOne.mockResolvedValueOnce({ ...mockTask, assignedUser: mockUser });
      await service.update(1, { assignedUserId: 1, title: 'Renamed' });
      expect(mockNotificationsService.queueTaskAssignedEmail).not.toHaveBeenCalled();
    });

    it('should queue a new notification when reassigned to a different user', async () => {
      mockTaskRepository.findOne.mockResolvedValueOnce({ ...mockTask, assignedUser: mockUser });
      mockUserRepository.findOne.mockResolvedValueOnce(otherUser);

      await service.update(1, { assignedUserId: 2 });

      expect(mockNotificationsService.queueTaskAssignedEmail).toHaveBeenCalledWith({
        userId: otherUser.id,
        userEmail: otherUser.email,
        userName: otherUser.name,
        taskId: mockTask.id,
        taskTitle: mockTask.title,
      });
    });
  });
});