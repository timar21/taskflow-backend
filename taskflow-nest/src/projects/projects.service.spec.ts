import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repo: Repository<Project>;

  const mockProject = {
    id: 1,
    name: 'Taskflow API',
    description: 'Backend for task management',
  };

  const mockRepository = {
    find: jest.fn().mockResolvedValue([mockProject]),
    findOne: jest.fn().mockResolvedValue(mockProject),
    create: jest.fn().mockReturnValue(mockProject),
    save: jest.fn().mockResolvedValue(mockProject),
    remove: jest.fn().mockResolvedValue(mockProject),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    repo = module.get<Repository<Project>>(getRepositoryToken(Project));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all projects', async () => {
    const projects = await service.findAll();
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('Taskflow API');
  });

  it('should return one project by id', async () => {
    const project = await service.findOne(1);
    expect(project).toBeDefined();
    expect(project.name).toBe('Taskflow API');
  });

  it('should throw NotFoundException for non-existent id', async () => {
    mockRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne(99)).rejects.toThrow();
  });
});