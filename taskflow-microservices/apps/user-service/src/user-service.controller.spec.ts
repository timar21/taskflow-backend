import { Test, TestingModule } from '@nestjs/testing';
import { UserServiceController } from './user-service.controller';
import { UsersService } from './users.service';

describe('UserServiceController', () => {
  let controller: UserServiceController;

  const mockUser = { id: 1, name: 'Selome', email: 'user@test.com', role: 'user' };

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    remove: jest.fn().mockResolvedValue({ message: 'User with id 1 deleted successfully' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserServiceController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = app.get<UserServiceController>(UserServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll should return all users', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockUser]);
  });

  it('findOne should return a single user by id', async () => {
    const result = await controller.findOne({ id: 1 });
    expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(mockUser);
  });

  it('create should hand off to UsersService.create', async () => {
    const dto = { name: 'Selome', email: 'user@test.com', password: 'password123' };
    await controller.create(dto);
    expect(mockUsersService.create).toHaveBeenCalledWith(dto);
  });

  it('update should split id from the rest of the payload', async () => {
    await controller.update({ id: 1, name: 'Updated Name' });
    expect(mockUsersService.update).toHaveBeenCalledWith(1, { name: 'Updated Name' });
  });

  it('remove should hand off to UsersService.remove', async () => {
    const result = await controller.remove({ id: 1 });
    expect(mockUsersService.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual({ message: 'User with id 1 deleted successfully' });
  });
});