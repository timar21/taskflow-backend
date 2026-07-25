import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;

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
    findOne: jest.fn().mockResolvedValue(mockProject),
    create: jest.fn().mockReturnValue(mockProject),
    save: jest.fn().mockResolvedValue(mockProject),
    remove: jest.fn().mockResolvedValue(mockProject),
    createQueryBuilder: jest.fn(),
  };

  // A fresh chainable query builder mock for each findAll() call, so
  // tests can assert exactly which clauses got applied.
  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockProject], 1]),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.findOne.mockResolvedValue(mockProject);
    mockRepository.create.mockReturnValue(mockProject);
    mockRepository.save.mockResolvedValue(mockProject);
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProject], 1]);
    mockCacheManager.get.mockResolvedValue(undefined);

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
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should query with joins for owner and tasks to avoid N+1', async () => {
      await service.findAll(adminUser);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('project');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('project.owner', 'owner');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('project.tasks', 'task');
    });

    it('should not scope by owner for an admin', async () => {
      await service.findAll(adminUser);
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'owner.id = :ownerId',
        expect.anything(),
      );
    });

    it('should scope results to owned projects for a regular user', async () => {
      await service.findAll(ownerUser);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('owner.id = :ownerId', {
        ownerId: ownerUser.id,
      });
    });

    it('should filter by status when provided', async () => {
      await service.findAll(adminUser, { status: 'active' as any });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('project.status = :status', {
        status: 'active',
      });
    });

    it('should filter by name when provided', async () => {
      await service.findAll(adminUser, { name: 'flow' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('project.name ILIKE :name', {
        name: '%flow%',
      });
    });

    it('should default to sorting by name ascending', async () => {
      await service.findAll(adminUser);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('project.name', 'ASC');
    });

    it('should sort by date descending when requested', async () => {
      await service.findAll(adminUser, { sortBy: 'date', order: 'DESC' });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('project.createdAt', 'DESC');
    });

    it('should default pagination to skip 0 / take 20', async () => {
      await service.findAll(adminUser);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should apply custom pagination values', async () => {
      await service.findAll(adminUser, { skip: 40, take: 10 });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(40);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should return a paginated result with total count', async () => {
      const result = await service.findAll(adminUser);
      expect(result).toEqual({ data: [mockProject], total: 1, skip: 0, take: 20 });
    });

    it('should return a cached result without hitting the database', async () => {
      const cached = { data: [mockProject], total: 1, skip: 0, take: 20 };
      mockCacheManager.get.mockResolvedValueOnce(cached);

      const result = await service.findAll(adminUser);

      expect(result).toEqual(cached);
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should cache the result after a fresh query', async () => {
      await service.findAll(adminUser);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        { data: [mockProject], total: 1, skip: 0, take: 20 },
        60000,
      );
    });

    it('should use different cache keys for different users', async () => {
      await service.findAll(ownerUser);
      await service.findAll(otherUser);

      const [ownerKey] = mockCacheManager.set.mock.calls[0];
      const [otherKey] = mockCacheManager.set.mock.calls[1];
      expect(ownerKey).not.toEqual(otherKey);
    });
  });

  describe('findOne', () => {
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
  });

  describe('create', () => {
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

    it('should invalidate the projects cache after creating', async () => {
      await service.create({ name: 'New Project' }, adminUser);
      expect(mockCacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('update', () => {
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

    it('should invalidate the projects cache after updating', async () => {
      await service.update(1, { name: 'Updated' }, ownerUser);
      expect(mockCacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should invalidate the projects cache after removing', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ ...mockProject, tasks: [] });
      await service.remove(1);
      expect(mockCacheManager.clear).toHaveBeenCalled();
    });
  });
});