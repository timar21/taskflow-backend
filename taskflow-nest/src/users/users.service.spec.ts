import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = { id: 1, name: 'Timar', email: 'timar@example.com' };

  const mockRepository = {
    find: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockReturnValue(mockUser),
    save: jest.fn().mockResolvedValue(mockUser),
    remove: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all users', async () => {
    const users = await service.findAll();
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Timar');
  });

  it('should return one user by id', async () => {
    const user = await service.findOne(1);
    expect(user).toBeDefined();
    expect(user.name).toBe('Timar');
  });

  it('should throw NotFoundException for non-existent id', async () => {
    mockRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne(99)).rejects.toThrow();
  });
});