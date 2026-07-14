import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ nullable: true })
    description!: string;

    // Many projects belong to one owner (User)
    @ManyToOne(() => User, (user) => user.projects)
    owner!: User;

    // One project has many tasks
    @OneToMany(() => Task, (task) => task.project)
    tasks!: Task[];
}