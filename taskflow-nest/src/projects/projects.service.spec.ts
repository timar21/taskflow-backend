import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repo: Repository<Project>;

  const adminUser = { id: 99, role: 'admin' };
  const ownerUser = { id: 1, role: 'user' };
  const otherUser = { id: 2, role: 'user' };

  const mockProject = {
    id: 1,
    name: 'Taskflow API',
    description: 'Backend for task management',
    owner: { id: 1 },
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
    jest.clearAllMocks();
    mockRepository.find.mockResolvedValue([mockProject]);
    mockRepository.findOne.mockResolvedValue(mockProject);
    mockRepository.create.mockReturnValue(mockProject);
    mockRepository.save.mockResolvedValue(mockProject);

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

  it('should return all projects for an admin', async () => {
    const projects = await service.findAll(adminUser);
    expect(projects).toHaveLength(1);
    expect(mockRepository.find).toHaveBeenCalledWith({ relations: ['owner', 'tasks'] });
  });

  it('should scope results to owned projects for a regular user', async () => {
    await service.findAll(ownerUser);
    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { owner: { id: ownerUser.id } },
      relations: ['owner', 'tasks'],
    });
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

  it('should allow the owner to access their own project', async () => {
    await expect(service.findOne(1, ownerUser)).resolves.toEqual(mockProject);
  });

  it('should forbid a non-owner regular user from accessing the project', async () => {
    await expect(service.findOne(1, otherUser)).rejects.toThrow(ForbiddenException);
  });

  it('should let an admin create a project owned by themself when ownerId is omitted', async () => {
    await service.create({ name: 'New Project' }, adminUser);
    expect(mockRepository.create).toHaveBeenCalledWith({
      name: 'New Project',
      owner: { id: adminUser.id },
    });
  });

  it('should let an admin assign a project to a specific owner', async () => {
    await service.create({ name: 'New Project', ownerId: 5 }, adminUser);
    expect(mockRepository.create).toHaveBeenCalledWith({
      name: 'New Project',
      owner: { id: 5 },
    });
  });

  it('should let the owner update their own project', async () => {
    await expect(
      service.update(1, { name: 'Updated' }, ownerUser),
    ).resolves.toBeDefined();
  });

  it('should forbid a non-owner from updating the project', async () => {
    await expect(
      service.update(1, { name: 'Updated' }, otherUser),
    ).rejects.toThrow(ForbiddenException);
  });
});
