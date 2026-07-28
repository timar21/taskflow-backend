import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProjectsService, RequestUser } from './projects.service';

@Controller()
export class TaskServiceController {
  constructor(private readonly projectsService: ProjectsService) { }

  @MessagePattern('find_all_projects')
  findAll(@Payload() data: { currentUser: RequestUser }) {
    return this.projectsService.findAll(data.currentUser);
  }

  @MessagePattern('find_project_by_id')
  findOne(@Payload() data: { id: number; currentUser?: RequestUser }) {
    return this.projectsService.findOne(data.id, data.currentUser);
  }

  @MessagePattern('create_project')
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

  @MessagePattern('update_project')
  update(
    @Payload()
    data: { id: number; name?: string; description?: string; currentUser: RequestUser },
  ) {
    const { id, currentUser, ...rest } = data;
    return this.projectsService.update(id, rest, currentUser);
  }

  @MessagePattern('delete_project')
  remove(@Payload() data: { id: number; currentUser: RequestUser }) {
    return this.projectsService.remove(data.id, data.currentUser);
  }
}