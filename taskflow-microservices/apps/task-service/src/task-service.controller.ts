import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectMessagePatterns, RequestUser } from '@app/shared';
import { ProjectsService } from './projects.service';

@Controller()
export class TaskServiceController {
  constructor(private readonly projectsService: ProjectsService) { }

  @MessagePattern(ProjectMessagePatterns.FIND_ALL_PROJECTS)
  findAll(@Payload() data: { currentUser: RequestUser }) {
    return this.projectsService.findAll(data.currentUser);
  }

  @MessagePattern(ProjectMessagePatterns.FIND_PROJECT_BY_ID)
  findOne(@Payload() data: { id: number; currentUser?: RequestUser }) {
    return this.projectsService.findOne(data.id, data.currentUser);
  }

  @MessagePattern(ProjectMessagePatterns.CREATE_PROJECT)
  create(
    @Payload()
    data: {
      name: string;
      description?: string;
      ownerId?: number;
      currentUser: RequestUser;
    },
  ) {
    const { currentUser, ...rest } = data;
    return this.projectsService.create(rest, currentUser);
  }

  @MessagePattern(ProjectMessagePatterns.UPDATE_PROJECT)
  update(
    @Payload()
    data: { id: number; name?: string; description?: string; currentUser: RequestUser },
  ) {
    const { id, currentUser, ...rest } = data;
    return this.projectsService.update(id, rest, currentUser);
  }

  @MessagePattern(ProjectMessagePatterns.DELETE_PROJECT)
  remove(@Payload() data: { id: number; currentUser: RequestUser }) {
    return this.projectsService.remove(data.id, data.currentUser);
  }
}