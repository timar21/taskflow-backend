import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';

describe('ProjectsService', () => {
    let service: ProjectsService;

    const adminUser = { id: 99, role: 'admin' };
    const ownerUser = { id: 1, role: 'user' };
    const otherUser = { id: 2, role: 'user' };

    const mockProject = { id: 1, name: 'Taskflow API', ownerId: 1 };

    const mockRepository = {
        find: jest.fn().mockResolvedValue([mockProject]),
        findOne: jest.fn().mockResolvedValue(mockProject),
        create: jest.fn().mockReturnValue(mockProject),
        save: jest.fn().mockResolvedValue(mockProject),
        remove: jest.fn().mockResolvedValue(mockProject),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockRepository.findOne.mockResolvedValue(mockProject);
        mockRepository.create.mockReturnValue(mockProject);
        mockRepository.save.mockResolvedValue(mockProject);

        const module: TestingModule = await Test.createTestingModule({
            providers: [ProjectsService, { provide: getRepositoryToken(Project), useValue: mockRepository }],
        }).compile();
        service = module.get<ProjectsService>(ProjectsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findAll should not scope by owner for an admin', async () => {
        await service.findAll(adminUser);
        expect(mockRepository.find).toHaveBeenCalledWith({ relations: { tasks: true } });
    });

    it('findAll should scope to owned projects for a regular user', async () => {
        await service.findAll(ownerUser);
        expect(mockRepository.find).toHaveBeenCalledWith({
            where: { ownerId: ownerUser.id },
            relations: { tasks: true },
        });
    });

    it('findOne should allow the owner to access their own project', async () => {
        await expect(service.findOne(1, ownerUser)).resolves.toEqual(mockProject);
    });

    it('findOne should forbid a non-owner regular user', async () => {
        await expect(service.findOne(1, otherUser)).rejects.toThrow(ForbiddenException);
    });

    it('create should default ownerId to the current user when omitted', async () => {
        await service.create({ name: 'New Project' }, adminUser);
        expect(mockRepository.create).toHaveBeenCalledWith({
            name: 'New Project',
            description: undefined,
            ownerId: adminUser.id,
        });
    });

    it('create should use an explicit ownerId when provided', async () => {
        await service.create({ name: 'New Project', ownerId: 5 }, adminUser);
        expect(mockRepository.create).toHaveBeenCalledWith({
            name: 'New Project',
            description: undefined,
            ownerId: 5,
        });
    });

    it('update should forbid a non-owner from updating', async () => {
        await expect(service.update(1, { name: 'Renamed' }, otherUser)).rejects.toThrow(
            ForbiddenException,
        );
    });

    it('remove should forbid a non-owner from deleting', async () => {
        await expect(service.remove(1, otherUser)).rejects.toThrow(ForbiddenException);
    });
});