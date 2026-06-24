import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = { id: 1, name: 'Timar', email: 'timar@example.com' };

  const mockUsersService = {
    findByEmail: jest.fn().mockResolvedValue(mockUser),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should login successfully with correct credentials', async () => {
    const result = await service.login('timar@example.com', '123456');
    expect(result.access_token).toBe('fake-jwt-token');
  });

  it('should throw UnauthorizedException for wrong password', async () => {
    await expect(
      service.login('timar@example.com', 'wrongpassword'),
    ).rejects.toThrow();
  });
});