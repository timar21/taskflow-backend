import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

    @Column({ select: false })
    password!: string;

    @Column({ type: 'varchar', select: false, nullable: true })
    hashedRefreshToken?: string | null;

    // Note: the OneToMany relations to Project/Task that existed in the
    // monolith's User entity are gone here on purpose — those entities now
    // live in task-service, in a different service's database. Cross-service
    // "relations" aren't modeled as TypeORM relations anymore; task-service
    // just stores a plain ownerId/assignedUserId number and asks user-service
    // (via RabbitMQ) when it actually needs a user's name/email.
}