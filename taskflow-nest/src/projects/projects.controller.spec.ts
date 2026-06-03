import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [ProjectsService],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all projects', () => {
    const projects = controller.findAll();
    expect(projects).toHaveLength(2);
  });

  it('should return one project by id', () => {
    const project = controller.findOne('1');
    expect(project).toBeDefined();
    expect(project.name).toBe('Taskflow API');
  });

  it('should throw NotFoundException for missing project', () => {
    expect(() => controller.findOne('99')).toThrow(NotFoundException);
  });
});