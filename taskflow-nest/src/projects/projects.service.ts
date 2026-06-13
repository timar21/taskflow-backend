import { Injectable, NotFoundException } from '@nestjs/common';

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

    // Get all projects
    findAll(): Project[] {
        return this.projects;
    }

    // Get one project by id
    findOne(id: number): Project {
        const project = this.projects.find(p => p.id === id);
        if (!project) {
            throw new NotFoundException(`Project with id ${id} not found`);
        }
        return project;
    }

    // Create a new project
    create(data: { name: string; description?: string }): Project {
        const newProject: Project = {
            id: this.projects.length + 1,
            name: data.name,
            description: data.description ?? '',
        };
        this.projects.push(newProject);
        return newProject;
    }

    // Update an existing project
    update(id: number, data: Partial<{ name: string; description: string }>): Project {
        const project = this.findOne(id);
        if (data.name) project.name = data.name;
        if (data.description) project.description = data.description;
        return project;
    }

    // Delete a project
    remove(id: number): { message: string } {
        const index = this.projects.findIndex(p => p.id === id);
        if (index === -1) {
            throw new NotFoundException(`Project with id ${id} not found`);
        }
        this.projects.splice(index, 1);
        return { message: `Project with id ${id} deleted successfully` };
    }
}