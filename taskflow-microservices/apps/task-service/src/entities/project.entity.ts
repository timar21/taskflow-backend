import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { Task } from './task.entity';

export enum ProjectStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    ARCHIVED = 'archived',
}

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ nullable: true })
    description!: string;

    @Index()
    @Column({ type: 'varchar', default: ProjectStatus.ACTIVE })
    status!: ProjectStatus;

    @CreateDateColumn()
    createdAt!: Date;

    // Plain number instead of a ManyToOne(User) relation — User now lives in
    // a different service's database, so there's no foreign key to join
    // against locally. Ownership is just a stored id, checked in application
    // code (ProjectsService.assertCanAccess) rather than the database.
    @Index()
    @Column()
    ownerId!: number;

    @OneToMany(() => Task, (task) => task.project)
    tasks!: Task[];
}