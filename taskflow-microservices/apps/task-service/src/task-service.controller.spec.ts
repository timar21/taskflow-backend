import { Test, TestingModule } from '@nestjs/testing';
import { TaskServiceController } from './task-service.controller';
import { ProjectsService } from './projects.service';

describe('TaskServiceController', () => {
  let controller: TaskServiceController;

  const mockProject = { id: 1, name: 'Taskflow API', ownerId: 1 };
  const adminUser = { id: 99, role: 'admin' };

  const mockProjectsService = {
    findAll: jest.fn().mockResolvedValue([mockProject]),
    findOne: jest.fn().mockResolvedValue(mockProject),
    create: jest.fn().mockResolvedValue(mockProject),
    update: jest.fn().mockResolvedValue(mockProject),
    remove: jest.fn().mockResolvedValue({ message: 'Project with id 1 deleted successfully' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TaskServiceController],
      providers: [{ provide: ProjectsService, useValue: mockProjectsService }],
    }).compile();
    controller = app.get<TaskServiceController>(TaskServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should pass currentUser through to the service', async () => {
    await controller.findAll({ currentUser: adminUser });
    expect(mockProjectsService.findAll).toHaveBeenCalledWith(adminUser);
  });

  it('findOne should pass id and currentUser through', async () => {
    await controller.findOne({ id: 1, currentUser: adminUser });
    expect(mockProjectsService.findOne).toHaveBeenCalledWith(1, adminUser);
  });

  it('create should strip currentUser out of the data before calling the service', async () => {
    await controller.create({ name: 'New Project', currentUser: adminUser });
    expect(mockProjectsService.create).toHaveBeenCalledWith({ name: 'New Project' }, adminUser);
  });

  it('update should split id and currentUser from the rest of the payload', async () => {
    await controller.update({ id: 1, name: 'Renamed', currentUser: adminUser });
    expect(mockProjectsService.update).toHaveBeenCalledWith(1, { name: 'Renamed' }, adminUser);
  });

  it('remove should pass id and currentUser through', async () => {
    await controller.remove({ id: 1, currentUser: adminUser });
    expect(mockProjectsService.remove).toHaveBeenCalledWith(1, adminUser);
  });
});