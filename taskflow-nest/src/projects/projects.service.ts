import { Injectable } from '@nestjs/common';

export interface Project {
    id: number;
    name: string;
    description: string;
}

@Injectable()
export class ProjectsService {
    private projects: Project[] = [
        { id: 1, name: 'Taskflow API', description: 'Backend for task management' },
        { id: 2, name: 'Portfolio', description: 'Personal portfolio website' },
    ];

    findAll(): Project[] {
        return this.projects;
    }

    findOne(id: number): Project | undefined {
        return this.projects.find(p => p.id === id);
    }
}