import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
    let service: UsersService;

    const mockUser = {
        id: 1,
        name: 'Selome',
        email: 'user@test.com',
        role: 'user',
        password: 'hashed-password',
        hashedRefreshToken: null,
    };

    const mockRepository = {
        find: jest.fn().mockResolvedValue([mockUser]),
        findOne: jest.fn().mockResolvedValue(mockUser),
        create: jest.fn().mockReturnValue(mockUser),
        save: jest.fn().mockResolvedValue(mockUser),
        remove: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(undefined),
        createQueryBuilder: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockRepository.findOne.mockResolvedValue(mockUser);
        mockRepository.create.mockReturnValue(mockUser);
        mockRepository.save.mockResolvedValue(mockUser);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: mockRepository },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findOne should throw NotFoundException for a missing user', async () => {
        mockRepository.findOne.mockResolvedValueOnce(null);
        await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });

    it('create should never return the password or hashedRefreshToken fields', async () => {
        const result = await service.create({
            name: 'Selome',
            email: 'user@test.com',
            password: 'password123',
        });

        expect(result).not.toHaveProperty('password');
        expect(result).not.toHaveProperty('hashedRefreshToken');
        expect(result).toEqual({ id: 1, name: 'Selome', email: 'user@test.com', role: 'user' });
    });
});