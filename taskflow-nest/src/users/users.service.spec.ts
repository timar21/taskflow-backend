import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import * as crypto from 'crypto';
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockUser = { id: 1, name: 'Timar', email: 'timar@example.com', role: 'user' };

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
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

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

  it('should hash the password before creating a user', async () => {
    await service.create({
      name: 'Timar',
      email: 'timar@example.com',
      password: 'plaintext123',
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('plaintext123', 10);
    expect(mockRepository.create).toHaveBeenCalledWith({
      name: 'Timar',
      email: 'timar@example.com',
      password: 'hashed-password',
    });
  });

  it('should hash and store the refresh token', async () => {
    await service.setHashedRefreshToken(1, 'some-refresh-token');
    const expectedDigest = crypto.createHash('sha256').update('some-refresh-token').digest('hex');
    expect(bcrypt.hash).toHaveBeenCalledWith(expectedDigest, 10);
    expect(mockRepository.update).toHaveBeenCalledWith(1, { hashedRefreshToken: 'hashed-password' });
  });

  it('should clear the refresh token when passed null', async () => {
    await service.setHashedRefreshToken(1, null);
    expect(mockRepository.update).toHaveBeenCalledWith(1, { hashedRefreshToken: null });
  });
});
