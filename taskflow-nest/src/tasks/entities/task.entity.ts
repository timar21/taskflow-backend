import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ default: false })
    completed: boolean;

    // Many tasks belong to one project
    @ManyToOne(() => Project, (project) => project.tasks)
    project: Project;

    // Many tasks can be assigned to one user (optional)
    @ManyToOne(() => User, (user) => user.tasks, { nullable: true })
    assignedUser: User;
}