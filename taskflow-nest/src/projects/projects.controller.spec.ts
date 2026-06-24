import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsController', () => {
  let controller: ProjectsController;

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

  it('should return all projects', async () => {
    const projects = await controller.findAll();
    expect(projects).toHaveLength(1);
  });

  it('should return one project by id', async () => {
    const project = await controller.findOne('1');
    expect(project).toBeDefined();
    expect(project.name).toBe('Taskflow API');
  });

  it('should throw NotFoundException for missing project', async () => {
    mockProjectsService.findOne.mockRejectedValueOnce(new NotFoundException());
    await expect(controller.findOne('99')).rejects.toThrow(NotFoundException);
  });
});