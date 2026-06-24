import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      access_token: 'fake-jwt-token',
      user: { id: 1, name: 'Timar', email: 'timar@example.com' },
    }),
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

  it('should return access token on login', async () => {
    const result = await controller.login({
      email: 'timar@example.com',
      password: '123456',
    });
    expect(result.access_token).toBe('fake-jwt-token');
  });
});