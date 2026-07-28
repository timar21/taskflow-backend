import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from './project.entity';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ default: false })
    completed!: boolean;

    // Project stays a real TypeORM relation — both entities live in this
    // same service's database, so a real foreign key/join still works here.
    @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
    project!: Project;

    // Plain number, same reasoning as Project.ownerId — the assigned user
    // lives in user-service's database now, not this one.
    @Column({ nullable: true })
    assignedUserId?: number;
}