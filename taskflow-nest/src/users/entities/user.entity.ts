import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    email: string;

    // One user can own many projects
    @OneToMany(() => Project, (project) => project.owner)
    projects: Project[];

    // One user can be assigned to many tasks
    @OneToMany(() => Task, (task) => task.assignedUser)
    tasks: Task[];
}