import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';

describe('ActivityLogsController', () => {
  let controller: ActivityLogsController;

  const mockLog = { action: 'Created project', userId: 1 };

  const mockActivityLogsService = {
    create: jest.fn().mockResolvedValue(mockLog),
    findAll: jest.fn().mockResolvedValue([mockLog]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLogsController],
      providers: [
        {
          provide: ActivityLogsService,
          useValue: mockActivityLogsService,
        },
      ],
    }).compile();

    controller = module.get<ActivityLogsController>(ActivityLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all logs', async () => {
    const logs = await controller.findAll();
    expect(logs).toHaveLength(1);
  });
});