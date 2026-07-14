import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      access_token: 'fake-jwt-token',
      refresh_token: 'fake-refresh-token',
      user: { id: 1, name: 'Timar', email: 'timar@example.com', role: 'user' },
    }),
    refreshTokens: jest.fn().mockResolvedValue({
      access_token: 'new-jwt-token',
      refresh_token: 'new-refresh-token',
      user: { id: 1, name: 'Timar', email: 'timar@example.com', role: 'user' },
    }),
    logout: jest.fn().mockResolvedValue({ message: 'Logged out successfully' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return tokens on login (user set by LocalStrategy via req.user)', async () => {
    const req = {
      user: { id: 1, name: 'Timar', email: 'timar@example.com', role: 'user' },
    };
    const result = await controller.login(req);
    expect(result.access_token).toBe('fake-jwt-token');
    expect(mockAuthService.login).toHaveBeenCalledWith(req.user);
  });

  it('should return new tokens on refresh', async () => {
    const result = await controller.refresh({ refreshToken: 'old-refresh-token' });
    expect(result.access_token).toBe('new-jwt-token');
    expect(mockAuthService.refreshTokens).toHaveBeenCalledWith('old-refresh-token');
  });

  it('should log the user out', async () => {
    const result = await controller.logout({ id: 1 });
    expect(result.message).toBe('Logged out successfully');
    expect(mockAuthService.logout).toHaveBeenCalledWith(1);
  });
});
