import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { GatewayController } from './gateway.controller';

describe('GatewayController', () => {
  let controller: GatewayController;

  const mockUser = { id: 5, name: 'Selome', email: 'user@test.com', role: 'user' };

  const mockUserServiceClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [GatewayController],
      providers: [{ provide: 'USER_SERVICE', useValue: mockUserServiceClient }],
    }).compile();

    controller = app.get<GatewayController>(GatewayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should send find_all_users and return the result', async () => {
    mockUserServiceClient.send.mockReturnValue(of([mockUser]));
    const result = await controller.findAll();
    expect(mockUserServiceClient.send).toHaveBeenCalledWith('find_all_users', {});
    expect(result).toEqual([mockUser]);
  });

  it('getMe should return the current user from the request', async () => {
    const mockUser = { id: 5, name: 'Selome', email: 'user@test.com', role: 'user' };
    const result = await controller.getMe(mockUser);
    expect(result).toEqual(mockUser);
  });

  it('getUser should send find_user_by_id with a numeric id', async () => {
    mockUserServiceClient.send.mockReturnValue(of(mockUser));
    const result = await controller.getUser('5');
    expect(mockUserServiceClient.send).toHaveBeenCalledWith('find_user_by_id', { id: 5 });
    expect(result).toEqual(mockUser);
  });

  it('create should send create_user with the request body', async () => {
    mockUserServiceClient.send.mockReturnValue(of(mockUser));
    const body = { name: 'Selome', email: 'user@test.com', password: 'password123' };
    await controller.create(body);
    expect(mockUserServiceClient.send).toHaveBeenCalledWith('create_user', body);
  });

  it('update should send update_user with id merged into the body', async () => {
    mockUserServiceClient.send.mockReturnValue(of(mockUser));
    await controller.update('5', { name: 'New Name' });
    expect(mockUserServiceClient.send).toHaveBeenCalledWith('update_user', {
      id: 5,
      name: 'New Name',
    });
  });

  it('remove should send delete_user with a numeric id', async () => {
    mockUserServiceClient.send.mockReturnValue(of({ message: 'deleted' }));
    await controller.remove('5');
    expect(mockUserServiceClient.send).toHaveBeenCalledWith('delete_user', { id: 5 });
  });

  it('getUser should convert a service-side 404 into a real HttpException', async () => {
    mockUserServiceClient.send.mockReturnValue(
      throwError(() => ({ status: 404, message: 'User with id 999 not found' })),
    );

    await expect(controller.getUser('999')).rejects.toMatchObject({
      status: 404,
      message: 'User with id 999 not found',
    });
    await expect(controller.getUser('999')).rejects.toBeInstanceOf(HttpException);
  });
});