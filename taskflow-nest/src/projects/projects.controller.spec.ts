import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  const adminUser = { id: 99, role: 'admin' };
  const regularUser = { id: 1, role: 'user' };

  const mockProject = {
    id: 1,
    name: 'Taskflow API',
    description: 'Backend for task management',
  };

  const mockProjectsService = {
    findAll: jest.fn().mockResolvedValue([mockProject]),
    findOne: jest.fn().mockResolvedValue(mockProject),
    create: jest.fn().mockResolvedValue(mockProject),
    update: jest.fn().mockResolvedValue(mockProject),
    remove: jest.fn().mockResolvedValue({ message: 'Project deleted successfully' }),
    findAllWithTasksQueryBuilder: jest.fn().mockResolvedValue([mockProject]),
    createWithFirstTask: jest.fn().mockResolvedValue(mockProject),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all projects for the current user', async () => {
    const projects = await controller.findAll(regularUser);
    expect(projects).toHaveLength(1);
    expect(mockProjectsService.findAll).toHaveBeenCalledWith(regularUser);
  });

  it('should return one project by id', async () => {
    const project = await controller.findOne(1, regularUser);
    expect(project).toBeDefined();
    expect(project.name).toBe('Taskflow API');
  });

  it('should throw NotFoundException for missing project', async () => {
    mockProjectsService.findOne.mockRejectedValueOnce(new NotFoundException());
    await expect(controller.findOne(99, regularUser)).rejects.toThrow(NotFoundException);
  });

  it('should create a project as the admin', async () => {
    const body = { name: 'New Project' };
    await controller.create(body, adminUser);
    expect(mockProjectsService.create).toHaveBeenCalledWith(body, adminUser);
  });

  it('should update a project on behalf of the current user', async () => {
    const body = { name: 'Updated' };
    await controller.update(1, body, regularUser);
    expect(mockProjectsService.update).toHaveBeenCalledWith(1, body, regularUser);
  });
});
