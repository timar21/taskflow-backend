import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all projects', () => {
    const projects = service.findAll();
    expect(projects).toHaveLength(2);
    expect(projects[0].name).toBe('Taskflow API');
  });

  it('should return one project by id', () => {
    const project = service.findOne(1);
    expect(project).toBeDefined();
    expect(project?.name).toBe('Taskflow API');
  });

  it('should return undefined for non-existent id', () => {
    const project = service.findOne(99);
    expect(project).toBeUndefined();
  });
});