import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUserWithPassword = {
    id: 1,
    name: 'Timar',
    email: 'timar@example.com',
    role: 'user',
    password: 'hashed-password',
  };

  const mockUsersService = {
    findByEmailWithPassword: jest.fn().mockResolvedValue(mockUserWithPassword),
    findOneWithRefreshToken: jest.fn().mockResolvedValue({
      ...mockUserWithPassword,
      hashedRefreshToken: 'hashed-refresh-token',
    }),
    setHashedRefreshToken: jest.fn().mockResolvedValue(undefined),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: 1 }),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_SECRET: 'testsecret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'testrefreshsecret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate a user with correct credentials', async () => {
    const result = await service.validateUser('timar@example.com', '123456');
    expect(result).toEqual({
      id: 1,
      name: 'Timar',
      email: 'timar@example.com',
      role: 'user',
    });
  });

  it('should return null when password does not match', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    const result = await service.validateUser('timar@example.com', 'wrongpassword');
    expect(result).toBeNull();
  });

  it('should return null when user is not found', async () => {
    mockUsersService.findByEmailWithPassword.mockResolvedValueOnce(null);
    const result = await service.validateUser('nobody@example.com', '123456');
    expect(result).toBeNull();
  });

  it('should issue access and refresh tokens on login', async () => {
    const result = await service.login({
      id: 1,
      name: 'Timar',
      email: 'timar@example.com',
      role: 'user',
    });
    expect(result.access_token).toBe('fake-jwt-token');
    expect(result.refresh_token).toBe('fake-jwt-token');
    expect(mockUsersService.setHashedRefreshToken).toHaveBeenCalledWith(1, 'fake-jwt-token');
  });

  it('should rotate tokens on a valid refresh request', async () => {
    const result = await service.refreshTokens('some-refresh-token');
    expect(result.access_token).toBe('fake-jwt-token');
    expect(result.refresh_token).toBe('fake-jwt-token');
  });

  it('should reject refresh when the stored hash does not match', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
    await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should reject refresh when no refresh token is stored', async () => {
    mockUsersService.findOneWithRefreshToken.mockResolvedValueOnce({
      ...mockUserWithPassword,
      hashedRefreshToken: null,
    });
    await expect(service.refreshTokens('some-token')).rejects.toThrow(UnauthorizedException);
  });

  it('should clear the refresh token on logout', async () => {
    const result = await service.logout(1);
    expect(mockUsersService.setHashedRefreshToken).toHaveBeenCalledWith(1, null);
    expect(result.message).toBe('Logged out successfully');
  });
});
