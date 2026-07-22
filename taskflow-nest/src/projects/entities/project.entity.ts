import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    Index,
    CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

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

    // Filterable via ?status=... on GET /projects
    @Index()
    @Column({ type: 'varchar', default: ProjectStatus.ACTIVE })
    status!: ProjectStatus;

    // Sortable via ?sortBy=date on GET /projects
    @CreateDateColumn()
    createdAt!: Date;

    // Many projects belong to one owner (User).
    // Indexed since findAll() filters by owner for every non-admin request.
    @Index()
    @ManyToOne(() => User, (user) => user.projects)
    owner!: User;

    // One project has many tasks
    @OneToMany(() => Task, (task) => task.project)
    tasks!: Task[];
}