import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLog } from './schemas/activity-log.schema';

describe('ActivityLogsService', () => {
  let service: ActivityLogsService;

  const mockLog = { action: 'Created project', userId: 1 };

  const mockModel = {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockLog]),
      }),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogsService,
        {
          provide: getModelToken(ActivityLog.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ActivityLogsService>(ActivityLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all logs', async () => {
    const logs = await service.findAll();
    expect(logs).toHaveLength(1);
  });
});