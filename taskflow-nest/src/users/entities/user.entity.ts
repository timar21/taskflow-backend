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
    id!: number;

    @Column()
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ default: 'user' })
    role!: string;

    // Hashed password; excluded from default SELECTs so it never leaks in API responses
    @Column({ select: false })
    password!: string;

    // Hashed refresh token; excluded from default SELECTs, set on login, cleared on logout
    @Column({ type: 'varchar', select: false, nullable: true })
    hashedRefreshToken?: string | null;

    @OneToMany(() => Project, (project) => project.owner)
    projects!: Project[];

    @OneToMany(() => Task, (task) => task.assignedUser)
    tasks!: Task[];
}